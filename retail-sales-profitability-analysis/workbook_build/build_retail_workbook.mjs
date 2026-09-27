import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "outputs", "retail-sales-workbook");
const outputPath = path.join(outputDir, "retail_sales_profitability_analysis.xlsx");
const previewPath = path.join(outputDir, "dashboard_preview.png");

const paths = {
  sales: path.join(root, "data", "cleaned", "cleaned_retail_sales.csv"),
  category: path.join(root, "reports", "summary_tables", "category_summary.csv"),
  region: path.join(root, "reports", "summary_tables", "region_summary.csv"),
  product: path.join(root, "reports", "summary_tables", "product_summary.csv"),
};

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"' && quoted && next === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  });
}

function typedRows(rows) {
  const headers = rows[0];
  return rows.map((row, rowIndex) => {
    if (rowIndex === 0) return row;
    return row.map((value, colIndex) => {
      const header = headers[colIndex];
      if (value === "True") return true;
      if (value === "False") return false;
      if (header === "order_date") return new Date(`${value}T00:00:00`);
      if (
        [
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
          "revenue",
          "orders",
          "units",
          "avg_discount",
        ].includes(header)
      ) {
        return Number(value);
      }
      return value;
    });
  });
}

function writeSheetTable(sheet, address, rows, tableName) {
  sheet.getRange(address).writeValues(rows);
  const [start, end] = address.split(":");
  const range = sheet.getRange(`${start}:${end}`);
  range.format.autofitColumns();
  range.format.autofitRows();
  range.format.borders = { preset: "outside", style: "thin", color: "#CBD5E1" };
  sheet.getRange(`${start}:${end}`).format.font = { name: "Aptos", size: 10 };
  const headerRow = sheet.getRange(`${start}:${start.replace(/\d+$/, "1")}`);
  headerRow.format = {
    fill: "#1F2937",
    font: { bold: true, color: "#FFFFFF", name: "Aptos", size: 10 },
  };
  try {
    const table = sheet.tables.add(address, true, tableName);
    table.style = "TableStyleMedium2";
    table.showFilterButton = true;
  } catch {
    // Keep the workbook useful even if table styling is unavailable in the runtime.
  }
}

