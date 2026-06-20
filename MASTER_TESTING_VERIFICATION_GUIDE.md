# MASTER TESTING & VERIFICATION GUIDE: REPORTS IN SYNC WITH DATABASE

This master document serves as a complete reference guide for the QA and Testing teams to verify and audit calculations across the **Consolidated Sales Report**, **Day End Report**, and all **26 Sales Reports** on the test date **19-06-2026** (`2026-06-19`).

---

## 1. CONSOLIDATED SALES REPORT

### A. Purpose & Business Flow (Why We Use It)
*   **Why we use it:** The Consolidated Sales Report merges order transaction data from both the **live database tables** (active orders currently being processed) and **historical archive tables** (closed and settled orders). It is used to get the actual total of items sold and revenue earned across the entire lifecycle of the restaurant orders.
*   **Technical Flow:** The backend performs a `UNION ALL` between active (`Cur`) and historical tables to create unified datasets (`vwOrderDetailUnion` and `vwPaymentDetailUnion`), which it aggregates to build the report.

### B. Database Mapping (Tables & Columns)
*   **Unified Order Details (`vwOrderDetailUnion`):**
    *   Unions `dbo.vw_RestaurantOrderDetail` and `dbo.vw_RestaurantOrderDetailCur`.
    *   `TotalDetailLineAmount` ➔ **Net Sales** (Sum of quantity × unit price - item-level discounts).
*   **Unified Payment Details (`vwPaymentDetailUnion`):**
    *   Unions `dbo.vw_PaymentDetail` and `dbo.vw_PaymentDetailCur`.
    *   `RoundedBy` ➔ **Rounding**
    *   `TotalDiscountAmount` ➔ **Total Discount**
    *   `TotalAmountLessFreight` ➔ **Payment Amount** (grouped by payment mode name).

### C. SSMS Verification Queries (For Date `19/06/2026`)

#### **Query 1: Verify Consolidated Summary View**
```sql
DECLARE @start DATE = '2026-06-19';
DECLARE @end DATE = '2026-06-19';

WITH vwOrderDetailUnion AS (
    SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime
    FROM dbo.vw_RestaurantOrderDetail
    UNION ALL
    SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime
    FROM dbo.vw_RestaurantOrderDetailCur
),
vwPaymentDetailUnion AS (
    SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName
    FROM dbo.vw_PaymentDetail
    UNION ALL
    SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName
    FROM dbo.vw_PaymentDetailCur
)
SELECT
    ISNULL(SUM(vrod.TotalDetailLineAmount), 0) as NetSales,
    (SELECT ISNULL(SUM(RoundedBy), 0) FROM vwPaymentDetailUnion pd 
     WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end) as Rounding,
    (SELECT ISNULL(SUM(TotalDiscountAmount), 0) FROM vwPaymentDetailUnion pd 
     WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end) as TotalDiscount,
    ISNULL(SUM(vrod.TotalDetailLineAmount), 0) + 
    (SELECT ISNULL(SUM(RoundedBy), 0) FROM vwPaymentDetailUnion pd 
     WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end) as TotalRevenue
FROM vwOrderDetailUnion vrod
WHERE CAST(vrod.OrderDateTime AS DATE) BETWEEN @start AND @end;
```
*   **Expected Results:** NetSales: `497.00`, Rounding: `0.00`, TotalDiscount: `0.00`, TotalRevenue: `497.00`.

#### **Query 2: Verify Consolidated Detailed View**
```sql
DECLARE @start DATE = '2026-06-19';
DECLARE @end DATE = '2026-06-19';

WITH vwOrderDetailUnion AS (
    SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime
    FROM dbo.vw_RestaurantOrderDetail
    UNION ALL
    SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime
    FROM dbo.vw_RestaurantOrderDetailCur
),
vwPaymentDetailUnion AS (
    SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName
    FROM dbo.vw_PaymentDetail
    UNION ALL
    SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName
    FROM dbo.vw_PaymentDetailCur
)
SELECT
    dg.DishGroupName as CategoryName,
    dm.DishCode,
    dm.Name as DishName,
    od.Quantity,
    od.BaseAmount,
    od.TotalDetailLineAmount as LineSalesAmount,
    pd.BillNumber,
    ISNULL(CAST(pd.PayModeName AS VARCHAR(50)), 'UNKNOWN') as PayModeName
FROM vwOrderDetailUnion od
LEFT JOIN (
    SELECT OrderId, MAX(BillNumber) as BillNumber, MAX(PayModeName) as PayModeName
    FROM vwPaymentDetailUnion
    GROUP BY OrderId
) pd ON od.OrderId = pd.OrderId
INNER JOIN dbo.DishMaster dm ON od.DishId = dm.DishId
LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
ORDER BY dm.DishGroupId;
```
*   **Expected Results:** Lists the **3 items** sold (Noodles, Chicken, Veg Briyani) and the grand total sums up to exactly **`497.00`**.

