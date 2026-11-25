from decimal import Decimal
from uuid import UUID

from app.models import Category, Product
from app.repositories import CatalogRepository


class CatalogService:
    def __init__(self, repository: CatalogRepository) -> None:
        self.repository = repository

    def list_categories(self) -> list[Category]:
        return self.repository.list_categories()

    def list_filter_options(self) -> tuple[list[str], list[str]]:
        return self.repository.list_filter_options()

    def list_products(
        self,
        *,
        query: str | None,
        category_slug: str | None,
        size: str | None,
        color: str | None,
        min_price: Decimal | None,
        max_price: Decimal | None,
        sort: str,
        skip: int,
        limit: int,
    ) -> tuple[list[Product], int]:
        if (
            min_price is not None
            and max_price is not None
            and min_price > max_price
        ):
            raise ValueError("min_price cannot exceed max_price")

        normalized_query = query.strip() if query else None
        return self.repository.list_products(
            query=normalized_query,
            category_slug=category_slug,
            size=size,
            color=color,
            min_price=min_price,
            max_price=max_price,
            sort=sort,
            skip=skip,
            limit=limit,
        )

    def get_product(self, product_id: UUID) -> Product | None:
        return self.repository.get_product(product_id)
