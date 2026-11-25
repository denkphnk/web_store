from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Order, Product, ProductVariant


class OrderRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_published_variants(
        self,
        variant_ids: list[UUID],
        *,
        lock: bool = False,
    ) -> list[tuple[ProductVariant, Product]]:
        statement = (
            select(ProductVariant, Product)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(
                ProductVariant.id.in_(variant_ids),
                Product.is_published.is_(True),
            )
            .order_by(ProductVariant.id)
        )
        if lock:
            statement = statement.with_for_update(of=(ProductVariant, Product))
        return list(self.session.execute(statement).all())

    def add_order(self, order: Order) -> None:
        self.session.add(order)
        self.session.flush()
