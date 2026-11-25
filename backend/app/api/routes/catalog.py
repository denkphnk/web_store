from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories import CatalogRepository
from app.schemas.catalog import (
    CatalogFilterOptionsRead,
    CategoryRead,
    ProductDetailRead,
    ProductListRead,
)
from app.services import CatalogService

ProductSort = Literal["newest", "price_asc", "price_desc"]
router = APIRouter(prefix="/api/v1", tags=["catalog"])


def get_catalog_service(
    session: Annotated[Session, Depends(get_db)],
) -> CatalogService:
    return CatalogService(CatalogRepository(session))


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(
    service: Annotated[CatalogService, Depends(get_catalog_service)],
) -> list[CategoryRead]:
    return service.list_categories()


@router.get("/filters", response_model=CatalogFilterOptionsRead)
def list_filter_options(
    service: Annotated[CatalogService, Depends(get_catalog_service)],
) -> CatalogFilterOptionsRead:
    sizes, colors = service.list_filter_options()
    return CatalogFilterOptionsRead(sizes=sizes, colors=colors)


@router.get("/products", response_model=ProductListRead)
def list_products(
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    q: Annotated[str | None, Query(max_length=250)] = None,
    category: Annotated[str | None, Query(max_length=120)] = None,
    size: Annotated[str | None, Query(max_length=40)] = None,
    color: Annotated[str | None, Query(max_length=80)] = None,
    min_price: Annotated[Decimal | None, Query(ge=0)] = None,
    max_price: Annotated[Decimal | None, Query(ge=0)] = None,
    sort: ProductSort = "newest",
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 24,
) -> ProductListRead:
    try:
        items, total = service.list_products(
            query=q,
            category_slug=category,
            size=size,
            color=color,
            min_price=min_price,
            max_price=max_price,
            sort=sort,
            skip=skip,
            limit=limit,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return ProductListRead(items=items, total=total, skip=skip, limit=limit)


@router.get("/products/{product_id}", response_model=ProductDetailRead)
def get_product(
    product_id: UUID,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
) -> ProductDetailRead:
    product = service.get_product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return ProductDetailRead.model_validate(product)
