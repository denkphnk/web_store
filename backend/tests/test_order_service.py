import unittest
from decimal import Decimal
from uuid import uuid4

from app.schemas.orders import CartLineInput
from app.services.order_service import OrderService


class OrderServiceTests(unittest.TestCase):
    def test_combines_duplicate_variant_lines(self) -> None:
        variant_id = uuid4()
        lines = [
            CartLineInput(
                variant_id=variant_id,
                quantity=2,
                expected_unit_price=Decimal("10.00"),
            ),
            CartLineInput(variant_id=variant_id, quantity=3),
        ]

        combined = OrderService._combine_duplicate_lines(lines)

        self.assertEqual(combined[variant_id].quantity, 5)
        self.assertEqual(
            combined[variant_id].expected_unit_price,
            Decimal("10.00"),
        )

    def test_rejects_duplicate_variant_with_conflicting_prices(self) -> None:
        variant_id = uuid4()
        lines = [
            CartLineInput(
                variant_id=variant_id,
                quantity=1,
                expected_unit_price=Decimal("10.00"),
            ),
            CartLineInput(
                variant_id=variant_id,
                quantity=1,
                expected_unit_price=Decimal("12.00"),
            ),
        ]
        with self.assertRaisesRegex(ValueError, "разными ценами"):
            OrderService._combine_duplicate_lines(lines)


if __name__ == "__main__":
    unittest.main()
