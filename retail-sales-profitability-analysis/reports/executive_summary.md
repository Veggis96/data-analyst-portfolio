# Executive Summary

## Objective

Identify which retail categories, products, regions, and customer segments are driving revenue, profit, and discount-related margin pressure.

## Method

The analysis joins order, order item, product, and customer tables into one cleaned sales table. Profit is calculated after product cost, allocated shipping cost, discounts, and returned orders.

## Metrics

- Revenue: net sales after discount
- Profit: revenue minus product cost, allocated shipping, and returned sales impact
- Profit margin: profit divided by revenue
- Return rate: share of orders marked as returned
- Discount rate: discount applied at order line level

## Key Findings

The cleaned dataset contains 1,729 order lines, $650,036 in revenue, and $87,718 in profit. The overall profit margin is 13.5%.

1. Furniture produced the highest revenue at $393,847, but had the weakest category margin at 11.3%.
2. Technology had the strongest category margin at 17.4%, despite lower revenue than Furniture.
3. Office Supplies sold the most units, but lower item prices limited total revenue.
4. West was the strongest region by both profit and margin, with $29,350 profit and a 17.1% margin.
5. North had the weakest regional margin at 11.3%, making it a priority for discount, pricing, and shipping review.

## Business Recommendations

1. Review Furniture discounts and shipping costs because the category generates high revenue but weak margins.
2. Protect Technology promotions because the category has the strongest profitability profile.
3. Investigate North region pricing, fulfillment, and discounting to understand why margins lag.
4. Prioritize dashboard monitoring for profit margin, not revenue alone.
5. Use customer segment and region filters in the final dashboard to support local decisions.

## Dashboard Notes

The cleaned file `data/cleaned/cleaned_retail_sales.csv` is ready to import into Power BI or Tableau.
