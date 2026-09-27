from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
CLEAN_DIR = ROOT / "data" / "cleaned"
FIGURE_DIR = ROOT / "reports" / "figures"
SUMMARY_DIR = ROOT / "reports" / "summary_tables"


def normalize_category(category: str) -> str:
    value = category.strip().lower()
    if value == "tech":
        return "Technology"
    if value == "office supplies":
        return "Office Supplies"
    return category.strip().title()


def load_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    customers = pd.read_csv(RAW_DIR / "customers.csv")
    products = pd.read_csv(RAW_DIR / "products.csv")
    orders = pd.read_csv(RAW_DIR / "orders.csv", parse_dates=["order_date"])
    order_items = pd.read_csv(RAW_DIR / "order_items.csv")
    return customers, products, orders, order_items


def build_clean_sales() -> pd.DataFrame:
    customers, products, orders, order_items = load_data()

    products["category"] = products["category"].apply(normalize_category)
    product_lookup = products.drop(columns=["unit_price"])
    sales = (
        order_items.merge(product_lookup, on="product_id", how="left")
        .merge(orders, on="order_id", how="left")
        .merge(customers, on="customer_id", how="left")
    )

    sales["shipping_cost_allocated"] = sales["shipping_cost"] / sales.groupby("order_id")[
        "order_id"
    ].transform("count")
    sales["profit"] = sales["net_sales"] - sales["product_cost"] - sales["shipping_cost_allocated"]
    sales.loc[sales["returned"], "profit"] = sales.loc[sales["returned"], "profit"] - sales.loc[
        sales["returned"], "net_sales"
    ]
    sales["profit_margin"] = sales["profit"] / sales["net_sales"]
    sales["month"] = sales["order_date"].dt.to_period("M").astype(str)

    columns = [
        "order_id",
        "order_date",
        "month",
        "customer_id",
        "customer_name",
        "segment",
        "region",
        "sales_channel",
        "product_id",
        "product_name",
        "category",
        "quantity",
        "unit_price",
        "discount_rate",
        "gross_sales",
        "discount_amount",
        "net_sales",
        "product_cost",
        "shipping_cost_allocated",
        "profit",
        "profit_margin",
        "returned",
    ]
    return sales[columns]


def save_summary_tables(sales: pd.DataFrame) -> None:
    category_summary = (
        sales.groupby("category", as_index=False)
        .agg(
            revenue=("net_sales", "sum"),
            profit=("profit", "sum"),
            orders=("order_id", "nunique"),
            units=("quantity", "sum"),
            avg_discount=("discount_rate", "mean"),
        )
        .assign(profit_margin=lambda df: df["profit"] / df["revenue"])
        .sort_values("revenue", ascending=False)
    )

    region_summary = (
        sales.groupby("region", as_index=False)
        .agg(revenue=("net_sales", "sum"), profit=("profit", "sum"), orders=("order_id", "nunique"))
        .assign(profit_margin=lambda df: df["profit"] / df["revenue"])
        .sort_values("profit", ascending=False)
    )

    product_summary = (
        sales.groupby(["product_name", "category"], as_index=False)
        .agg(revenue=("net_sales", "sum"), profit=("profit", "sum"), units=("quantity", "sum"))
        .assign(profit_margin=lambda df: df["profit"] / df["revenue"])
        .sort_values("revenue", ascending=False)
    )

    category_summary.to_csv(SUMMARY_DIR / "category_summary.csv", index=False)
    region_summary.to_csv(SUMMARY_DIR / "region_summary.csv", index=False)
    product_summary.to_csv(SUMMARY_DIR / "product_summary.csv", index=False)


def save_figures(sales: pd.DataFrame) -> None:
    monthly = sales.groupby("month", as_index=False).agg(
        revenue=("net_sales", "sum"), profit=("profit", "sum")
    )

    plt.figure(figsize=(11, 6))
    plt.plot(monthly["month"], monthly["revenue"], marker="o", label="Revenue")
    plt.plot(monthly["month"], monthly["profit"], marker="o", label="Profit")
    plt.title("Monthly Revenue and Profit")
    plt.xlabel("Month")
    plt.ylabel("Amount")
    plt.xticks(rotation=45)
    plt.legend()
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "monthly_revenue_profit.png", dpi=150)
    plt.close()

    category = sales.groupby("category", as_index=False).agg(
        revenue=("net_sales", "sum"), profit=("profit", "sum")
    )

    plt.figure(figsize=(9, 6))
    plt.bar(category["category"], category["revenue"], label="Revenue")
    plt.bar(category["category"], category["profit"], label="Profit")
    plt.title("Revenue and Profit by Category")
    plt.xlabel("Category")
    plt.ylabel("Amount")
    plt.legend()
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "category_revenue_profit.png", dpi=150)
    plt.close()


def main() -> None:
    CLEAN_DIR.mkdir(parents=True, exist_ok=True)
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)
    SUMMARY_DIR.mkdir(parents=True, exist_ok=True)

    sales = build_clean_sales()
    sales.to_csv(CLEAN_DIR / "cleaned_retail_sales.csv", index=False)
    save_summary_tables(sales)
    save_figures(sales)

    print("Analysis complete")
    print(f"Rows analyzed: {len(sales):,}")
    print(f"Revenue: ${sales['net_sales'].sum():,.2f}")
    print(f"Profit: ${sales['profit'].sum():,.2f}")
    print(f"Profit margin: {sales['profit'].sum() / sales['net_sales'].sum():.1%}")


if __name__ == "__main__":
    main()