### D. Explanation of Zero / Empty Columns
*   **Service Charge & Tax Collected = `0.00`:** The underlying consolidated transaction views (`vw_RestaurantOrderDetail`) only expose item-level amounts and quantities; they do not store tax or service charge calculations. Therefore, the query maps these to static `0.00` values by design.
*   **Paymode = `'UNKNOWN'`:** The payments in `vw_PaymentDetail` have `NULL` values in the `PayModeName` column in the database. The system translates these to `'UNKNOWN'` in both the query and UI so they can be tracked rather than disappearing.

---
---

## 2. DAY END REPORT

### A. Purpose & Business Flow (Why We Use It)
*   **Why we use it:** The Day End Report represents the finalized cashier reconciliation of a business day. It is generated when a terminal cashier closes their register (running the "Day End" routine). It matches total cash drawer collections and card transactions to the system's recorded invoices.
*   **Technical Flow:** It queries the **Settlement ledger tables** (`SettlementHeader` and `SettlementDetail`), which are populated only when a manager or cashier performs a Day End close action on the POS.

### B. Database Mapping (Tables & Columns)
*   **`dbo.SettlementHeader`:**
    *   `SubTotal` ➔ **Total Sales** (Gross sales recorded at settlement)
    *   `RoundedBy` ➔ **Round Off**
    *   `TotalTax` ➔ **Total Tax**
    *   `DiscountAmount` ➔ **Discount**
    *   `ServiceCharge` ➔ **Service Charge**
    *   `InvoiceCount` ➔ **No. of Invoices**
    *   `VoidItemQty` & `VoidItemAmount` ➔ **Voids Summary**
*   **`dbo.SettlementDetail`:**
    *   `Paymode` ➔ Payment mode identifier (e.g. `'CASH'`, `'CARD'`, `'NETS'`)
    *   `SysAmount` ➔ **Payment Collection Amount**

### C. SSMS Verification Queries (For Date `19/06/2026`)

#### **Query 1: Verify Day End Settlement Summary**
```sql
\
``
*   **Expected Results:** TotalSales: `103.50`, RoundOff: `0.00`, NetTotal: `103.50`, VoidQty: `1`, VoidAmt: `1.00`.

#### **Query 2: Verify Day End Cash vs Card Breakdown**
```sql
SELECT
    sd.Paymode,
    SUM(ISNULL(sd.SysAmount, 0)) as SysAmount,
    SUM(ISNULL(sd.ReceiptCount, 0)) as ReceiptCount
FROM dbo.SettlementDetail sd
INNER JOIN dbo.SettlementHeader sh ON sd.SettlementId = sh.SettlementID
WHERE CAST(DATEADD(HOUR, 8, sh.LastSettlementDate) AS DATE) = '2026-06-19'
GROUP BY sd.Paymode;
```

### D. Explanation of Zero / Empty Columns
*   **Total Tax & Discount = `0.00`:** If the POS transactions for the closed date did not apply any tax or discounts, the settlement ledger stores these as `0.00`.
*   **Receipt Count / Cashier code mismatch:** The cashier name displays the POS Terminal ID (e.g., `'SR'`), which is retrieved from the `TerminalCode` column of the database ledger.

---
---

## 3. SALES REPORTS (ALL 26 SUB-REPORTS)

This section provides verification queries for all 26 reports under the main Sales Report module for the date **19-06-2026** (`2026-06-19`).

### 1. Sales Summary Report
```sql
SELECT 
  CONVERT(VARCHAR, InvoiceDate, 103) AS Date,
  ROUND(SUM(TotalLineItemAmount), 2) AS Sales,
  ROUND(SUM(TotalDiscountAmount), 2) AS Disc,
  ROUND(SUM(ServiceCharge), 2) AS SVC,
  ROUND(SUM(TotalTax), 2) AS [Tax 7%]
