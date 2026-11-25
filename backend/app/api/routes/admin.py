from typing import Annotated, NoReturn
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.admin_auth import require_admin
from app.core.database import get_db
from app.repositories import AdminRepository
from app.schemas.admin import (
    AdminOrderRead,
    AdminProductRead,
    AdminProductWrite,
    CategoryWrite,
    OrderStatusWrite,
)
from app.schemas.catalog import CategoryRead
from app.services import AdminService, AdminServiceError

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


def get_admin_service(
    session: Annotated[Session, Depends(get_db)],
) -> AdminService:
    return AdminService(session, AdminRepository(session))


def raise_service_error(error: AdminServiceError) -> NoReturn:
    raise HTTPException(
        status_code=error.status_code,
        detail=str(error),
    ) from error


@router.get("/auth/me")
def read_admin_identity(
    username: Annotated[str, Depends(require_admin)],
) -> dict[str, str]:
    return {"username": username}


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(
    service: Annotated[AdminService, Depends(get_admin_service)],
) -> list[CategoryRead]:
    return service.list_categories()


@router.post(
    "/categories",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    request: CategoryWrite,
    service: Annotated[AdminService, Depends(get_admin_service)],
) -> CategoryRead:
    try:
        return service.create_category(request)
    except AdminServiceError as error:
        raise_service_error(error)


@router.patch("/categories/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: UUID,
    request: CategoryWrite,
    service: Annotated[AdminService, Depends(get_admin_service)],
) -> CategoryRead:
    try:
        return service.update_category(category_id, request)
    except AdminServiceError as error:
        raise_service_error(error)


@router.get("/products", response_model=list[AdminProductRead])
def list_products(
    service: Annotated[AdminService, Depends(get_admin_service)],
) -> list[AdminProductRead]:
    return service.list_products()


@router.post(
    "/products",
    response_model=AdminProductRead,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    request: AdminProductWrite,
    service: Annotated[AdminService, Depends(get_admin_service)],
) -> AdminProductRead:
    try:
        return service.create_product(request)
    except AdminServiceError as error:
        raise_service_error(error)


@router.put("/products/{product_id}", response_model=AdminProductRead)
def update_product(
    product_id: UUID,
    request: AdminProductWrite,
    service: Annotated[AdminService, Depends(get_admin_service)],
) -> AdminProductRead:
    try:
        return service.update_product(product_id, request)
    except AdminServiceError as error:
        raise_service_error(error)


@router.get("/orders", response_model=list[AdminOrderRead])
def list_orders(
    service: Annotated[AdminService, Depends(get_admin_service)],
) -> list[AdminOrderRead]:
    return service.list_orders()


@router.patch("/orders/{order_id}/status", response_model=AdminOrderRead)
def update_order_status(
    order_id: UUID,
    request: OrderStatusWrite,
    service: Annotated[AdminService, Depends(get_admin_service)],
) -> AdminOrderRead:
    try:
        return service.update_order_status(order_id, request.status)
    except AdminServiceError as error:
        raise_service_error(error)
