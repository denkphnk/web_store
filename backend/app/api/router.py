from fastapi import APIRouter

from app.api.routes.admin import router as admin_router
from app.api.routes.admin_auth import router as admin_auth_router
from app.api.routes.catalog import router as catalog_router
from app.api.routes.health import router as health_router
from app.api.routes.orders import router as orders_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(catalog_router)
api_router.include_router(orders_router)
api_router.include_router(admin_auth_router)
api_router.include_router(admin_router)
