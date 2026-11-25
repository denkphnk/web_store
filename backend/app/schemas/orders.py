from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CartLineInput(BaseModel):
    variant_id: UUID
    quantity: int = Field(ge=1, le=50)
    expected_unit_price: Decimal | None = Field(default=None, ge=0)


class CartValidationRequest(BaseModel):
    items: list[CartLineInput] = Field(min_length=1, max_length=50)


class CartValidationItemRead(BaseModel):
    variant_id: UUID
    product_name: str | None
    size: str | None
    color: str | None
    quantity: int
    unit_price: Decimal | None
    available_stock: int
    available: bool
    price_changed: bool


class CartValidationRead(BaseModel):
    items: list[CartValidationItemRead]
    total_amount: Decimal
    can_checkout: bool
    prices_changed: bool


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=200)
    phone: str = Field(min_length=7, max_length=32)
    email: EmailStr
    delivery_address: str = Field(min_length=8, max_length=1000)
    items: list[CartLineInput] = Field(min_length=1, max_length=50)

    @field_validator("customer_name", "phone", "delivery_address")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Поле не может быть пустым")
        return value


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_name: str
    variant_size: str
    variant_color: str
    quantity: int
    unit_price: Decimal


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    number: str
    status: str
    total_amount: Decimal
    created_at: datetime
    items: list[OrderItemRead]
