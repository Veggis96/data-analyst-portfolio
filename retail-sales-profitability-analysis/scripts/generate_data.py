from __future__ import annotations

import csv
import random
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"


random.seed(42)


CUSTOMER_SEGMENTS = ["Consumer", "Corporate", "Small Business"]
REGIONS = ["North", "South", "East", "West"]
PRODUCTS = [
    ("P001", "Laptop Stand", "Technology", 42, 0.48),
    ("P002", "Wireless Mouse", "Technology", 25, 0.44),
    ("P003", "USB-C Hub", "Technology", 64, 0.39),
    ("P004", "Office Chair", "Furniture", 210, 0.28),
    ("P005", "Standing Desk", "Furniture", 420, 0.24),
    ("P006", "Desk Lamp", "Furniture", 56, 0.35),
    ("P007", "Notebook Pack", "Office Supplies", 12, 0.52),
    ("P008", "Printer Paper", "Office Supplies", 18, 0.31),
    ("P009", "Ink Cartridge", "Office Supplies", 48, 0.36),
    ("P010", "Monitor", "Technology", 260, 0.30),
    ("P011", "Filing Cabinet", "Furniture", 185, 0.21),
    ("P012", "Whiteboard", "Office Supplies", 88, 0.33),
]


def ensure_dirs() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)


def write_customers() -> list[dict[str, str]]:
    customers = []
    for customer_id in range(1, 121):
        customers.append(
            {
                "customer_id": f"C{customer_id:04d}",
                "customer_name": f"Customer {customer_id:03d}",
                "segment": random.choice(CUSTOMER_SEGMENTS),
                "region": random.choice(REGIONS),
            }
        )

    with (RAW_DIR / "customers.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=customers[0].keys())
        writer.writeheader()
        writer.writerows(customers)

    return customers


def write_products() -> list[dict[str, str | float]]:
    products = []
    for product_id, name, category, price, margin_rate in PRODUCTS:
        messy_category = category
        if category == "Office Supplies" and random.random() < 0.25:
            messy_category = "office supplies"
        if category == "Technology" and random.random() < 0.15:
            messy_category = "Tech"

        products.append(
            {
                "product_id": product_id,
                "product_name": name,
                "category": messy_category,
                "unit_price": price,
                "base_margin_rate": margin_rate,
            }
        )

    with (RAW_DIR / "products.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=products[0].keys())
        writer.writeheader()
        writer.writerows(products)

    return products


def write_orders_and_items(
    customers: list[dict[str, str]], products: list[dict[str, str | float]]
) -> None:
    orders = []
    order_items = []
    start_date = date(2025, 1, 1)

    for order_number in range(1, 701):
        order_date = start_date + timedelta(days=random.randint(0, 364))
        customer = random.choice(customers)
        order_id = f"O{order_number:05d}"
        returned = random.random() < 0.055
        shipping_cost = round(random.uniform(4.5, 28.0), 2)

        orders.append(
            {
                "order_id": order_id,
                "order_date": order_date.isoformat(),
                "customer_id": customer["customer_id"],
                "sales_channel": random.choice(["Online", "Store", "Phone"]),
                "shipping_cost": shipping_cost,
                "returned": returned,
            }
        )

        for line_number in range(1, random.randint(2, 5)):
            product = random.choice(products)
            quantity = random.randint(1, 6)
            discount = random.choice([0, 0, 0, 0.05, 0.10, 0.15, 0.20, 0.25])
            unit_price = float(product["unit_price"])
            gross_sales = quantity * unit_price
            discount_amount = gross_sales * discount
            net_sales = gross_sales - discount_amount
            product_cost = gross_sales * (1 - float(product["base_margin_rate"]))

            order_items.append(
                {
                    "order_id": order_id,
                    "line_number": line_number,
                    "product_id": product["product_id"],
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "discount_rate": discount,
                    "gross_sales": round(gross_sales, 2),
                    "discount_amount": round(discount_amount, 2),
                    "net_sales": round(net_sales, 2),
                    "product_cost": round(product_cost, 2),
                }
            )

    with (RAW_DIR / "orders.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=orders[0].keys())
        writer.writeheader()
        writer.writerows(orders)

    with (RAW_DIR / "order_items.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=order_items[0].keys())
        writer.writeheader()
        writer.writerows(order_items)


def main() -> None:
    ensure_dirs()
    customers = write_customers()
    products = write_products()
    write_orders_and_items(customers, products)
    print(f"Generated raw CSV files in {RAW_DIR}")


if __name__ == "__main__":
    main()

