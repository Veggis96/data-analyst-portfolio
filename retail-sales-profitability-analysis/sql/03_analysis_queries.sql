-- 1. Revenue and profit by category
SELECT
    category,
    ROUND(SUM(net_sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(SUM(profit) / NULLIF(SUM(net_sales), 0), 4) AS profit_margin,
    COUNT(DISTINCT order_id) AS orders,
    SUM(quantity) AS units
FROM cleaned_retail_sales
GROUP BY category
ORDER BY revenue DESC;

-- 2. Monthly revenue and profit trend
SELECT
    month,
    ROUND(SUM(net_sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(SUM(profit) / NULLIF(SUM(net_sales), 0), 4) AS profit_margin
FROM cleaned_retail_sales
GROUP BY month
ORDER BY month;

-- 3. Top products by revenue
SELECT
    product_name,
    category,
    ROUND(SUM(net_sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    SUM(quantity) AS units
FROM cleaned_retail_sales
GROUP BY product_name, category
ORDER BY revenue DESC
LIMIT 10;

-- 4. Products with weak margins
SELECT
    product_name,
    category,
    ROUND(SUM(net_sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(SUM(profit) / NULLIF(SUM(net_sales), 0), 4) AS profit_margin
FROM cleaned_retail_sales
GROUP BY product_name, category
HAVING SUM(net_sales) > 1000
ORDER BY profit_margin ASC;

-- 5. Discount impact
SELECT
    CASE
        WHEN discount_rate = 0 THEN 'No discount'
        WHEN discount_rate <= 0.10 THEN 'Small discount'
        WHEN discount_rate <= 0.20 THEN 'Medium discount'
        ELSE 'High discount'
    END AS discount_band,
    ROUND(AVG(discount_rate), 4) AS avg_discount_rate,
    ROUND(SUM(net_sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(SUM(profit) / NULLIF(SUM(net_sales), 0), 4) AS profit_margin,
    SUM(quantity) AS units
FROM cleaned_retail_sales
GROUP BY discount_band
ORDER BY avg_discount_rate;

-- 6. Segment and region performance
SELECT
    region,
    segment,
    ROUND(SUM(net_sales), 2) AS revenue,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(SUM(profit) / NULLIF(SUM(net_sales), 0), 4) AS profit_margin,
    COUNT(DISTINCT customer_id) AS customers
FROM cleaned_retail_sales
GROUP BY region, segment
ORDER BY profit DESC;

