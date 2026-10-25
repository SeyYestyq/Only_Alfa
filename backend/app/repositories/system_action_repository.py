"""Проактивные действия системы для пилота и клиента."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infra.models import SystemAction


def _new_id() -> str:
    return f"sys_{uuid.uuid4().hex[:12]}"


class SystemActionRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_for_company(self, company_id: str) -> list[SystemAction]:
        return list(
            self.session.scalars(
                select(SystemAction)
                .where(SystemAction.company_id == company_id)
                .order_by(SystemAction.created_at.desc())
            ).all()
        )

    def get(self, action_id: str) -> SystemAction | None:
        return self.session.get(SystemAction, action_id)

    def create(self, **fields: Any) -> SystemAction:
        row = SystemAction(id=fields.pop("id", _new_id()), **fields)
        self.session.add(row)
        self.session.flush()
        return row

    def update(self, row: SystemAction, **fields: Any) -> SystemAction:
        for key, value in fields.items():
            setattr(row, key, value)
        self.session.flush()
        return row

    def mark_sent(self, row: SystemAction) -> SystemAction:
        return self.update(
            row,
            status="SENT",
            visible_to_client_at=datetime.now(timezone.utc),
        )

    def cancel(self, row: SystemAction) -> SystemAction:
        if row.status != "PENDING":
            return row
        return self.update(row, status="CANCELLED")
