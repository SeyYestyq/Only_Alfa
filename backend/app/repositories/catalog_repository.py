"""Доступ к search_catalog и news_feed."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infra.models import NewsFeedItem, SearchCatalogItem


class CatalogRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_items(self) -> list[SearchCatalogItem]:
        return list(self.session.scalars(select(SearchCatalogItem)).all())

    def list_by_cluster(self, cluster_code: str) -> list[SearchCatalogItem]:
        return list(self.session.scalars(
            select(SearchCatalogItem).where(SearchCatalogItem.cluster_code == cluster_code)
        ).all())

    def list_news(self, company_id: str, limit: int = 10) -> list[NewsFeedItem]:
        return list(self.session.scalars(
            select(NewsFeedItem)
            .where(NewsFeedItem.company_id == company_id)
            .order_by(NewsFeedItem.created_at.desc())
            .limit(limit)
        ).all())

    def add_news(
        self,
        company_id: str,
        title: str,
        text: str,
        cta: str,
        cluster: str,
        source: str = "NEWS_TO_ACTION",
        meta_json: dict | None = None,
    ) -> NewsFeedItem:
        item = NewsFeedItem(
            id=f"news_{uuid.uuid4().hex[:10]}",
            company_id=company_id,
            title=title,
            text=text,
            cta=cta,
            cluster=cluster,
            source=source,
            meta_json=meta_json or {},
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(item)
        self.session.flush()
        return item
