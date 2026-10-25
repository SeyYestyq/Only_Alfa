"""
Сценарии заявки: создание, State Machine, Мультибанк, ПЭП, действия инспектора,
пост-транзакционная рассрочка.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import (
    INSTALLMENT_MAX_MONTHS,
    INSTALLMENT_MIN_MONTHS,
    MANUAL_REVIEW_MAX_LIMIT,
    MANUAL_REVIEW_STARTER_LIMIT,
    MULTIBANK_DEFAULT_SHARE_OF_ALFA,
    MULTIBANK_REVENUE_TEKHNOSTROY,
)
from app.core.exceptions import EntityNotFound, InvalidRequest, InvalidTransition
from app.domain.anomaly import check_revenue_anomaly
from app.domain.decision.decision_engine import (
    build_counter_offers,
    calculate_rate,
    make_decision,
)
from app.domain.finances import (
    calculate_annuity_payment,
    calculate_credit_limit,
    calculate_max_payment,
)
from app.domain.scoring.risk_score import calculate_risk_score
from app.domain.state_machine.application_fsm import (
    SIGNING_STATUSES,
    UNDERWRITER_STATUSES,
    apply_transition,
    ensure_signing_authority,
)
from app.domain.types import (
    ApplicationStatus,
    CompanyProfile,
    DecisionOutcome,
    ProductType,
    ScoreResult,
    UserRole,
)
from app.infra.models import Application
from app.repositories.application_repository import ApplicationRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.transaction_repository import TransactionRepository
from app.services.presenters import PRODUCT_LABELS, STATUS_LABELS, application_detail, money

_UNDERWRITER_ACTIONS = {"APPROVE", "COUNTER_OFFER", "NEED_MORE_INFO", "REJECT"}


@dataclass
class PipelineResult:
    score: ScoreResult
    decision: object
    anomaly: object
    status: ApplicationStatus


def _status_from_decision(outcome: DecisionOutcome) -> ApplicationStatus:
    return {
        DecisionOutcome.APPROVED: ApplicationStatus.APPROVED,
        DecisionOutcome.COUNTER_OFFER: ApplicationStatus.COUNTER_OFFER,
        DecisionOutcome.MANUAL_REVIEW: ApplicationStatus.MANUAL_REVIEW,
        DecisionOutcome.REJECTED: ApplicationStatus.REJECTED,
    }[outcome]


class ApplicationService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.applications = ApplicationRepository(session)
        self.companies = CompanyRepository(session)
        self.transactions = TransactionRepository(session)

    # ── Публичные сценарии ────────────────────────────────────────────────
    def list_for_company(self, company_id: str) -> dict:
        from sqlalchemy import select

        rows = self.session.scalars(
            select(Application)
            .where(Application.company_id == company_id)
            .order_by(Application.created_at.desc())
        ).all()
        return {"applications": [
            {
                "application_id": row.id,
                "status": row.status,
                "status_label": STATUS_LABELS.get(row.status, row.status),
                "product_type": row.product_type,
                "product_label": PRODUCT_LABELS.get(row.product_type, row.product_type),
                "risk_score": row.risk_score,
                "requested_amount_rub": money(row.requested_amount_rub),
                "term_months": row.term_months,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]}

    def create(self, body) -> dict:
        profile = self.companies.get_by_id(body.company_id)
        if profile is None:
            raise EntityNotFound(f"Компания {body.company_id} не найдена")
        profile.declared_monthly_revenue = body.declared_monthly_revenue
        product = ProductType(body.product_type)
        collateral_type = getattr(body, "collateral_type", None) or "NONE"
        collateral_value = float(getattr(body, "collateral_value_rub", 0) or 0)

        draft = None
        if body.draft_application_id:
            draft = self.applications.get(body.draft_application_id)
            if draft is None or draft.company_id != profile.id:
                raise EntityNotFound("Черновик заявки не найден для этой компании")
            if draft.status != ApplicationStatus.DRAFT_BY_EMPLOYEE.value:
                raise InvalidTransition("Черновик уже отправлен в скоринг")

        pipeline = self._run_pipeline(
            profile,
            product,
            body.requested_amount_rub,
            body.term_months,
            collateral_type=collateral_type,
            collateral_value_rub=collateral_value,
        )

        application = draft or self.applications.create(
            company_id=profile.id,
            status=ApplicationStatus.DRAFT_BY_EMPLOYEE.value,
            product_type=product.value,
            requested_amount_rub=body.requested_amount_rub,
            term_months=body.term_months,
            declared_monthly_revenue=body.declared_monthly_revenue,
            collateral_type=collateral_type,
            collateral_value_rub=collateral_value,
            collateral_status="NONE",
            initiator_role=body.actor_role,
            risk_score=0,
            raw_score=0,
            is_hard_stop=False,
            hard_stop_reason=None,
            outcome=DecisionOutcome.MANUAL_REVIEW.value,
            approved_amount_rub=0.0,
            final_rate_pct=0.0,
            monthly_payment_rub=0.0,
            fcf_rub=0.0,
            max_payment_rub=0.0,
            k_sector=1.0,
            factors_breakdown_json=[],
            counter_offers_json=[],
            rejection_checklist_json=[],
            invoice_json=draft.invoice_json if draft else None,
        )

        previous_status = application.status
        apply_transition(
            ApplicationStatus(previous_status),
            pipeline.status,
            UserRole(body.actor_role),
            profile.legal_form,
        )
        self._persist_pipeline(application, profile, pipeline, body)
        self._write_checks(application, pipeline)
        self.companies.sync_financial_state(
            profile.id,
            account_balance=profile.account_balance,
            monthly_revenue_multibank=profile.monthly_revenue_multibank,
            is_multibank_verified=profile.is_multibank_verified,
            declared_monthly_revenue=profile.declared_monthly_revenue,
        )
        self.companies.save_dna(profile.id, profile)
        self.applications.add_event(
            application_id=application.id,
            company_id=profile.id,
            event_type="APPLICATION_SUBMITTED" if draft else "APPLICATION_CREATED",
            actor_role=body.actor_role,
            previous_status=previous_status,
            new_status=ApplicationStatus.DRAFT_BY_EMPLOYEE.value,
            details=(
                f"{'Черновик отправлен в скоринг' if draft else 'Заявка создана'}, "
                f"requested={money(body.requested_amount_rub)} ₽"
            ),
        )
        self.applications.add_event(
            application_id=application.id,
            company_id=profile.id,
            event_type="STATUS_CHANGE",
            actor_role=body.actor_role,
            previous_status=previous_status,
            new_status=application.status,
            details=(
                f"RiskScore={application.risk_score}, outcome={application.outcome}, "
                f"requested={money(body.requested_amount_rub)} ₽"
            ),
        )
        self.session.commit()
        return self.detail(application.id)

    def get(self, application_id: str) -> dict:
        return self.detail(application_id)

    def verify_multibank(self, application_id: str) -> dict:
        application = self._get_application(application_id)
        profile = self._profile(application)
        current = ApplicationStatus(application.status)
        if current != ApplicationStatus.ANOMALY_VERIFICATION:
            raise InvalidTransition(
                f"Мультибанк доступен только из ANOMALY_VERIFICATION, текущий статус {current.value}"
            )

        previous_score = application.risk_score
        previous_limit = self._calculated_limit(profile, application)
        external_revenue = self._external_revenue(profile)

        # Выписки задаются абсолютной суммой: повторная верификация не удваивает оборот.
        profile.monthly_revenue_multibank = max(
            profile.monthly_revenue_multibank, external_revenue
        )
        profile.is_multibank_verified = True
        score = calculate_risk_score(profile)
        decision = make_decision(
            profile,
            score,
            application.requested_amount_rub,
            ProductType(application.product_type),
            application.term_months,
            key_rate_pct=settings.cbr_key_rate,
        )
        new_status = _status_from_decision(decision.outcome)
        apply_transition(current, new_status, UserRole.UNDERWRITER, profile.legal_form)

        self.applications.update(
            application,
            status=new_status.value,
            risk_score=score.final_score,
            raw_score=score.raw_score,
            is_hard_stop=score.is_hard_stop,
            hard_stop_reason=score.hard_stop_reason,
            outcome=decision.outcome.value,
            approved_amount_rub=decision.approved_amount_rub,
            final_rate_pct=decision.final_rate_pct,
            monthly_payment_rub=decision.monthly_payment_rub,
            fcf_rub=decision.fcf_rub,
            max_payment_rub=decision.max_payment_rub,
            k_sector=decision.k_sector,
            factors_breakdown_json=[asdict(factor) for factor in score.factors_breakdown],
            counter_offers_json=[asdict(offer) for offer in decision.counter_offers],
            rejection_checklist_json=decision.rejection_checklist,
            selected_offer_index=None,
        )
        new_limit = self._calculated_limit(profile, application)
        for check in self.applications.list_checks(application.id):
            if check.check_code == "REVENUE_ANOMALY":
                check.status = "RESOLVED"
        self.applications.add_check(
            application.id,
            "MULTIBANK",
            "VERIFIED",
            (
                f"Подтверждены выписки из Сбер / Т-Банк / ВТБ: +{external_revenue:,.0f} ₽/мес. "
                f"Фактор CF_MULTIBANK_VERIFIED применён, лимит увеличен на 25%."
            ),
            {"external_revenue_rub": external_revenue},
        )
        self.companies.sync_financial_state(
            profile.id,
            account_balance=profile.account_balance,
            monthly_revenue_multibank=profile.monthly_revenue_multibank,
            is_multibank_verified=True,
            declared_monthly_revenue=profile.declared_monthly_revenue,
        )
        self.companies.save_dna(profile.id, profile)
        self.applications.add_event(
            application_id=application.id,
            company_id=profile.id,
            event_type="MULTIBANK_VERIFIED",
            actor_role="SYSTEM",
            previous_status=current.value,
            new_status=new_status.value,
            details=(
                f"Балл {previous_score} → {score.final_score}, "
                f"расчётный лимит {previous_limit:,.0f} → {new_limit:,.0f} ₽ "
                f"(бонус +25% за подтверждённые выписки)"
            ),
        )
        self.session.commit()
        return {
            "application": self.detail(application.id),
            "previous_score": previous_score,
            "new_score": score.final_score,
            "score_delta": score.final_score - previous_score,
            "previous_limit": money(previous_limit),
            "new_limit": money(new_limit),
            "external_revenue_rub": money(external_revenue),
        }

    def accept_offer(self, application_id: str, offer_index: int, actor_role: str) -> dict:
        application = self._get_application(application_id)
        profile = self._profile(application)
        if application.status != ApplicationStatus.COUNTER_OFFER.value:
            raise InvalidTransition("Выбрать встречный оффер можно только в статусе COUNTER_OFFER")
        offers = application.counter_offers_json or []
        if offer_index < 1 or offer_index > len(offers):
            raise InvalidRequest(f"Оффер {offer_index} не найден: доступно {len(offers)}")
        offer = offers[offer_index - 1]
        role = UserRole(actor_role)
        apply_transition(
            ApplicationStatus.COUNTER_OFFER,
            ApplicationStatus.AWAITING_CEO_APPROVAL,
            role,
            profile.legal_form,
        )
        self.applications.update(
            application,
            status=ApplicationStatus.AWAITING_CEO_APPROVAL.value,
            selected_offer_index=offer_index,
            requested_amount_rub=offer["amount_rub"],
            approved_amount_rub=offer["amount_rub"],
            final_rate_pct=offer["rate_pct"],
            monthly_payment_rub=offer["monthly_payment_rub"],
            term_months=offer["term_months"],
            product_type=offer["product_type"],
        )
        self.applications.add_event(
            application_id=application.id,
            company_id=profile.id,
            event_type="OFFER_ACCEPTED",
            actor_role=role.value,
            previous_status=ApplicationStatus.COUNTER_OFFER.value,
            new_status=ApplicationStatus.AWAITING_CEO_APPROVAL.value,
            details=f"Выбран вариант {offer_index}: {offer['label']}, {offer['amount_rub']:,.0f} ₽",
        )
        self.session.commit()
        return self.detail(application.id)

    def ceo_approve(self, application_id: str, actor_role: str) -> dict:
        application = self._get_application(application_id)
        profile = self._profile(application)
        current = ApplicationStatus(application.status)
        if current not in SIGNING_STATUSES:
            raise InvalidTransition(
                f"Подписание ПЭП запрещено из статуса {current.value}"
            )
        role = UserRole(actor_role)
        ensure_signing_authority(role, profile.legal_form)

        # Условия уже зафиксированы: либо APPROVED, либо выбранный оффер (AWAITING_CEO_APPROVAL).
        approved_amount = application.approved_amount_rub
        rate = application.final_rate_pct
        monthly = application.monthly_payment_rub
        term = application.term_months

        if approved_amount <= 0:
            raise InvalidTransition("Нельзя профинансировать заявку с нулевой суммой одобрения")

        apply_transition(current, ApplicationStatus.FUNDED, role, profile.legal_form)
        previous_balance = profile.account_balance
        profile.account_balance += approved_amount
        self.applications.update(
            application,
            status=ApplicationStatus.FUNDED.value,
            approved_amount_rub=approved_amount,
            final_rate_pct=rate,
            monthly_payment_rub=monthly,
            term_months=term,
        )
        self.companies.sync_financial_state(
            profile.id,
            account_balance=profile.account_balance,
            monthly_revenue_multibank=profile.monthly_revenue_multibank,
            is_multibank_verified=profile.is_multibank_verified,
            declared_monthly_revenue=profile.declared_monthly_revenue,
        )
        self.companies.save_dna(profile.id, profile)
        self.applications.add_event(
            application_id=application.id,
            company_id=profile.id,
            event_type="PES_SIGNED",
            actor_role=role.value,
            previous_status=current.value,
            new_status=ApplicationStatus.FUNDED.value,
            details=(
                f"ПЭП подписан. Зачислено {approved_amount:,.0f} ₽, "
                f"баланс {previous_balance:,.0f} → {profile.account_balance:,.0f} ₽"
            ),
        )
        self.session.commit()
        return self.detail(application.id)

    def underwriter_action(self, application_id: str, body) -> dict:
        application = self._get_application(application_id)
        profile = self._profile(application)
        if body.action not in _UNDERWRITER_ACTIONS:
            raise InvalidRequest(f"Неизвестное действие инспектора: {body.action}")
        role = UserRole(body.actor_role)
        if role != UserRole.UNDERWRITER:
            from app.core.exceptions import RoleViolation

            raise RoleViolation("Действия инспектора доступны только роли UNDERWRITER")

        current = ApplicationStatus(application.status)
        if current not in UNDERWRITER_STATUSES:
            raise InvalidTransition(
                f"Действия инспектора недоступны из статуса {current.value}"
            )
        if body.action == "NEED_MORE_INFO" and current != ApplicationStatus.MANUAL_REVIEW:
            raise InvalidTransition("Повторный запрос документов из NEED_MORE_INFO запрещён")

        if body.action == "NEED_MORE_INFO":
            target = ApplicationStatus.NEED_MORE_INFO
            apply_transition(current, target, role, profile.legal_form)
            self.applications.update(application, status=target.value)
            self.applications.add_check(
                application.id,
                "DOCUMENT_REQUEST",
                "REQUESTED",
                body.comment or "Инспектор запросил подтверждающие документы",
                {"document_name": body.document_name or "Договор аренды"},
            )
            details = body.comment or "Запрошен документ у клиента"
        elif body.action == "REJECT":
            target = ApplicationStatus.REJECTED
            apply_transition(current, target, role, profile.legal_form)
            self.applications.update(application, status=target.value)
            details = body.comment or "Отказ на ручном разборе"
        elif body.action == "COUNTER_OFFER":
            target = ApplicationStatus.COUNTER_OFFER
            apply_transition(current, target, role, profile.legal_form)
            product = ProductType(application.product_type)
            score_result = calculate_risk_score(profile)
            max_payment = calculate_max_payment(profile)
            offers = build_counter_offers(
                profile,
                product,
                application.requested_amount_rub,
                application.term_months,
                score_result.final_score,
                max_payment,
                key_rate_pct=settings.cbr_key_rate,
            )
            self.applications.update(
                application,
                status=target.value,
                outcome=DecisionOutcome.COUNTER_OFFER.value,
                final_rate_pct=calculate_rate(
                    score_result.final_score, product, settings.cbr_key_rate
                ),
                max_payment_rub=max_payment,
                counter_offers_json=[asdict(offer) for offer in offers],
                selected_offer_index=None,
            )
            details = f"Инспектор сформировал {len(offers)} встречных предложения"
        else:
            if current == ApplicationStatus.NEED_MORE_INFO and not body.document_name:
                raise InvalidRequest(
                    "Для одобрения после NEED_MORE_INFO загрузите документ клиента (document_name)"
                )
            target = ApplicationStatus.APPROVED
            apply_transition(current, target, role, profile.legal_form)
            approved_amount = min(
                MANUAL_REVIEW_MAX_LIMIT,
                max(application.requested_amount_rub, MANUAL_REVIEW_STARTER_LIMIT),
            )
            rate = calculate_rate(application.risk_score, ProductType(application.product_type), key_rate_pct=settings.cbr_key_rate)
            monthly = calculate_annuity_payment(approved_amount, rate, application.term_months)
            self.applications.update(
                application,
                status=target.value,
                outcome=DecisionOutcome.APPROVED.value,
                approved_amount_rub=round(approved_amount, 2),
                final_rate_pct=rate,
                monthly_payment_rub=round(monthly, 2),
            )
            if body.document_name:
                self.applications.add_check(
                    application.id,
                    "CLIENT_DOCUMENT",
                    "UPLOADED",
                    f"Клиент загрузил документ: {body.document_name}",
                    {"document_name": body.document_name},
                )
            details = (
                f"Инспектор одобрил лимит {approved_amount:,.0f} ₽ "
                f"по лестнице лимитов 300 000 → 750 000 ₽"
            )

        self.applications.add_check(
            application.id,
            "UNDERWRITER_DECISION",
            body.action,
            details,
            {"comment": body.comment or "", "document_name": body.document_name},
        )
        self.applications.add_event(
            application_id=application.id,
            company_id=profile.id,
            event_type=f"UNDERWRITER_{body.action}",
            actor_role=role.value,
            previous_status=current.value,
            new_status=application.status,
            details=details,
        )
        self.session.commit()
        return self.detail(application.id)

    def installment(self, transaction_id: str, months: int) -> dict:
        if months < INSTALLMENT_MIN_MONTHS or months > INSTALLMENT_MAX_MONTHS:
            raise InvalidRequest(
                f"Срок рассрочки должен быть от {INSTALLMENT_MIN_MONTHS} до {INSTALLMENT_MAX_MONTHS} мес."
            )
        transaction = self.transactions.get(transaction_id)
        if transaction is None:
            raise EntityNotFound(f"Транзакция {transaction_id} не найдена")
        if transaction.direction != "OUT":
            raise InvalidRequest("Рассрочка доступна только для исходящих платежей")
        if not transaction.can_installment:
            raise InvalidRequest("Для этой транзакции рассрочка недоступна")
        if transaction.installment_taken:
            raise InvalidRequest("Рассрочка по этой транзакции уже оформлена")

        profile = self.companies.get_by_id(transaction.company_id)
        if profile is None:
            raise EntityNotFound("Компания транзакции не найдена")
        profile.account_balance += transaction.amount_rub
        self.transactions.mark_installment(transaction)
        self.companies.sync_financial_state(
            profile.id,
            account_balance=profile.account_balance,
            monthly_revenue_multibank=profile.monthly_revenue_multibank,
            is_multibank_verified=profile.is_multibank_verified,
            declared_monthly_revenue=profile.declared_monthly_revenue,
        )
        self.companies.save_dna(profile.id, profile)
        self.applications.add_event(
            application_id=None,
            company_id=profile.id,
            event_type="TRANSACTION_INSTALLMENT",
            actor_role="ACCOUNTANT",
            details=(
                f"Рассрочка на {months} мес. по операции «{transaction.description}» "
                f"на {transaction.amount_rub:,.0f} ₽"
            ),
        )
        self.session.commit()
        return {
            "transaction_id": transaction.id,
            "months": months,
            "monthly_payment_rub": money(transaction.amount_rub / months),
            "restored_amount_rub": money(transaction.amount_rub),
            "account_balance": money(profile.account_balance),
        }

    def create_draft(self, profile: CompanyProfile, invoice: dict, antifraud: dict, actor_role: str) -> dict:
        application = self.applications.create(
            company_id=profile.id,
            status=ApplicationStatus.DRAFT_BY_EMPLOYEE.value,
            product_type=ProductType.INVEST_LEASING.value,
            requested_amount_rub=invoice["amount_rub"],
            term_months=24,
            declared_monthly_revenue=profile.declared_monthly_revenue,
            initiator_role=actor_role,
            risk_score=0,
            raw_score=0,
            is_hard_stop=False,
            hard_stop_reason=None,
            outcome=DecisionOutcome.MANUAL_REVIEW.value,
            approved_amount_rub=0.0,
            final_rate_pct=0.0,
            monthly_payment_rub=0.0,
            fcf_rub=0.0,
            max_payment_rub=0.0,
            k_sector=1.0,
            factors_breakdown_json=[],
            counter_offers_json=[],
            rejection_checklist_json=[],
            invoice_json={**invoice, "antifraud": antifraud},
        )
        self.applications.add_check(
            application.id,
            "INVOICE_PARSED",
            "PASS" if antifraud["is_verified"] else "WARN",
            antifraud["message"],
            {"supplier_inn": invoice["supplier_inn"], "amount_rub": invoice["amount_rub"]},
        )
        deal_risk = invoice.get("supplier_deal_risk")
        if isinstance(deal_risk, dict):
            band = str(deal_risk.get("risk_band") or "")
            probability = deal_risk.get("deal_success_probability_pct")
            self.applications.add_check(
                application.id,
                "SUPPLIER_DEAL",
                "PASS" if band == "LOW" else "WARN",
                f"Проверка поставщика: успех сделки {probability}%",
                {
                    "supplier_inn": invoice.get("supplier_inn"),
                    "risk_band": band,
                    "probability_pct": probability,
                },
            )
        self.applications.add_event(
            application_id=application.id,
            company_id=profile.id,
            event_type="DRAFT_CREATED",
            actor_role=actor_role,
            new_status=ApplicationStatus.DRAFT_BY_EMPLOYEE.value,
            details=(
                f"Черновик из PDF-счёта: {invoice['supplier_name']}, "
                f"{invoice['amount_rub']:,.0f} ₽"
            ),
        )
        self.session.commit()
        return self.detail(application.id)

    # ── Внутренние методы ─────────────────────────────────────────────────
    def detail(self, application_id: str) -> dict:
        application = self._get_application(application_id)
        profile = self._profile(application)
        checks = self.applications.list_checks(application.id)
        return application_detail(application, profile, checks)

    def _get_application(self, application_id: str) -> Application:
        application = self.applications.get(application_id)
        if application is None:
            raise EntityNotFound(f"Заявка {application_id} не найдена")
        return application

    def _profile(self, application: Application) -> CompanyProfile:
        profile = self.companies.get_by_id(application.company_id)
        if profile is None:
            raise EntityNotFound("Компания заявки не найдена")
        return profile

    def _run_pipeline(
        self,
        profile: CompanyProfile,
        product: ProductType,
        requested_amount: float,
        term_months: int,
        *,
        collateral_type: str = "NONE",
        collateral_value_rub: float = 0.0,
    ) -> PipelineResult:
        score = calculate_risk_score(profile)
        decision = make_decision(
            profile,
            score,
            requested_amount,
            product,
            term_months,
            key_rate_pct=settings.cbr_key_rate,
            collateral_type=collateral_type,
            collateral_value_rub=collateral_value_rub,
        )
        anomaly = check_revenue_anomaly(profile)
        if score.is_hard_stop:
            status = ApplicationStatus.REJECTED
        elif anomaly.detected:
            status = ApplicationStatus.ANOMALY_VERIFICATION
        else:
            status = _status_from_decision(decision.outcome)
        return PipelineResult(score=score, decision=decision, anomaly=anomaly, status=status)

    @staticmethod
    def _resolve_collateral(body, decision_outcome: str) -> tuple[str, float, str]:
        from app.domain.decision.decision_engine import collateral_covers

        collateral_type = getattr(body, "collateral_type", None) or "NONE"
        collateral_value = float(getattr(body, "collateral_value_rub", 0) or 0)
        if collateral_type == "NONE" or collateral_value <= 0:
            return "NONE", 0.0, "NONE"
        requested = float(getattr(body, "requested_amount_rub", 0) or 0)
        if collateral_covers(requested, collateral_value):
            status = "APPROVED" if decision_outcome == DecisionOutcome.APPROVED.value else "UNDER_REVIEW"
            return collateral_type, collateral_value, status
        return collateral_type, collateral_value, "REJECTED"

    def _persist_pipeline(self, application: Application, profile: CompanyProfile,
                          pipeline: PipelineResult, body) -> None:
        score = pipeline.score
        decision = pipeline.decision
        collateral_type, collateral_value, collateral_status = self._resolve_collateral(
            body, decision.outcome.value
        )
        product_type = body.product_type
        if collateral_status == "APPROVED":
            product_type = ProductType.VKL_SEC.value
        self.applications.update(
            application,
            status=pipeline.status.value,
            product_type=product_type,
            requested_amount_rub=body.requested_amount_rub,
            term_months=body.term_months,
            declared_monthly_revenue=body.declared_monthly_revenue,
            collateral_type=collateral_type,
            collateral_value_rub=collateral_value,
            collateral_status=collateral_status,
            initiator_role=body.actor_role,
            risk_score=score.final_score,
            raw_score=score.raw_score,
            is_hard_stop=score.is_hard_stop,
            hard_stop_reason=score.hard_stop_reason,
            outcome=decision.outcome.value,
            approved_amount_rub=decision.approved_amount_rub,
            final_rate_pct=decision.final_rate_pct,
            monthly_payment_rub=decision.monthly_payment_rub,
            fcf_rub=decision.fcf_rub,
            max_payment_rub=decision.max_payment_rub,
            k_sector=decision.k_sector,
            factors_breakdown_json=[asdict(factor) for factor in score.factors_breakdown],
            counter_offers_json=[asdict(offer) for offer in decision.counter_offers],
            rejection_checklist_json=decision.rejection_checklist,
            selected_offer_index=None,
        )

    def _write_checks(self, application: Application, pipeline: PipelineResult) -> None:
        anomaly = pipeline.anomaly
        self.applications.add_check(
            application.id,
            "REVENUE_ANOMALY",
            "ANOMALY" if anomaly.detected else "CLEAR",
            anomaly.message,
            {
                "declared": anomaly.declared_monthly_revenue,
                "alfa": anomaly.alfa_monthly_revenue,
                "deviation_pct": anomaly.deviation_pct,
                "threshold_pct": anomaly.threshold_pct,
            },
        )
        score = pipeline.score
        self.applications.add_check(
            application.id,
            "RISK_SCORE",
            "HARD_STOP" if score.is_hard_stop else ("PASS" if score.final_score >= 650 else "WARN"),
            (
                f"RiskScore {score.final_score} (raw {score.raw_score}), "
                f"outcome {pipeline.decision.outcome.value}"
            ),
            {"score": score.final_score, "raw_score": score.raw_score},
        )
        collateral_status = getattr(application, "collateral_status", "NONE") or "NONE"
        if collateral_status != "NONE":
            check_status = {
                "APPROVED": "PASS",
                "UNDER_REVIEW": "WARN",
                "REJECTED": "WARN",
                "DRAFT": "WARN",
            }.get(collateral_status, "WARN")
            self.applications.add_check(
                application.id,
                "COLLATERAL",
                check_status,
                (
                    f"Залог {application.collateral_type}: "
                    f"{application.collateral_value_rub:,.0f} ₽ · {collateral_status}"
                ),
                {
                    "collateral_type": application.collateral_type,
                    "collateral_value_rub": application.collateral_value_rub,
                    "collateral_status": collateral_status,
                },
            )
        if score.is_hard_stop:
            self.applications.add_check(
                application.id,
                "HARD_STOP",
                "REJECTED",
                score.hard_stop_reason or "",
                {"reasons": score.hard_stop_reasons},
            )

    def _calculated_limit(self, profile: CompanyProfile, application: Application) -> float:
        if application.max_payment_rub <= 0 or application.final_rate_pct <= 0:
            return 0.0
        return calculate_credit_limit(
            profile,
            application.max_payment_rub,
            application.final_rate_pct,
            application.term_months,
        )

    def _external_revenue(self, profile: CompanyProfile) -> float:
        base = (
            MULTIBANK_REVENUE_TEKHNOSTROY
            if profile.demo_key == "tekhnostroy"
            else profile.monthly_revenue_alfa * MULTIBANK_DEFAULT_SHARE_OF_ALFA
        )
        declared_shortfall = max(0.0, profile.declared_monthly_revenue - profile.monthly_revenue_alfa)
        return round(max(base, declared_shortfall), 2)
