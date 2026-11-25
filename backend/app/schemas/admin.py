from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.schemas.catalog import (
    CategoryRead,
    ProductImageRead,
    ProductVariantRead,
)


class AdminLoginInput(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=1024)


class AdminTokenRead(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int


class CategoryWrite(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str = Field(
        min_length=1,
        max_length=120,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )

    @field_validator("name", "slug")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Поле не может быть пустым")
        return value


class AdminImageWrite(BaseModel):
    url: str = Field(min_length=1, max_length=1000)

    @field_validator("url")
    @classmethod
    def validate_image_url(cls, value: str) -> str:
        value = value.strip()
        if not (
            value.startswith("https://")
            or value.startswith("http://")
            or (value.startswith("/") and not value.startswith("//"))
        ):
            raise ValueError("Укажите URL изображения или локальный путь.")
        return value


class AdminVariantWrite(BaseModel):
    id: UUID | None = None
    size: str = Field(min_length=1, max_length=40)
    color: str = Field(min_length=1, max_length=80)
    stock: int = Field(ge=0)

    @field_validator("size", "color")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Поле не может быть пустым")
        return value


class AdminProductWrite(BaseModel):
    name: str = Field(min_length=1, max_length=250)
    description: str = Field(max_length=10000)
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    category_id: UUID
    is_published: bool
    images: list[AdminImageWrite] = Field(max_length=20)
    variants: list[AdminVariantWrite] = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def strip_required_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Название товара не может быть пустым.")
        return value

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def validate_unique_variants(self) -> "AdminProductWrite":
        variant_ids = [variant.id for variant in self.variants if variant.id]
        if len(variant_ids) != len(set(variant_ids)):
            raise ValueError("Вариант товара не может повторяться.")
        choices = [
            (variant.size.casefold(), variant.color.casefold())
            for variant in self.variants
        ]
        if len(choices) != len(set(choices)):
            raise ValueError("Размер и цвет варианта должны быть уникальными.")
        return self


class AdminProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str
    price: Decimal
    category: CategoryRead
    images: list[ProductImageRead]
    variants: list[ProductVariantRead]
    is_published: bool
    created_at: datetime
    updated_at: datetime


class AdminOrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_name: str
    variant_size: str
    variant_color: str
    quantity: int
    unit_price: Decimal


class AdminOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    number: str
    customer_name: str
    phone: str
    email: str
    delivery_address: str
    status: Literal["new", "processing", "cancelled"]
    total_amount: Decimal
    is_test: bool
    created_at: datetime
    items: list[AdminOrderItemRead]


class OrderStatusWrite(BaseModel):
    status: Literal["new", "processing", "cancelled"]
