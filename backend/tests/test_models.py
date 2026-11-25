import unittest

from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable

from app.models import Base


class ModelSchemaTests(unittest.TestCase):
    def test_tables_compile_for_postgresql(self) -> None:
        expected_tables = {
            "categories",
            "products",
            "product_images",
            "product_variants",
            "orders",
            "order_items",
        }
        self.assertEqual(set(Base.metadata.tables), expected_tables)

        for table in Base.metadata.sorted_tables:
            with self.subTest(table=table.name):
                ddl = str(CreateTable(table).compile(dialect=postgresql.dialect()))
                self.assertIn(f"CREATE TABLE {table.name}", ddl)

    def test_database_invariants_are_defined(self) -> None:
        variants = Base.metadata.tables["product_variants"]
        orders = Base.metadata.tables["orders"]

        self.assertIn(
            "ck_product_variants_stock_nonnegative",
            {constraint.name for constraint in variants.constraints},
        )
        self.assertIn(
            "ck_orders_status_valid",
            {constraint.name for constraint in orders.constraints},
        )


if __name__ == "__main__":
    unittest.main()
