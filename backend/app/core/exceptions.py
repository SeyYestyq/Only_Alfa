"""Явные исключения домена. API-слой переводит их в HTTP-коды."""
from __future__ import annotations


class DomainError(Exception):
    """Базовое исключение бизнес-логики."""

    http_status: int = 400

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class InvalidINN(DomainError):
    http_status = 422


class InvalidTransition(DomainError):
    http_status = 409


class RoleViolation(DomainError):
    http_status = 403


class EntityNotFound(DomainError):
    http_status = 404


class AnomalyVerificationRequired(DomainError):
    http_status = 409


class TransactionNotEligible(DomainError):
    http_status = 400


class InvalidRequest(DomainError):
    http_status = 400


class InvoiceParseError(DomainError):
    http_status = 422
