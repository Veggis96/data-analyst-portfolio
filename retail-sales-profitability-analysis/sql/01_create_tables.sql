CREATE TABLE customers (
    customer_id TEXT PRIMARY KEY,
    customer_name TEXT,
    segment TEXT,
    region TEXT
);

CREATE TABLE products (
    product_id TEXT PRIMARY KEY,
    product_name TEXT,
    category TEXT,
    unit_price NUMERIC,
    base_margin_rate NUMERIC
);

CREATE TABLE orders (
    order_id TEXT PRIMARY KEY,
    order_date DATE,
    customer_id TEXT,
    sales_channel TEXT,
    shipping_cost NUMERIC,
    returned BOOLEAN
);

CREATE TABLE order_items (
    order_id TEXT,
    line_number INTEGER,
    product_id TEXT,
    quantity INTEGER,
    unit_price NUMERIC,
    discount_rate NUMERIC,
    gross_sales NUMERIC,
    discount_amount NUMERIC,
    net_sales NUMERIC,
    product_cost NUMERIC,
    PRIMARY KEY (order_id, line_number)
);

