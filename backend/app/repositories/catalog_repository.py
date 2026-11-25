from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy.sql.elements import ColumnElement

from app.models import Category, Product, ProductVariant


class CatalogRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_categories(self) -> list[Category]:
        statement = (
            select(Category)
            .where(Category.products.any(Product.is_published.is_(True)))
            .order_by(Category.name)
        )
        return list(self.session.scalars(statement).all())

    def list_filter_options(self) -> tuple[list[str], list[str]]:
        available_variants = (
            select(ProductVariant.id)
            .join(Product)
            .where(
                Product.is_published.is_(True),
                ProductVariant.stock > 0,
            )
        )
        sizes_statement = (
            select(ProductVariant.size)
            .where(ProductVariant.id.in_(available_variants))
            .distinct()
            .order_by(ProductVariant.size)
        )
        colors_statement = (
            select(ProductVariant.color)
            .where(ProductVariant.id.in_(available_variants))
            .distinct()
            .order_by(ProductVariant.color)
        )
        sizes = list(self.session.scalars(sizes_statement).all())
        colors = list(self.session.scalars(colors_statement).all())
        return sizes, colors

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
        filters: list[ColumnElement[bool]] = [Product.is_published.is_(True)]

        if query:
            filters.append(Product.name.ilike(f"%{query.strip()}%"))
        if category_slug:
            filters.append(Category.slug == category_slug)
        if min_price is not None:
            filters.append(Product.price >= min_price)
        if max_price is not None:
            filters.append(Product.price <= max_price)
        if size or color:
            variant_statement = select(ProductVariant.product_id).where(
                ProductVariant.stock > 0
            )
            if size:
                variant_statement = variant_statement.where(
                    ProductVariant.size == size
                )
            if color:
                variant_statement = variant_statement.where(
                    ProductVariant.color.ilike(color)
                )
            filters.append(Product.id.in_(variant_statement))

        count_statement = (
            select(func.count(Product.id))
            .select_from(Product)
            .join(Category)
            .where(*filters)
        )
        total = self.session.scalar(count_statement) or 0

        statement = (
            select(Product)
            .join(Category)
            .where(*filters)
            .options(
                joinedload(Product.category),
                selectinload(Product.images),
            )
        )
        if sort == "price_asc":
            statement = statement.order_by(Product.price.asc(), Product.id.asc())
        elif sort == "price_desc":
            statement = statement.order_by(Product.price.desc(), Product.id.desc())
        else:
            statement = statement.order_by(
                Product.created_at.desc(), Product.id.desc()
            )

        products = self.session.scalars(
            statement.offset(skip).limit(limit)
        ).all()
        return list(products), total

    def get_product(self, product_id: UUID) -> Product | None:
        statement = (
            select(Product)
            .where(
                Product.id == product_id,
                Product.is_published.is_(True),
            )
            .options(
                joinedload(Product.category),
                selectinload(Product.images),
                selectinload(Product.variants),
            )
        )
        return self.session.scalar(statement)
