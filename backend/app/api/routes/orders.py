from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories import OrderRepository
from app.schemas.orders import (
    CartValidationRead,
    CartValidationRequest,
    OrderCreate,
    OrderRead,
)
from app.services import CartConflictError, OrderService

router = APIRouter(prefix="/api/v1", tags=["orders"])


def get_order_service(
    session: Annotated[Session, Depends(get_db)],
) -> OrderService:
    return OrderService(session, OrderRepository(session))


@router.post("/cart/validate", response_model=CartValidationRead)
def validate_cart(
    request: CartValidationRequest,
    service: Annotated[OrderService, Depends(get_order_service)],
) -> CartValidationRead:
    try:
        return service.validate_cart(request.items)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.post("/orders", response_model=OrderRead, status_code=201)
def create_order(
    request: OrderCreate,
    service: Annotated[OrderService, Depends(get_order_service)],
) -> OrderRead:
    try:
        order = service.create_order(request)
    except CartConflictError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return OrderRead.model_validate(order)