FROM dbo.RestaurantInvoice
WHERE InvoiceDate >= '2026-06-19 00:00:00' AND InvoiceDate <= '2026-06-19 23:59:59'
GROUP BY CONVERT(VARCHAR, InvoiceDate, 103);
```

### 2. Business Type Report
```sql
SELECT 
  CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
  CASE WHEN ro.IsTakeAway = 1 THEN 'Take Away' ELSE 'Dine In' END AS Type,
  CAST(ISNULL(SUM(ro.TotalLineItemAmount), 0) AS DECIMAL(18,2)) AS SubTotal,
  CAST(ISNULL(SUM(ro.TotalDiscountAmount), 0) AS DECIMAL(18,2)) AS Discount,
  CAST(ISNULL(SUM(ro.ServiceCharge), 0) AS DECIMAL(18,2)) AS ServiceCharge,
  CAST(ISNULL(SUM(ro.TotalTax), 0) AS DECIMAL(18,2)) AS Tax,
  CAST(ISNULL(SUM(ro.TotalAmount), 0) AS DECIMAL(18,2)) AS NetTotal
FROM dbo.RestaurantOrder ro
INNER JOIN dbo.RestaurantInvoice ri ON ro.OrderId = ri.OrderId
WHERE ri.InvoiceDate >= '2026-06-19 00:00:00' AND ri.InvoiceDate <= '2026-06-19 23:59:59'
GROUP BY CONVERT(VARCHAR, ri.InvoiceDate, 103), ro.IsTakeAway;
```

### 3. Sales Journal (By Sales)
```sql
SELECT 
  CONVERT(VARCHAR, sh.LastDayEndDate, 103) AS Date,
  CAST(sh.SubTotal AS DECIMAL(18,2)) AS SubTotal,
  CAST(ISNULL(sh.DiscountAmount, 0) AS DECIMAL(18,2)) AS Discount,
  CAST(ISNULL(sh.ServiceCharge, 0) AS DECIMAL(18,2)) AS [Service Charge],
  CAST(ISNULL(sh.TotalTax, 0) AS DECIMAL(18,2)) AS [Total Tax],
  CAST(ISNULL(sh.RoundedBy, 0) AS DECIMAL(18,2)) AS [Round Off]
FROM dbo.SettlementHeader sh
WHERE sh.LastDayEndDate >= '2026-06-19' AND sh.LastDayEndDate <= '2026-06-19 23:59:59' AND sh.isDayEnd = 1;
```

### 4. Meal Period Report
```sql
SELECT 
  CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
  CASE 
    WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 6 AND 10 THEN 'BreakFast'
    WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 11 AND 16 THEN 'Lunch'
    WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 17 AND 22 THEN 'Dinner'
    ELSE 'Supper'
  END AS MealPeriod,
  COUNT(DISTINCT ri.OrderId) AS Bills,
  SUM(CAST(ri.TotalLineItemAmount AS DECIMAL(25,2))) AS [Sub Total]
FROM dbo.RestaurantOrder ro
INNER JOIN dbo.RestaurantInvoice ri ON ro.OrderId = ri.OrderId
WHERE ri.InvoiceDate >= '2026-06-19 00:00:00' AND ri.InvoiceDate <= '2026-06-19 23:59:59'
GROUP BY 
  CONVERT(VARCHAR, ri.InvoiceDate, 103),
  CASE 
    WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 6 AND 10 THEN 'BreakFast'
    WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 11 AND 16 THEN 'Lunch'
    WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 17 AND 22 THEN 'Dinner'
    ELSE 'Supper'
  END;
