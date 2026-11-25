import unittest
from decimal import Decimal
from unittest.mock import Mock

from app.repositories import CatalogRepository
from app.services import CatalogService


class CatalogServiceTests(unittest.TestCase):
    def test_rejects_reversed_price_range(self) -> None:
        repository = Mock(spec=CatalogRepository)
        service = CatalogService(repository)

        with self.assertRaisesRegex(ValueError, "min_price cannot exceed max_price"):
            service.list_products(
                query=None,
                category_slug=None,
                size=None,
                color=None,
                min_price=Decimal("100"),
                max_price=Decimal("50"),
                sort="newest",
                skip=0,
                limit=24,
            )

        repository.list_products.assert_not_called()


if __name__ == "__main__":
    unittest.main()
