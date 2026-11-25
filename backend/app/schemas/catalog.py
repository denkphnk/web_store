from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str


class ProductImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    position: int


class ProductVariantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    size: str
    color: str
    stock: int


class ProductSummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str
    price: Decimal
    category: CategoryRead
    images: list[ProductImageRead]


class ProductDetailRead(ProductSummaryRead):
    variants: list[ProductVariantRead]


class ProductListRead(BaseModel):
    items: list[ProductSummaryRead]
    total: int
    skip: int
    limit: int


class CatalogFilterOptionsRead(BaseModel):
    sizes: list[str]
    colors: list[str]
