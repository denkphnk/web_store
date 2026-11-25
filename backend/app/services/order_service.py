from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models import Order, OrderItem, Product, ProductVariant
from app.repositories import OrderRepository
from app.schemas.orders import (
    CartLineInput,
    CartValidationItemRead,
    CartValidationRead,
    OrderCreate,
)


class CartConflictError(Exception):
    pass


class OrderService:
    def __init__(self, session: Session, repository: OrderRepository) -> None:
        self.session = session
        self.repository = repository

    def validate_cart(
        self, items: list[CartLineInput]
    ) -> CartValidationRead:
        validation, _, _ = self._build_validation(items)
        return validation

    def create_order(self, request: OrderCreate) -> Order:
        with self.session.begin():
            validation, requested, variants = self._build_validation(
                request.items, lock=True
            )
            if validation.prices_changed:
                raise CartConflictError(
                    "Цена изменилась. Проверьте обновлённую корзину и повторите оформление."
                )
            if not validation.can_checkout:
                raise CartConflictError(
                    "Некоторые варианты товара закончились или их остатка недостаточно."
                )

            order_id = uuid4()
            order = Order(
                id=order_id,
                number=f"ORD-{order_id.hex[:12].upper()}",
                customer_name=request.customer_name,
                phone=request.phone,
                email=str(request.email),
                delivery_address=request.delivery_address,
                total_amount=validation.total_amount,
            )

            for variant_id, item in requested.items():
                variant, product = variants[variant_id]
                variant.stock -= item.quantity
                order.items.append(
                    OrderItem(
                        product_id=product.id,
                        variant_id=variant.id,
                        product_name=product.name,
                        variant_size=variant.size,
                        variant_color=variant.color,
                        quantity=item.quantity,
                        unit_price=product.price,
                    )
                )

            self.repository.add_order(order)
        return order

    def _build_validation(
        self,
        items: list[CartLineInput],
        *,
        lock: bool = False,
    ) -> tuple[
        CartValidationRead,
        dict[UUID, CartLineInput],
        dict[UUID, tuple[ProductVariant, Product]],
    ]:
        requested = self._combine_duplicate_lines(items)
        rows = self.repository.get_published_variants(
            list(requested), lock=lock
        )
        variants = {variant.id: (variant, product) for variant, product in rows}

        validation_items: list[CartValidationItemRead] = []
        total_amount = Decimal("0.00")
        all_available = True
        any_price_changed = False

        for variant_id, item in requested.items():
            result = variants.get(variant_id)
            if result is None:
                validation_items.append(
                    CartValidationItemRead(
                        variant_id=variant_id,
                        product_name=None,
                        size=None,
                        color=None,
                        quantity=item.quantity,
                        unit_price=None,
                        available_stock=0,
                        available=False,
                        price_changed=False,
                    )
                )
                all_available = False
                continue

            variant, product = result
            price_changed = (
                item.expected_unit_price is not None
                and item.expected_unit_price != product.price
            )
            available = variant.stock >= item.quantity
            validation_items.append(
                CartValidationItemRead(
                    variant_id=variant_id,
                    product_name=product.name,
                    size=variant.size,
                    color=variant.color,
                    quantity=item.quantity,
                    unit_price=product.price,
                    available_stock=variant.stock,
                    available=available,
                    price_changed=price_changed,
                )
            )
            total_amount += product.price * item.quantity
            all_available = all_available and available
            any_price_changed = any_price_changed or price_changed

        return (
            CartValidationRead(
                items=validation_items,
                total_amount=total_amount,
                can_checkout=all_available,
                prices_changed=any_price_changed,
            ),
            requested,
            variants,
        )

    @staticmethod
    def _combine_duplicate_lines(
        items: list[CartLineInput],
    ) -> dict[UUID, CartLineInput]:
        combined: dict[UUID, CartLineInput] = {}
        for item in items:
            existing = combined.get(item.variant_id)
            if existing is None:
                combined[item.variant_id] = item
                continue
            if (
                existing.expected_unit_price is not None
                and item.expected_unit_price is not None
                and existing.expected_unit_price != item.expected_unit_price
            ):
                raise ValueError(
                    "Один вариант товара указан с разными ценами."
                )
            combined[item.variant_id] = CartLineInput(
                variant_id=item.variant_id,
                quantity=existing.quantity + item.quantity,
                expected_unit_price=(
                    existing.expected_unit_price
                    if existing.expected_unit_price is not None
                    else item.expected_unit_price
                ),
            )
        if any(item.quantity > 99 for item in combined.values()):
            raise ValueError("Нельзя заказать больше 99 единиц одного варианта.")
        return combined