function colName(index) {
  let result = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function rangeAddress(startRow, startCol, rows, cols) {
  const start = `${colName(startCol)}${startRow}`;
  const end = `${colName(startCol + cols - 1)}${startRow + rows - 1}`;
  return `${start}:${end}`;
}

const workbook = Workbook.create();
const dashboard = workbook.worksheets.add("Dashboard");
const categorySheet = workbook.worksheets.add("Category Summary");
const regionSheet = workbook.worksheets.add("Region Summary");
const productSheet = workbook.worksheets.add("Product Summary");
const salesSheet = workbook.worksheets.add("Sales Data");

for (const sheet of [dashboard, categorySheet, regionSheet, productSheet, salesSheet]) {
  sheet.showGridLines = false;
}

const salesRows = typedRows(parseCsv(await fs.readFile(paths.sales, "utf8")));
const categoryRows = typedRows(parseCsv(await fs.readFile(paths.category, "utf8")));
const regionRows = typedRows(parseCsv(await fs.readFile(paths.region, "utf8")));
const productRows = typedRows(parseCsv(await fs.readFile(paths.product, "utf8")));

const salesRange = rangeAddress(1, 0, salesRows.length, salesRows[0].length);
writeSheetTable(salesSheet, salesRange, salesRows, "SalesData");
salesSheet.freezePanes.freezeRows(1);
salesSheet.getRange("B2:B1730").format.numberFormat = "yyyy-mm-dd";
salesSheet.getRange("M2:S1730").format.numberFormat = "$#,##0.00";
salesSheet.getRange("N2:N1730").format.numberFormat = "0.0%";
salesSheet.getRange("T2:T1730").format.numberFormat = "$#,##0.00";
salesSheet.getRange("U2:U1730").format.numberFormat = "0.0%";

writeSheetTable(categorySheet, rangeAddress(1, 0, categoryRows.length, categoryRows[0].length), categoryRows, "CategorySummary");
writeSheetTable(regionSheet, rangeAddress(1, 0, regionRows.length, regionRows[0].length), regionRows, "RegionSummary");
writeSheetTable(productSheet, rangeAddress(1, 0, productRows.length, productRows[0].length), productRows, "ProductSummary");

categorySheet.getRange("B2:C4").format.numberFormat = "$#,##0";
categorySheet.getRange("F2:F4").format.numberFormat = "0.0%";
categorySheet.getRange("E2:E4").format.numberFormat = "0.0%";
regionSheet.getRange("B2:C5").format.numberFormat = "$#,##0";
regionSheet.getRange("E2:E5").format.numberFormat = "0.0%";
productSheet.getRange("C2:D13").format.numberFormat = "$#,##0";
productSheet.getRange("F2:F13").format.numberFormat = "0.0%";

dashboard.getRange("A1:H1").merge();
dashboard.getRange("A1").values = [["Retail Sales & Profitability Dashboard"]];
dashboard.getRange("A1:H1").format = {
  fill: "#0F172A",
  font: { bold: true, color: "#FFFFFF", name: "Aptos Display", size: 18 },
};
dashboard.getRange("A1:H1").format.rowHeightPx = 32;
dashboard.getRange("A2:H2").merge();
dashboard.getRange("A2").values = [["Portfolio workbook: revenue, profit, margin, category performance, and regional review"]];
dashboard.getRange("A2:H2").format = {
  fill: "#E2E8F0",
  font: { color: "#334155", name: "Aptos", size: 10 },
};

dashboard.getRange("A4:B7").values = [
  ["Revenue", null],
  ["Profit", null],
  ["Profit Margin", null],
  ["Order Lines", null],
];
dashboard.getRange("B4:B7").formulas = [
  ["=SUM('Sales Data'!$Q$2:$Q$1730)"],
  ["=SUM('Sales Data'!$T$2:$T$1730)"],
  ["=B5/B4"],
  ["=COUNTA('Sales Data'!$A$2:$A$1730)"],
];
dashboard.getRange("A4:B7").format = {
  fill: "#F8FAFC",
  borders: { preset: "outside", style: "thin", color: "#CBD5E1" },
};
dashboard.getRange("A4:A7").format.font = { bold: true, color: "#334155", name: "Aptos", size: 11 };
dashboard.getRange("B4:B5").format.numberFormat = "$#,##0";
dashboard.getRange("B6").format.numberFormat = "0.0%";
dashboard.getRange("B7").format.numberFormat = "#,##0";
dashboard.getRange("B4:B7").format.font = { bold: true, color: "#0F172A", name: "Aptos", size: 12 };

dashboard.getRange("D4:F7").values = [
  ["Finding", "Value", "Action"],
  ["Top revenue category", "Furniture", "Review margin pressure"],
  ["Best margin category", "Technology", "Protect profitable growth"],
  ["Best region", "West", "Replicate playbook"],
];
dashboard.getRange("D4:F4").format = {
  fill: "#1F2937",
  font: { bold: true, color: "#FFFFFF", name: "Aptos", size: 10 },
};
dashboard.getRange("D5:F7").format = {
  fill: "#F8FAFC",
  borders: { preset: "outside", style: "thin", color: "#CBD5E1" },
  font: { name: "Aptos", size: 10 },
};

dashboard.getRange("A10:F13").values = [
  ["Category", "Revenue", "Profit", "Orders", "Units", "Margin"],
  ...categoryRows.slice(1).map((row) => [row[0], row[1], row[2], row[3], row[4], null]),
];
dashboard.getRange("F11").formulas = [["=C11/B11"]];
dashboard.getRange("F11:F13").fillDown();
dashboard.getRange("A10:F10").format = {
  fill: "#1F2937",
  font: { bold: true, color: "#FFFFFF", name: "Aptos", size: 10 },
};
dashboard.getRange("B11:C13").format.numberFormat = "$#,##0";
dashboard.getRange("D11:E13").format.numberFormat = "#,##0";
dashboard.getRange("F11:F13").format.numberFormat = "0.0%";

dashboard.getRange("A17:E21").values = [
  ["Region", "Revenue", "Profit", "Orders", "Margin"],
  ...regionRows.slice(1).map((row) => [row[0], row[1], row[2], row[3], null]),
];
dashboard.getRange("E18").formulas = [["=C18/B18"]];
dashboard.getRange("E18:E21").fillDown();
dashboard.getRange("A17:E17").format = {
  fill: "#1F2937",
  font: { bold: true, color: "#FFFFFF", name: "Aptos", size: 10 },
};
dashboard.getRange("B18:C21").format.numberFormat = "$#,##0";
dashboard.getRange("D18:D21").format.numberFormat = "#,##0";
dashboard.getRange("E18:E21").format.numberFormat = "0.0%";

dashboard.getRange("H4:L10").values = [
  ["Product", "Category", "Revenue", "Profit", "Margin"],
  ...productRows.slice(1, 7).map((row) => [row[0], row[1], row[2], row[3], row[5]]),
];
dashboard.getRange("H4:L4").format = {
  fill: "#1F2937",
  font: { bold: true, color: "#FFFFFF", name: "Aptos", size: 10 },
};
dashboard.getRange("J5:K10").format.numberFormat = "$#,##0";
dashboard.getRange("L5:L10").format.numberFormat = "0.0%";

dashboard.getRange("A10:F13").format.borders = { preset: "outside", style: "thin", color: "#CBD5E1" };
dashboard.getRange("A17:E21").format.borders = { preset: "outside", style: "thin", color: "#CBD5E1" };
dashboard.getRange("H4:L10").format.borders = { preset: "outside", style: "thin", color: "#CBD5E1" };
dashboard.getRange("A:L").format.autofitColumns();
dashboard.getRange("A1:A40").format.columnWidthPx = 150;
dashboard.getRange("B1:B40").format.columnWidthPx = 115;
dashboard.getRange("C1:C40").format.columnWidthPx = 95;
dashboard.getRange("D1:D40").format.columnWidthPx = 155;
dashboard.getRange("E1:E40").format.columnWidthPx = 100;
dashboard.getRange("F1:F40").format.columnWidthPx = 170;
dashboard.getRange("H1:H40").format.columnWidthPx = 150;
dashboard.getRange("I1:I40").format.columnWidthPx = 115;
dashboard.getRange("J1:J40").format.columnWidthPx = 95;
dashboard.getRange("K1:K40").format.columnWidthPx = 85;
dashboard.getRange("L1:L40").format.columnWidthPx = 80;

const categoryChart = dashboard.charts.add("bar", dashboard.getRange("A10:C13"));
categoryChart.title = "Revenue and Profit by Category";
categoryChart.hasLegend = true;
categoryChart.yAxis = { numberFormatCode: "$#,##0" };
categoryChart.setPosition("A24", "F40");

const regionChart = dashboard.charts.add("bar", dashboard.getRange("A17:C21"));
regionChart.title = "Revenue and Profit by Region";
regionChart.hasLegend = true;
regionChart.yAxis = { numberFormatCode: "$#,##0" };
regionChart.setPosition("H12", "L28");

await fs.mkdir(outputDir, { recursive: true });

const errorScan = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errorScan.ndjson);

const preview = await workbook.render({
  sheetName: "Dashboard",
  range: "A1:L40",
  scale: 1,
  format: "png",
});
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);

console.log(JSON.stringify({ outputPath, previewPath, rows: salesRows.length - 1 }));
