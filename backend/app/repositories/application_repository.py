"""Доступ к application / application_checks / application_events."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from app.infra.models import Application, ApplicationCheck, ApplicationEvent
from sqlalchemy.orm import Session


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class ApplicationRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, **fields: Any) -> Application:
        application = Application(id=fields.pop("id", _new_id("app")), **fields)
        self.session.add(application)
        self.session.flush()
        return application

    def get(self, application_id: str) -> Application | None:
        return self.session.get(Application, application_id)

    def update(self, application: Application, **fields: Any) -> Application:
        for key, value in fields.items():
            setattr(application, key, value)
        application.updated_at = datetime.now(timezone.utc)
        self.session.flush()
        return application

    def add_check(
        self,
        application_id: str,
        check_code: str,
        status: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> ApplicationCheck:
        check = ApplicationCheck(
            id=_new_id("chk"),
            application_id=application_id,
            check_code=check_code,
            status=status,
            message=message,
            details_json=details or {},
        )
        self.session.add(check)
        self.session.flush()
        return check

    def list_checks(self, application_id: str) -> list[ApplicationCheck]:
        return list(self.session.scalars(
            select(ApplicationCheck)
            .where(ApplicationCheck.application_id == application_id)
            .order_by(ApplicationCheck.created_at)
        ).all())

    def add_event(
        self,
        *,
        application_id: str | None,
        company_id: str | None,
        event_type: str,
        actor_role: str,
        previous_status: str | None = None,
        new_status: str | None = None,
        details: str = "",
    ) -> ApplicationEvent:
        event = ApplicationEvent(
            id=_new_id("evt"),
            application_id=application_id,
            company_id=company_id,
            event_type=event_type,
            actor_role=actor_role,
            previous_status=previous_status,
            new_status=new_status,
            details=details,
        )
        self.session.add(event)
        self.session.flush()
        return event

    def list_events(self, application_id: str) -> list[ApplicationEvent]:
        return list(self.session.scalars(
            select(ApplicationEvent)
            .where(ApplicationEvent.application_id == application_id)
            .order_by(ApplicationEvent.created_at)
        ).all())
