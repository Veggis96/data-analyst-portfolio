CREATE VIEW cleaned_retail_sales AS
SELECT
    oi.order_id,
    o.order_date,
    strftime('%Y-%m', o.order_date) AS month,
    c.customer_id,
    c.customer_name,
    c.segment,
    c.region,
    o.sales_channel,
    p.product_id,
    p.product_name,
    CASE
        WHEN lower(trim(p.category)) = 'tech' THEN 'Technology'
        WHEN lower(trim(p.category)) = 'office supplies' THEN 'Office Supplies'
        ELSE p.category
    END AS category,
    oi.quantity,
    oi.unit_price,
    oi.discount_rate,
    oi.gross_sales,
    oi.discount_amount,
    oi.net_sales,
    oi.product_cost,
    o.shipping_cost * 1.0 / COUNT(*) OVER (PARTITION BY oi.order_id) AS shipping_cost_allocated,
    oi.net_sales
        - oi.product_cost
        - (o.shipping_cost * 1.0 / COUNT(*) OVER (PARTITION BY oi.order_id))
        - CASE WHEN o.returned THEN oi.net_sales ELSE 0 END AS profit,
    o.returned
FROM order_items AS oi
LEFT JOIN products AS p
    ON oi.product_id = p.product_id
LEFT JOIN orders AS o
    ON oi.order_id = o.order_id
LEFT JOIN customers AS c
    ON o.customer_id = c.customer_id;

