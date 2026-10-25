"""Проактивные действия: создание, отправка клиенту, лента пилота."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.domain.enrichment.proactive import collect_proactive_proposals
from app.domain.types import CompanyProfile
from app.repositories.catalog_repository import CatalogRepository
from app.repositories.system_action_repository import SystemActionRepository
from app.services.presenters import iso


class ProactiveService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.actions = SystemActionRepository(session)
        self.catalog = CatalogRepository(session)

    def ensure_demo_actions(self, profile: CompanyProfile) -> None:
        """Идемпотентно создаёт демо-действия по правилам для компании."""
        existing_codes = {
            row.rule_code
            for row in self.actions.list_for_company(profile.id)
            if row.status != "CANCELLED"
        }
        for proposal in collect_proactive_proposals(profile):
            if proposal.rule_code in existing_codes:
                continue
            self.actions.create(
                company_id=profile.id,
                application_id=None,
                rule_code=proposal.rule_code,
                title=proposal.title,
                explanation=proposal.explanation,
                client_text=proposal.client_text,
                status="PENDING",
                target_screen=proposal.target_screen,
                payload_json=proposal.as_dict(),
            )
        self.session.flush()

    def list_for_company(self, company_id: str) -> dict:
        rows = self.actions.list_for_company(company_id)
        return {
            "actions": [
                {
                    "id": row.id,
                    "rule_code": row.rule_code,
                    "title": row.title,
                    "explanation": row.explanation,
                    "client_text": row.client_text,
                    "status": row.status,
                    "target_screen": row.target_screen,
                    "payload": row.payload_json,
                    "visible_to_client_at": iso(row.visible_to_client_at),
                    "client_opened_at": iso(row.client_opened_at),
                    "client_response": row.client_response,
                    "created_at": iso(row.created_at),
                }
                for row in rows
            ]
        }

    def cancel(self, action_id: str) -> dict:
        row = self.actions.get(action_id)
        if row is None:
            from app.core.exceptions import EntityNotFound

            raise EntityNotFound(f"Действие {action_id} не найдено")
        self.actions.cancel(row)
        self.session.commit()
        return {"id": row.id, "status": row.status}

    def publish(self, action_id: str) -> dict:
        row = self.actions.get(action_id)
        if row is None:
            from app.core.exceptions import EntityNotFound

            raise EntityNotFound(f"Действие {action_id} не найдено")
        self.actions.mark_sent(row)
        payload = row.payload_json or {}
        self.catalog.add_news(
            row.company_id,
            title=row.title,
            text=row.client_text,
            cta=payload.get("cta", "Открыть"),
            cluster="PROACTIVE",
            source="NEWS_TO_ACTION",
            meta_json={
                "system_action_id": row.id,
                "target_screen": row.target_screen,
                "rule_code": row.rule_code,
                "offer_product_type": payload.get("offer_product_type"),
            },
        )
        self.session.commit()
        return {"id": row.id, "status": row.status}

    def mark_opened(self, action_id: str) -> dict:
        from datetime import datetime, timezone

        row = self.actions.get(action_id)
        if row is None:
            from app.core.exceptions import EntityNotFound

            raise EntityNotFound(f"Действие {action_id} не найдено")
        if row.client_opened_at is None:
            self.actions.update(row, client_opened_at=datetime.now(timezone.utc))
        self.session.commit()
        return {"id": row.id, "client_opened_at": iso(row.client_opened_at)}

    def mark_client_response(self, action_id: str, response: str) -> dict:
        row = self.actions.get(action_id)
        if row is None:
            from app.core.exceptions import EntityNotFound

            raise EntityNotFound(f"Действие {action_id} не найдено")
        self.actions.update(row, client_response=response[:500])
        self.session.commit()
        return {"id": row.id, "client_response": row.client_response}