```

### 5. Sales Analysis Report
```sql
SELECT 
  CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
  COUNT(DISTINCT ri.OrderId) AS [No of Bills],
  SUM(CAST(ri.TotalLineItemAmount AS DECIMAL(25,2))) AS [Total Sales],
  SUM(CASE WHEN pm.PayMode = 'CASH' THEN pd.Amount ELSE 0 END) AS Cash,
  SUM(CASE WHEN pm.PayMode IN ('VISA', 'MASTERCARD', 'AMEX', 'DINERS', 'JCB') THEN pd.Amount ELSE 0 END) AS Cards
FROM dbo.RestaurantInvoice ri
LEFT JOIN dbo.PaymentDetail pd ON ri.RestaurantBillId = pd.RestaurantBillId
LEFT JOIN dbo.Paymode pm ON pd.Paymode = pm.Position
WHERE ri.InvoiceDate >= '2026-06-19 00:00:00' AND ri.InvoiceDate <= '2026-06-19 23:59:59'
GROUP BY CONVERT(VARCHAR, ri.InvoiceDate, 103);
```

### 6. Month wise Report
```sql
SELECT 
  vw.TotalDetailLineAmount, vw.OrderDateTime, vw.DishName, dgm.DishGroupName, cm.CategoryName
FROM dbo.Vw_MonthwiseSales vw
LEFT JOIN dbo.DishMaster dm ON vw.DishName = dm.Name
LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
WHERE vw.OrderDateTime >= '2026-06-19 00:00:00' AND vw.OrderDateTime <= '2026-06-19 23:59:59';
```

### 7. Quantity wise Report
```sql
SELECT 
  DATEPART(YEAR, vw.OrderDateTime) AS Year,
  DATENAME(MONTH, vw.OrderDateTime) AS Month,
  vw.DishName AS Item,
  dgm.DishGroupName,
  CAST(SUM(vw.TotalDetailLineAmount) AS DECIMAL(10,2)) AS Amount
FROM dbo.Vw_MonthwiseSales vw
LEFT JOIN dbo.DishMaster dm ON vw.DishName = dm.Name
LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
WHERE vw.OrderDateTime >= '2026-06-19 00:00:00' AND vw.OrderDateTime <= '2026-06-19 23:59:59'
GROUP BY DATEPART(YEAR, vw.OrderDateTime), DATENAME(MONTH, vw.OrderDateTime), vw.DishName, dgm.DishGroupName;
```

### 8. Category Report
```sql
SELECT 
  cm.CategoryName,
  SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS SoldQty,
  SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS Revenue
FROM dbo.RestaurantInvoice ri
INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
LEFT JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
WHERE ri.InvoiceDate >= '2026-06-19 00:00:00' AND ri.InvoiceDate <= '2026-06-19 23:59:59'
GROUP BY cm.CategoryName;
```

### 9. Dish Group Report
```sql
SELECT 
  cm.CategoryName,
  dgm.DishGroupName,
  SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
  SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS NetSales
FROM dbo.RestaurantInvoice ri
INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
LEFT JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
WHERE ri.InvoiceDate >= '2026-06-19 00:00:00' AND ri.InvoiceDate <= '2026-06-19 23:59:59'
GROUP BY cm.CategoryName, dgm.DishGroupName;
```

### 10. Dish Report
```sql
SELECT 
  cm.CategoryName,
  dgm.DishGroupName,
  dm.Name as DishName,
  SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
  SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS NetSales
FROM dbo.RestaurantInvoice ri
INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
WHERE ri.InvoiceDate >= '2026-06-19 00:00:00' AND ri.InvoiceDate <= '2026-06-19 23:59:59'
GROUP BY cm.CategoryName, dgm.DishGroupName, dm.Name;
```

### 11. Hourly Report
```sql
SELECT 
  DATEPART(HOUR, ri.OrderDateTime) as HourBlock,
  SUM(CAST(rd.TotalDetailLineAmount AS DECIMAL(18,2))) AS Amount
FROM dbo.RestaurantInvoice ri
INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
WHERE ri.OrderDateTime >= '2026-06-19' AND ri.OrderDateTime < '2026-06-19 23:59:59'
GROUP BY DATEPART(HOUR, ri.OrderDateTime);
```

### 12. Daywise Report
```sql
SELECT 
  CONVERT(VARCHAR, ri.OrderDateTime, 103) AS Date,
  COUNT(DISTINCT ri.OrderId) AS [No of Bills],
  SUM(CAST(rd.Quantity AS DECIMAL(18,2))) AS Qty,
  SUM(CAST(rd.TotalDetailLineAmount AS DECIMAL(18,2))) AS Amount
