"""
State Machine заявки. Единственное место, где разрешены переходы статусов.

Невалидный переход → InvalidTransition (HTTP 409).
Подписание ПЭП не той ролью → RoleViolation (HTTP 403).
"""
from __future__ import annotations

from app.core.exceptions import InvalidTransition, RoleViolation
from app.domain.types import ApplicationStatus, LegalForm, UserRole

S = ApplicationStatus

# (from, to) -> множество ролей, которым разрешён переход.
# Пустое множество = системный переход (проверяется на уровне сервиса).
_TRANSITIONS: dict[tuple[ApplicationStatus, ApplicationStatus], set[UserRole]] = {
    (S.DRAFT_BY_EMPLOYEE, S.ANOMALY_VERIFICATION): set(),
    (S.DRAFT_BY_EMPLOYEE, S.APPROVED): set(),
    (S.DRAFT_BY_EMPLOYEE, S.COUNTER_OFFER): set(),
    (S.DRAFT_BY_EMPLOYEE, S.MANUAL_REVIEW): set(),
    (S.DRAFT_BY_EMPLOYEE, S.REJECTED): set(),
    (S.ANOMALY_VERIFICATION, S.APPROVED): set(),
    (S.ANOMALY_VERIFICATION, S.COUNTER_OFFER): set(),
    (S.ANOMALY_VERIFICATION, S.MANUAL_REVIEW): set(),
    (S.ANOMALY_VERIFICATION, S.REJECTED): set(),
    (S.APPROVED, S.AWAITING_CEO_APPROVAL): {UserRole.CEO_OWNER, UserRole.IP_OWNER, UserRole.ACCOUNTANT},
    (S.APPROVED, S.FUNDED): {UserRole.CEO_OWNER, UserRole.IP_OWNER},
    # Контр-оффер: сначала accept-offer → AWAITING_CEO_APPROVAL, затем ПЭП → FUNDED.
    (S.COUNTER_OFFER, S.AWAITING_CEO_APPROVAL): {UserRole.CEO_OWNER, UserRole.IP_OWNER, UserRole.ACCOUNTANT},
    (S.AWAITING_CEO_APPROVAL, S.FUNDED): {UserRole.CEO_OWNER, UserRole.IP_OWNER},
    (S.MANUAL_REVIEW, S.NEED_MORE_INFO): {UserRole.UNDERWRITER},
    (S.MANUAL_REVIEW, S.APPROVED): {UserRole.UNDERWRITER},
    (S.MANUAL_REVIEW, S.COUNTER_OFFER): {UserRole.UNDERWRITER},
    (S.MANUAL_REVIEW, S.REJECTED): {UserRole.UNDERWRITER},
    (S.NEED_MORE_INFO, S.APPROVED): {UserRole.UNDERWRITER},
    (S.NEED_MORE_INFO, S.MANUAL_REVIEW): {
        UserRole.UNDERWRITER,
        UserRole.ACCOUNTANT,
        UserRole.CEO_OWNER,
        UserRole.IP_OWNER,
    },
    (S.NEED_MORE_INFO, S.REJECTED): {UserRole.UNDERWRITER},
}

SIGNING_STATUSES: frozenset[ApplicationStatus] = frozenset(
    {S.APPROVED, S.AWAITING_CEO_APPROVAL}
)
TERMINAL_STATUSES: frozenset[ApplicationStatus] = frozenset({S.FUNDED, S.REJECTED})
UNDERWRITER_STATUSES: frozenset[ApplicationStatus] = frozenset({S.MANUAL_REVIEW, S.NEED_MORE_INFO})


def ensure_signing_authority(actor_role: UserRole, legal_form: LegalForm) -> None:
    """ООО подписывает только CEO_OWNER, ИП — только сам предприниматель."""
    required = UserRole.CEO_OWNER if legal_form == LegalForm.OOO else UserRole.IP_OWNER
    if actor_role != required:
        raise RoleViolation(
            f"Подписание ПЭП для {legal_form.value} доступно только роли {required.value}"
        )


def validate_transition(
    current: ApplicationStatus,
    target: ApplicationStatus,
    actor_role: UserRole,
    legal_form: LegalForm,
) -> None:
    """Проверяет пару статусов и права роли. Ничего не мутирует."""
    allowed_roles = _TRANSITIONS.get((current, target))
    if allowed_roles is None:
        raise InvalidTransition(
            f"Переход {current.value} → {target.value} запрещён State Machine"
        )
    if target == ApplicationStatus.FUNDED:
        ensure_signing_authority(actor_role, legal_form)
        return
    if allowed_roles and actor_role not in allowed_roles:
        raise RoleViolation(
            f"Роль {actor_role.value} не может выполнить переход "
            f"{current.value} → {target.value}"
        )


def apply_transition(
    current: ApplicationStatus,
    target: ApplicationStatus,
    actor_role: UserRole,
    legal_form: LegalForm,
) -> ApplicationStatus:
    """Валидирует и возвращает новый статус (без мутации сущности)."""
    validate_transition(current, target, actor_role, legal_form)
    return target
