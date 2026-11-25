import unittest
from uuid import uuid4

from pydantic import ValidationError

from app.schemas.admin import AdminImageWrite, AdminProductWrite


class AdminSchemaTests(unittest.TestCase):
    def test_rejects_duplicate_variant_options(self) -> None:
        variant_id = uuid4()
        payload = {
            "name": "Куртка",
            "description": "",
            "price": "12000.00",
            "category_id": str(uuid4()),
            "is_published": False,
            "images": [],
            "variants": [
                {
                    "id": str(variant_id),
                    "size": "M",
                    "color": "Чёрный",
                    "stock": 2,
                },
                {
                    "size": "m",
                    "color": "чёрный",
                    "stock": 1,
                },
            ],
        }

        with self.assertRaises(ValidationError):
            AdminProductWrite.model_validate(payload)

    def test_rejects_unsafe_image_url_schemes(self) -> None:
        with self.assertRaises(ValidationError):
            AdminImageWrite(url="javascript:alert(1)")


if __name__ == "__main__":
    unittest.main()
