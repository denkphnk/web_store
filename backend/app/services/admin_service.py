from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Category, Order, Product, ProductImage, ProductVariant
from app.repositories import AdminRepository
from app.schemas.admin import AdminProductWrite, CategoryWrite


class AdminServiceError(Exception):
    status_code = 400


class AdminResourceNotFound(AdminServiceError):
    status_code = 404


class AdminConflictError(AdminServiceError):
    status_code = 409


class AdminService:
    def __init__(self, session: Session, repository: AdminRepository) -> None:
        self.session = session
        self.repository = repository

    def list_categories(self) -> list[Category]:
        return self.repository.list_categories()

    def create_category(self, data: CategoryWrite) -> Category:
        try:
            with self.session.begin():
                if self.repository.category_conflicts(data.name, data.slug):
                    raise AdminConflictError(
                        "Категория с таким названием или адресом уже существует."
                    )
                category = Category(name=data.name, slug=data.slug)
                self.repository.add_category(category)
            return category
        except IntegrityError as error:
            raise AdminConflictError(
                "Категория с таким названием или адресом уже существует."
            ) from error

    def update_category(
        self, category_id: UUID, data: CategoryWrite
    ) -> Category:
        try:
            with self.session.begin():
                category = self.repository.get_category(category_id)
                if category is None:
                    raise AdminResourceNotFound("Категория не найдена.")
                if self.repository.category_conflicts(
                    data.name, data.slug, exclude_id=category_id
                ):
                    raise AdminConflictError(
                        "Категория с таким названием или адресом уже существует."
                    )
                category.name = data.name
                category.slug = data.slug
                self.session.flush()
            return category
        except IntegrityError as error:
            raise AdminConflictError(
                "Категория с таким названием или адресом уже существует."
            ) from error

    def list_products(self) -> list[Product]:
        return self.repository.list_products()

    def create_product(self, data: AdminProductWrite) -> Product:
        try:
            with self.session.begin():
                category = self.repository.get_category(data.category_id)
                if category is None:
                    raise AdminResourceNotFound("Категория не найдена.")
                product = Product(
                    name=data.name,
                    description=data.description,
                    price=data.price,
                    category_id=category.id,
                    category=category,
                    is_published=data.is_published,
                )
                self._apply_images(product, data)
                product.variants = [
                    ProductVariant(
                        size=variant.size,
                        color=variant.color,
                        stock=variant.stock,
                    )
                    for variant in data.variants
                ]
                self.repository.add_product(product)
            return product
        except IntegrityError as error:
            raise AdminConflictError(
                "Не удалось сохранить товар: проверьте уникальность его вариантов."
            ) from error

    def update_product(
        self, product_id: UUID, data: AdminProductWrite
    ) -> Product:
        try:
            with self.session.begin():
                product = self.repository.get_product(product_id)
                if product is None:
                    raise AdminResourceNotFound("Товар не найден.")
                category = self.repository.get_category(data.category_id)
                if category is None:
                    raise AdminResourceNotFound("Категория не найдена.")

                product.name = data.name
                product.description = data.description
                product.price = data.price
                product.category_id = category.id
                product.category = category
                product.is_published = data.is_published
                self._apply_images(product, data)
                self._apply_variants(product, data)
                self.session.flush()
            return product
        except IntegrityError as error:
            raise AdminConflictError(
                "Не удалось сохранить товар: проверьте уникальность его вариантов."
            ) from error

    def list_orders(self) -> list[Order]:
        return self.repository.list_orders()

    def update_order_status(self, order_id: UUID, new_status: str) -> Order:
        with self.session.begin():
            order = self.repository.get_order(order_id, lock=True)
            if order is None:
                raise AdminResourceNotFound("Заказ не найден.")

            if order.status == new_status:
                return order

            quantities: dict[UUID, int] = {}
            for item in order.items:
                if item.variant_id is not None:
                    quantities[item.variant_id] = (
                        quantities.get(item.variant_id, 0) + item.quantity
                    )

            variants = self.repository.lock_variants(sorted(quantities))
            variants_by_id = {variant.id: variant for variant in variants}
            if order.status == "cancelled" and new_status != "cancelled":
                if len(variants_by_id) != len(quantities) or any(
                    item.variant_id is None for item in order.items
                ):
                    raise AdminConflictError(
                        "Нельзя восстановить заказ: некоторые варианты товара "
                        "больше недоступны."
                    )
                if any(
                    variants_by_id[variant_id].stock < quantity
                    for variant_id, quantity in quantities.items()
                ):
                    raise AdminConflictError(
                        "Недостаточно остатка, чтобы восстановить заказ."
                    )
                for variant_id, quantity in quantities.items():
                    variants_by_id[variant_id].stock -= quantity
            elif order.status != "cancelled" and new_status == "cancelled":
                for variant_id, quantity in quantities.items():
                    variant = variants_by_id.get(variant_id)
                    if variant is not None:
                        variant.stock += quantity

            order.status = new_status
            self.session.flush()
        return order

    @staticmethod
    def _apply_images(product: Product, data: AdminProductWrite) -> None:
        product.images = [
            ProductImage(url=image.url, position=position)
            for position, image in enumerate(data.images)
        ]

    @staticmethod
    def _apply_variants(product: Product, data: AdminProductWrite) -> None:
        existing = {variant.id: variant for variant in product.variants}
        submitted_ids: set[UUID] = set()

        for data_variant in data.variants:
            if data_variant.id is None:
                product.variants.append(
                    ProductVariant(
                        size=data_variant.size,
                        color=data_variant.color,
                        stock=data_variant.stock,
                    )
                )
                continue

            variant = existing.get(data_variant.id)
            if variant is None:
                raise AdminResourceNotFound(
                    "Вариант товара не найден или принадлежит другому товару."
                )
            submitted_ids.add(variant.id)
            variant.size = data_variant.size
            variant.color = data_variant.color
            variant.stock = data_variant.stock

        for variant in list(product.variants):
            if variant.id not in submitted_ids and variant.id in existing:
                product.variants.remove(variant)
