# QA & Testing Reference Guide: Sales Reporting Verification

This guide has been prepared specifically for the **QA and Testing Team** to facilitate direct database validation (SQL vs UI matching) for the **Consolidated Sales Report**, **Day End Report**, and **Sales Report** modules.

---

## 1. CONSOLIDATED SALES REPORT

### A. Purpose & Business Flow (Why We Use It)
*   **Why we use it:** The Consolidated Sales Report merges transaction data from both the **live database tables** (active orders currently being processed) and **historical archive tables** (closed and settled orders). It is the single source of truth for the total actual items sold and revenue earned across the entire lifecycle of the restaurant orders.
*   **Technical Flow:** The backend executes queries on views that perform a `UNION ALL` between current (`Cur`) and historical tables. 

---

### B. Database Mapping (Tables & Columns)
*   **Unified Order Details (`vwOrderDetailUnion`):**
    *   Unions `dbo.vw_RestaurantOrderDetail` and `dbo.vw_RestaurantOrderDetailCur`.
    *   `TotalDetailLineAmount` ➔ **Net Sales** (Sum of item quantity × unit price - item discounts).
*   **Unified Payment Details (`vwPaymentDetailUnion`):**
    *   Unions `dbo.vw_PaymentDetail` and `dbo.vw_PaymentDetailCur`.
    *   `RoundedBy` ➔ **Rounding**
    *   `TotalDiscountAmount` ➔ **Total Discount**
    *   `TotalAmountLessFreight` ➔ **Payment Amount** (grouped by payment mode name).

---

### C. SSMS Verification Queries (For Date `19/06/2026`)

#### **Query 1: Verify Consolidated Summary Metrics**
Run this query in SSMS to verify the values in the Consolidated Summary view:
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
*Expected Output matching UI:*
*   **NetSales:** `497.00`
*   **Rounding:** `0.00`
*   **TotalDiscount:** `0.00`
*   **TotalRevenue:** `497.00`

#### **Query 2: Verify Consolidated Detailed Items & Grand Total**
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

---

### D. Explanation of Zero / Empty Columns in Consolidated Report
*   **Service Charge & Tax Collected = `0.00`:** The underlying consolidated transaction views (`vw_RestaurantOrderDetail`) only expose item unit costs and detail amounts; they do not store tax or service charge calculations. Therefore, the query maps these to static `0.00` values by design.
*   **Paymode = `'UNKNOWN'`:** The transactions for `19-06-2026` have `NULL` values in the `PayModeName` column of the `vw_PaymentDetail` view in the database. The system dynamically translates these to `'UNKNOWN'` in both the query and UI so they can be tracked rather than disappearing.

---
---

## 2. DAY END REPORT

### A. Purpose & Business Flow (Why We Use It)
*   **Why we use it:** The Day End Report represents the finalized cashier reconciliation of a business day. It is generated when a terminal cashier closes their register (running the "Day End" routine). It matches total cash drawer collections and card transactions to the system's recorded invoices.
*   **Technical Flow:** It queries the **Settlement ledger tables** (`SettlementHeader` and `SettlementDetail`), which are populated only when a manager or cashier performs a Day End close action on the POS.

---

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

---

### C. SSMS Verification Queries (For Date `19/06/2026`)

#### **Query 1: Verify Day End Settlement Summary**
```sql
SELECT
    SUM(ISNULL(SubTotal, 0)) as TotalSales,
    SUM(ISNULL(RoundedBy, 0)) as RoundOff,
    SUM(ISNULL(TotalTax, 0)) as TotalTax,
    SUM(ISNULL(DiscountAmount, 0)) as Discount,
    SUM(ISNULL(ServiceCharge, 0)) as ServiceCharge,
    SUM(ISNULL(InvoiceCount, 0)) as BillsCount,
    SUM(ISNULL(VoidItemQty, 0)) as VoidQty,
    SUM(ISNULL(VoidItemAmount, 0)) as VoidAmt,
    SUM(ISNULL(SubTotal, 0)) + SUM(ISNULL(RoundedBy, 0)) as NetTotal
FROM dbo.SettlementHeader
WHERE CAST(DATEADD(HOUR, 8, LastSettlementDate) AS DATE) = '2026-06-19';
```
*Expected Output matching UI:*
*   **TotalSales:** `103.50`
*   **RoundOff:** `0.00`
*   **NetTotal:** `103.50`
*   **VoidQty:** `1`
*   **VoidAmt:** `1.00`

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

