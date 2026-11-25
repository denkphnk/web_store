import unittest
from contextlib import nullcontext
from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

from app.repositories import AdminRepository
from app.services.admin_service import AdminConflictError, AdminService


class AdminOrderInventoryTests(unittest.TestCase):
    def make_service(self, order, variants):
        session = Mock()
        session.begin.return_value = nullcontext()
        repository = Mock(spec=AdminRepository)
        repository.get_order.return_value = order
        repository.lock_variants.return_value = variants
        return AdminService(session, repository), session, repository

    def test_cancelling_order_releases_stock_once(self) -> None:
        variant_id = uuid4()
        order = SimpleNamespace(
            id=uuid4(),
            status="new",
            items=[SimpleNamespace(variant_id=variant_id, quantity=2)],
        )
        variant = SimpleNamespace(id=variant_id, stock=3)
        service, _, repository = self.make_service(order, [variant])

        service.update_order_status(order.id, "cancelled")
        service.update_order_status(order.id, "cancelled")

        self.assertEqual(variant.stock, 5)
        repository.lock_variants.assert_called_once_with([variant_id])

    def test_reopening_cancelled_order_reserves_stock(self) -> None:
        variant_id = uuid4()
        order = SimpleNamespace(
            id=uuid4(),
            status="cancelled",
            items=[SimpleNamespace(variant_id=variant_id, quantity=2)],
        )
        variant = SimpleNamespace(id=variant_id, stock=5)
        service, _, _ = self.make_service(order, [variant])

        service.update_order_status(order.id, "processing")

        self.assertEqual(variant.stock, 3)
        self.assertEqual(order.status, "processing")

    def test_reopening_cancelled_order_requires_available_stock(self) -> None:
        variant_id = uuid4()
        order = SimpleNamespace(
            id=uuid4(),
            status="cancelled",
            items=[SimpleNamespace(variant_id=variant_id, quantity=2)],
        )
        variant = SimpleNamespace(id=variant_id, stock=1)
        service, session, _ = self.make_service(order, [variant])

        with self.assertRaisesRegex(AdminConflictError, "Недостаточно остатка"):
            service.update_order_status(order.id, "new")

        self.assertEqual(variant.stock, 1)
        self.assertEqual(order.status, "cancelled")
        session.flush.assert_not_called()


if __name__ == "__main__":
    unittest.main()
