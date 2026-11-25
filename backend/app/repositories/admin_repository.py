from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Category, Order, Product, ProductVariant


class AdminRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_categories(self) -> list[Category]:
        statement = select(Category).order_by(Category.name)
        return list(self.session.scalars(statement).all())

    def get_category(self, category_id: UUID) -> Category | None:
        return self.session.get(Category, category_id)

    def category_conflicts(
        self,
        name: str,
        slug: str,
        *,
        exclude_id: UUID | None = None,
    ) -> bool:
        statement = select(Category.id).where(
            (Category.name == name) | (Category.slug == slug)
        )
        if exclude_id is not None:
            statement = statement.where(Category.id != exclude_id)
        return self.session.scalar(statement.limit(1)) is not None

    def add_category(self, category: Category) -> None:
        self.session.add(category)
        self.session.flush()

    def list_products(self) -> list[Product]:
        statement = (
            select(Product)
            .options(
                joinedload(Product.category),
                selectinload(Product.images),
                selectinload(Product.variants),
            )
            .order_by(Product.created_at.desc(), Product.id.desc())
        )
        return list(self.session.scalars(statement).all())

    def get_product(self, product_id: UUID) -> Product | None:
        statement = (
            select(Product)
            .where(Product.id == product_id)
            .options(
                joinedload(Product.category),
                selectinload(Product.images),
                selectinload(Product.variants),
            )
        )
        return self.session.scalar(statement)

    def add_product(self, product: Product) -> None:
        self.session.add(product)
        self.session.flush()

    def list_orders(self) -> list[Order]:
        statement = (
            select(Order)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc(), Order.id.desc())
        )
        return list(self.session.scalars(statement).all())

    def get_order(self, order_id: UUID, *, lock: bool = False) -> Order | None:
        statement = (
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.items))
        )
        if lock:
            statement = statement.with_for_update(of=Order)
        return self.session.scalar(statement)

    def lock_variants(
        self, variant_ids: list[UUID]
    ) -> list[ProductVariant]:
        if not variant_ids:
            return []
        statement = (
            select(ProductVariant)
            .where(ProductVariant.id.in_(variant_ids))
            .order_by(ProductVariant.id)
            .with_for_update()
        )
        return list(self.session.scalars(statement).all())
