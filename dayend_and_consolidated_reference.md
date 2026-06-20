# Day End and Consolidated Reports Reference Manual

This document serves as a complete reference guide for the main **Day End Report** and the **Consolidated Sales Report** modules, detailing the flow, database tables, column mappings, and exact SQL queries.

---

## 1. Day End Report Module

This report displays the final closing metrics of a business day (e.g., when a register close is completed).

### A. How the Flow Works
1. The user selects a date range (e.g. `2026-06-19`) and cashier terminal.
2. The backend fetches organization info for the receipt header.
3. The backend queries `dbo.SettlementHeader` to retrieve the sales summary and `SettlementID`.
4. Using the `SettlementID`, the backend queries `dbo.SettlementDetail` to get the payment breakdown (e.g. Cash, Card collections).
5. All calculations are completed and returned to the frontend page.

### B. Tables and Columns Used
*   **`dbo.Organization`** (Header details)
    *   `Name`, `Address1_Line1`, `Address1_Line2`, `Address1_City`, `Address1_PostalCode`, `Address1_Telephone1`
*   **`dbo.SettlementHeader`** (Main summary details)
    *   `SubTotal` ➔ **Total Sales**
    *   `RoundedBy` ➔ **Round Off**
    *   `TotalTax` ➔ **Total Tax**
    *   `DiscountAmount` ➔ **Discount**
    *   `ServiceCharge` ➔ **Service Charge**
    *   `InvoiceCount` ➔ **Number of Bills**
    *   `VoidItemQty` ➔ **Void Quantity**
    *   `VoidItemAmount` ➔ **Void Amount**
    *   `TerminalCode` ➔ **Cashier/Terminal ID**
    *   `DayendRefNo` ➔ **Reference Number**
*   **`dbo.SettlementDetail`** (Payment Collections)
    *   `Paymode` ➔ Payment mode label (e.g., `'CASH'`, `'CARD'`, `'NETS'`)
    *   `SysAmount` ➔ **Amount Collected** for that payment mode.
    *   `ReceiptCount` ➔ **Transaction Count** for that payment mode.

### C. SQL Queries Executed

#### Query 1: Get Settlement Header
```sql
SELECT
    SettlementID,
    ISNULL(SubTotal, 0) as TotalSales,
    ISNULL(RoundedBy, 0) as RoundOff,
    ISNULL(TotalTax, 0) as TotalTax,
    ISNULL(DiscountAmount, 0) as Discount,
    ISNULL(ServiceCharge, 0) as ServiceCharge,
    ISNULL(InvoiceCount, 0) as NoOfBills,
    ISNULL(VoidItemQty, 0) as VoidQty,
    ISNULL(VoidItemAmount, 0) as VoidItemAmount,
    ISNULL(TerminalCode, 'SR') as TerminalCode,
    ISNULL(DayendRefNo, 'D000001') as DayendRefNo,
    LastSettlementDate
FROM dbo.SettlementHeader
WHERE CAST(DATEADD(HOUR, 8, LastSettlementDate) AS DATE) BETWEEN @start AND @end;
```

#### Query 2: Get Settlement Payments (Executed for each SettlementID)
```sql
SELECT
    Paymode,
    ISNULL(SysAmount, 0) as Amount,
    ISNULL(ReceiptCount, 0) as ReceiptCount
FROM dbo.SettlementDetail
WHERE SettlementId = @settlementId;
```

---

## 2. Consolidated Sales Report Module

This report aggregates transactions from live and historical views to provide a unified summary or detail breakdown.

### A. How the Flow Works
1. The user requests either the **Summary** or **Detailed** Consolidated Report for a date range.
2. The backend unions live and historical views to create unified datasets (`vwOrderDetailUnion` and `vwPaymentDetailUnion`).
3. **Summary View:** Aggregates total sales, discounts, and roundings, and returns category sales.
4. **Detailed View:** Joins individual items with a grouped payment lookup to provide item details along with the associated Bill Number and Paymode.

### B. Core Unions (Base Data Views)
*   **`vwOrderDetailUnion`:**
    ```sql
    SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime
    FROM dbo.vw_RestaurantOrderDetail
    UNION ALL
    SELECT OrderId, DishId, Quantity, BaseAmount, ManualDiscountAmount, TotalDetailLineAmount, OrderDateTime
    FROM dbo.vw_RestaurantOrderDetailCur
    ```
*   **`vwPaymentDetailUnion`:**
    ```sql
    SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName
    FROM dbo.vw_PaymentDetail
    UNION ALL
    SELECT OrderId, OrderDateTime, RoundedBy, TotalDiscountAmount, TotalAmountLessFreight, BillNumber, PayModeName
    FROM dbo.vw_PaymentDetailCur
    ```

---

### C. Consolidated Report - Summary View

#### 1. Tables and Columns Used
*   `vwOrderDetailUnion` ➔ `TotalDetailLineAmount` summed as **Net Sales**
*   `vwPaymentDetailUnion` (via Subquery) ➔ `RoundedBy` summed as **Rounding**, and `TotalDiscountAmount` summed as **Total Discount**
*   Calculated ➔ `Net Sales + Rounding` as **Total Revenue**

#### 2. SQL Query
```sql
SELECT
    ISNULL(SUM(vrod.TotalDetailLineAmount), 0) as NetSales,
    MAX(CAST(dg.DishGroupName AS VARCHAR(50))) as DishGroupName,
    0 as ServiceCharge,
    0 as TaxCollected,
    (SELECT ISNULL(SUM(RoundedBy), 0) FROM vwPaymentDetailUnion pd 
     WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end) as Rounding,
    (SELECT ISNULL(SUM(TotalDiscountAmount), 0) FROM vwPaymentDetailUnion pd 
     WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end) as TotalDiscount,
    ISNULL(SUM(vrod.TotalDetailLineAmount), 0) + 
    (SELECT ISNULL(SUM(RoundedBy), 0) FROM vwPaymentDetailUnion pd 
     WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end) as TotalRevenue
FROM vwOrderDetailUnion vrod
INNER JOIN dbo.DishMaster dm ON vrod.DishId = dm.DishId
LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
WHERE CAST(vrod.OrderDateTime AS DATE) BETWEEN @start AND @end;
```

---

### D. Consolidated Report - Detailed View

#### 1. Tables and Columns Used
*   `vwOrderDetailUnion` ➔ `Quantity`, `BaseAmount`, `TotalDetailLineAmount`
*   `vwPaymentDetailUnion` (Joined via OrderId) ➔ `BillNumber`, `PayModeName` (Mappeable payment mode)
*   `dbo.DishMaster` ➔ `DishCode`, `Name` (Dish Name)
*   `dbo.Dishgroupmaster` ➔ `DishGroupName` (Category Name)

#### 2. SQL Query
```sql
SELECT
    dm.DishGroupId,
    dg.DishGroupName as DishGroupIdName,
    dm.DishCode,
    dm.Name as DishName,
    od.Quantity,
    od.ManualDiscountAmount,
    od.BaseAmount,
    od.TotalDetailLineAmount,
    pd.BillNumber,
    pd.PayModeName
FROM vwOrderDetailUnion od
LEFT JOIN (
    SELECT 
        OrderId, 
        MAX(BillNumber) as BillNumber, 
        MAX(PayModeName) as PayModeName
    FROM vwPaymentDetailUnion
    GROUP BY OrderId
) pd ON od.OrderId = pd.OrderId
INNER JOIN dbo.DishMaster dm ON od.DishId = dm.DishId
LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
ORDER BY dm.DishGroupId;
```