FROM dbo.RestaurantInvoice ri
JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
WHERE ri.OrderDateTime >= '2026-06-19' AND ri.OrderDateTime < '2026-06-19 23:59:59'
GROUP BY CONVERT(VARCHAR, ri.OrderDateTime, 103);
```

### 13. Itemwise Report
```sql
SELECT 
  dm.Name AS Item, 
  SUM(rd.Quantity) AS Qty, 
  SUM(rd.TotalDetailLineAmount) AS Amount
FROM dbo.RestaurantOrderDetail rd
JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
WHERE ri.OrderDateTime >= '2026-06-19' AND ri.OrderDateTime < '2026-06-19 23:59:59'
GROUP BY dm.Name
ORDER BY Amount DESC;
```

### 14. Group Report
```sql
SELECT 
  dgm.DishGroupName AS [Group],
  SUM(rd.Quantity) AS Qty,
  SUM(rd.TotalDetailLineAmount) AS Amount
FROM dbo.RestaurantOrderDetail rd
JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
WHERE ri.OrderDateTime >= '2026-06-19' AND ri.OrderDateTime < '2026-06-19 23:59:59'
GROUP BY dgm.DishGroupName;
```

### 15. Top N Items Report
```sql
SELECT 
  DishCode, DishName, CAST(Quantity AS DECIMAL(18,2)) AS Quantity, CAST(TotalDetailLineAmount AS DECIMAL(18,2)) AS Amount
FROM dbo.vw_NItemSalesReport
ORDER BY Quantity DESC;
```

### 16. Discount Summary Report
```sql
SELECT 
  RI.BillNumber, CAST(RO.TotalLineItemAmount AS DECIMAL(18,2)) AS SubTotal, CAST(RO.TotalDiscountAmount AS DECIMAL(18,2)) AS Discount, D.Description
FROM dbo.RestaurantOrder RO
LEFT JOIN dbo.Discount D ON RO.DiscountId = D.DiscountId
INNER JOIN dbo.RestaurantInvoice RI ON RO.OrderId = RI.OrderId
WHERE CAST(RI.InvoiceDate AS DATE) = '2026-06-19';
```

### 17. Refund Summary Report
```sql
SELECT 
  RI.BillNumber, DM.Name AS DishName, CAST(ROD.Quantity AS DECIMAL(18,2)) AS RefundedQty, CAST(ROD.TotalDetailLineAmount AS DECIMAL(18,2)) AS RefundedAmount
FROM dbo.RestaurantOrderDetail ROD
INNER JOIN dbo.RestaurantInvoice RI ON ROD.OrderId = RI.OrderId
INNER JOIN dbo.DishMaster DM ON ROD.DishId = DM.DishId
WHERE CAST(RI.InvoiceDate AS DATE) = '2026-06-19';
```

### 18. Table Change Report
```sql
SELECT 
  CONVERT(VARCHAR, OrderDateTime, 103) AS OrderDate, OrderNumber, SourceTable, Tableno AS NewTable, TotalAmount, ModifyUser
FROM dbo.vw_RestaurantOrder
WHERE CAST(OrderDateTime AS DATE) = '2026-06-19';
```

### 19. Paymode Report
```sql
SELECT 
  ISNULL(SUM(CASE WHEN UPPER(pm.PayMode) = 'CASH' THEN pd.Amount ELSE 0 END), 0) AS Cash,
  ISNULL(SUM(CASE WHEN UPPER(pm.PayMode) = 'NETS' THEN pd.Amount ELSE 0 END), 0) AS Nets,
  ISNULL(SUM(CASE WHEN UPPER(pm.PayMode) NOT IN ('CASH', 'CHEQUE', 'VISA', 'MASTERCARD', 'AMEX', 'DINERS', 'JCB', 'NETS', 'NEKTAR') THEN pd.Amount ELSE 0 END), 0) AS Others
