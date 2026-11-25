from decimal import Decimal

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import Category, Product, ProductImage, ProductVariant

DEMO_CATEGORIES = [
    ("Футболки", "t-shirts"),
    ("Рубашки", "shirts"),
    ("Свитшоты и худи", "sweatshirts"),
    ("Брюки и джинсы", "trousers"),
    ("Верхняя одежда", "outerwear"),
]

DEMO_PRODUCTS = [
    (
        "Футболка базовая",
        "Плотный хлопок, свободная посадка на каждый день.",
        "1990.00",
        "t-shirts",
        "/images/products/basic-tee.svg",
        [("S", "Белый", 12), ("M", "Белый", 8), ("M", "Чёрный", 5), ("L", "Чёрный", 3)],
    ),
    (
        "Лонгслив хлопковый",
        "Мягкий хлопковый лонгслив с лаконичной отделкой.",
        "2690.00",
        "t-shirts",
        "/images/products/cotton-longsleeve.svg",
        [("S", "Молочный", 6), ("M", "Молочный", 10), ("L", "Графит", 4)],
    ),
    (
        "Рубашка из льна",
        "Лёгкая рубашка из смесового льна для тёплой погоды.",
        "4990.00",
        "shirts",
        "/images/products/linen-shirt.svg",
        [("S", "Голубой", 4), ("M", "Голубой", 7), ("L", "Белый", 5)],
    ),
    (
        "Худи свободного кроя",
        "Уютный футер и регулируемый капюшон.",
        "5990.00",
        "sweatshirts",
        "/images/products/relaxed-hoodie.svg",
        [("M", "Серый", 9), ("L", "Серый", 4), ("L", "Зелёный", 3)],
    ),
    (
        "Джинсы прямого кроя",
        "Классический деним средней плотности.",
        "6990.00",
        "trousers",
        "/images/products/straight-jeans.svg",
        [("28", "Синий", 3), ("30", "Синий", 6), ("32", "Синий", 5)],
    ),
    (
        "Куртка демисезонная",
        "Лёгкая куртка с карманами и высоким воротником.",
        "10990.00",
        "outerwear",
        "/images/products/light-jacket.svg",
        [("M", "Тёмно-синий", 2), ("L", "Тёмно-синий", 4)],
    ),
]


def seed_demo() -> None:
    with SessionLocal.begin() as session:
        categories: dict[str, Category] = {}
        for name, slug in DEMO_CATEGORIES:
            category = session.scalar(
                select(Category).where(Category.slug == slug)
            )
            if category is None:
                category = Category(name=name, slug=slug)
                session.add(category)
            categories[slug] = category
        session.flush()

        for name, description, price, category_slug, image_url, variants in DEMO_PRODUCTS:
            existing_product = session.scalar(
                select(Product).where(Product.name == name)
            )
            if existing_product is not None:
                if not existing_product.images:
                    existing_product.images.append(
                        ProductImage(url=image_url, position=0)
                    )
                continue
            session.add(
                Product(
                    name=name,
                    description=description,
                    price=Decimal(price),
                    category=categories[category_slug],
                    is_published=True,
                    images=[ProductImage(url=image_url, position=0)],
                    variants=[
                        ProductVariant(
                            size=size,
                            color=color,
                            stock=stock,
                        )
                        for size, color, stock in variants
                    ],
                )
            )


if __name__ == "__main__":
    seed_demo()
    print("Demo catalog is ready.")
