"""Доступ к таблице transactions."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infra.models import Transaction


class TransactionRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, transaction_id: str) -> Transaction | None:
        return self.session.get(Transaction, transaction_id)

    def list_by_company(self, company_id: str, limit: int = 20) -> list[Transaction]:
        return list(self.session.scalars(
            select(Transaction)
            .where(Transaction.company_id == company_id)
            .order_by(Transaction.occurred_at.desc())
            .limit(limit)
        ).all())

    def mark_installment(self, transaction: Transaction) -> None:
        transaction.installment_taken = True
        transaction.occurred_at = transaction.occurred_at or datetime.now(timezone.utc)
        self.session.flush()