---

### D. Explanation of Zero / Empty Columns in Day End Report
*   **Total Tax & Discount = `0.00`:** If the POS transactions for the closed date did not apply any tax or discounts, the settlement ledger stores these as `0.00`.
*   **Receipt Count / Cashier code mismatch:** The cashier name displays the POS Terminal ID (e.g., `'SR'`), which is retrieved from the `TerminalCode` column of the database ledger.

---
---

## 3. SALES REPORT MODULE

### A. Purpose & Business Flow (Why We Use It)
*   **Why we use it:** The Sales Report module allows the management and audit teams to look at sales from different analytical dimensions (e.g., Hourly sales trends, Item sales ranks, Category/Department performance, and Cancellations/Refund logs).
*   **Technical Flow:** The backend executes specific SQL scripts matching the chosen parameter values (`bySales`, `byItem`, `orderSales`, `dayEnd`).

---

### B. Database Mapping (Tables & Columns)
*   **`dbo.RestaurantInvoice`:** Main table for summary and tax values.
    *   `TotalLineItemAmount` ➔ **Sales / Subtotal**
    *   `TotalTax` ➔ **Tax Collected**
*   **`dbo.RestaurantOrderDetail` joined with `dbo.DishMaster`:** Used for category and item-level breakdowns.
    *   `Quantity` ➔ **Qty Sold**
    *   `TotalDetailLineAmount` ➔ **Line Sales**

---

### C. SSMS Verification Queries (For Date `19/06/2026`)

#### **Query 1: Verify Sales Summary Report**
```sql
SELECT 
  CONVERT(VARCHAR, InvoiceDate, 103) AS Date,
  ROUND(SUM(TotalLineItemAmount), 2) AS Sales,
  ROUND(SUM(TotalDiscountAmount), 2) AS Disc,
  ROUND(SUM(ServiceCharge), 2) AS SVC,
  ROUND(SUM(TotalTax), 2) AS Tax
FROM dbo.RestaurantInvoice
WHERE InvoiceDate >= '2026-06-19 00:00:00' 
  AND InvoiceDate <= '2026-06-19 23:59:59'
GROUP BY CONVERT(VARCHAR, InvoiceDate, 103);
```
*Expected Output matching UI:*
*   **Sales:** `605.00` (Directly from invoice table)

#### **Query 2: Verify Paymode Collection (Day End Sub-Report)**
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
*Expected Output matching UI:*
*   **Cash:** `476.50`
*   **Nets:** `20.50`
*   **Others:** `108.00`

---

### D. Explanation of Zero / Empty Columns in Sales Reports
*   **Why does Sales Summary show `605.00` while Consolidated shows `497.00`?**
    *   The **Sales Summary** queries the raw `RestaurantInvoice` table. This table includes all invoice records written by the cash register.
    *   The **Consolidated Report** queries transaction details joined with employee IDs. Any test invoices created using blank or default system accounts (`CreatedBy = '00000000-0000...'`) are filtered out by view relationships (`UserMaster` join), leaving only the verified sales of `497.00`. Both values are database-correct based on their specific query constraints.
*   **Empty Payment Mode columns (e.g. Visa, MasterCard = `0.00`):** No transactions were swiped/processed under those payment card types on `19-06-2026`. Thus, the conditional aggregates evaluate to `0.00`.
*   **Others = `108.00`:** This column aggregates all payments that are not Cash, Cheque, Cards, Nets, or Nektar (e.g., PayNow or third-party gift vouchers).