FROM dbo.RestaurantInvoice ri
INNER JOIN dbo.PaymentDetail pd ON ri.RestaurantBillId = pd.RestaurantBillId
INNER JOIN dbo.Paymode pm ON pd.Paymode = pm.Position
WHERE CAST(ri.InvoiceDate AS DATE) = '2026-06-19';
```

### 20. Terminal Report
```sql
SELECT 
  ri.TerminalCode,
  ROUND(SUM(ri.TotalAmount), 2) AS Amount
FROM dbo.RestaurantInvoice ri
WHERE ri.InvoiceDate >= '2026-06-19' AND ri.InvoiceDate <= '2026-06-19 23:59:59'
GROUP BY ri.TerminalCode;
```

### 21. Journal Report (Day End)
```sql
SELECT 
  CONVERT(VARCHAR, sh.LastDayEndDate, 103) AS Date,
  CAST(sh.SubTotal AS DECIMAL(10,2)) AS SubTotal,
  CAST(ISNULL(sh.DiscountAmount, 0) AS DECIMAL(10,2)) AS Discount
FROM dbo.SettlementHeader sh
WHERE sh.LastDayEndDate >= '2026-06-19' AND sh.LastDayEndDate <= '2026-06-19 23:59:59' AND sh.isDayEnd = 1;
```

### 22. Journal Summary Report
```sql
SELECT 
  CAST(SUM(sh.SubTotal) AS DECIMAL(10,2)) AS [Sub Total],
  CAST(SUM(ISNULL(sh.DiscountAmount, 0)) AS DECIMAL(10,2)) AS Discount,
  CAST(SUM(ISNULL(sh.TotalTax, 0)) AS DECIMAL(10,2)) AS [Total Tax],
  CAST(SUM(sh.SubTotal) - SUM(ISNULL(sh.DiscountAmount, 0)) + SUM(ISNULL(sh.TotalTax, 0)) AS DECIMAL(10,2)) AS [Net Total]
FROM dbo.SettlementHeader sh
WHERE sh.LastDayEndDate >= '2026-06-19' AND sh.LastDayEndDate <= '2026-06-19 23:59:59';
```

### 23. Transaction Report
```sql
SELECT 
  TransactionMode,
  CAST(SUM(Amount) AS DECIMAL(10,2)) AS Amount
FROM dbo.TransactionMaster
WHERE isSettlement = 1 AND TransactionDate >= '2026-06-19' AND TransactionDate <= '2026-06-19 23:59:59'
GROUP BY TransactionMode;
```

### 24. Cancellation Report
```sql
SELECT 
  OrderNumber, TotalLineItemAmount, TotalTax, TotalAmount, StatusCode, Description
FROM dbo.RestaurantOrder
WHERE StatusCode IN (0, 2, 3, 6, 7) AND OrderDateTime >= '2026-06-19 00:00:00' AND OrderDateTime <= '2026-06-19 23:59:59';
```

### 25. Cancellation Detail Report
```sql
SELECT 
  RO.OrderNumber, DM.Name AS DishName, ROD.Quantity, CAST(ROD.TotalDetailLineAmount AS DECIMAL(18,2)) AS LineAmount, ROD.Remarks
FROM dbo.RestaurantOrder RO
INNER JOIN dbo.RestaurantOrderDetail ROD ON RO.OrderId = ROD.OrderId
INNER JOIN dbo.DishMaster DM ON ROD.DishId = DM.DishId
WHERE RO.StatusCode IN (0, 2, 3, 6, 7) AND RO.OrderDateTime >= '2026-06-19 00:00:00' AND RO.OrderDateTime <= '2026-06-19 23:59:59';
```

### 26. Guest Meal Report
```sql
SELECT 
  RI.BillNumber, CAST(RO.TotalAmount AS DECIMAL(10,2)) AS TotalAmount, D.Description
FROM dbo.RestaurantOrder RO
INNER JOIN dbo.Discount D ON RO.DiscountId = D.DiscountId
INNER JOIN dbo.PaymentDetail PD ON RO.OrderId = PD.OrderId
INNER JOIN dbo.RestaurantInvoice RI ON PD.RestaurantBillId = RI.RestaurantBillId
WHERE D.isGuestMeal = 1 AND CAST(RI.InvoiceDate AS DATE) = '2026-06-19';
```
