# SSMS Verification Queries: All 26 Sales Reports

This reference guide provides copy-pasteable SQL verification queries for every single sub-report in the **Sales Report** module, specifically configured to test the date **19-06-2026** (`2026-06-19`).

---

## Category 1: By Sales Reports

### 1. Sales Summary Report
*   **Purpose:** Fetches daily gross sales, discounts, taxes, and service charges.
*   **Tables:** `dbo.RestaurantInvoice`
*   **Verification SQL:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, InvoiceDate, 103) AS Date,
      ROUND(SUM(TotalLineItemAmount), 2) AS Sales,
      ROUND(SUM(TotalDiscountAmount), 2) AS Disc,
      ROUND(SUM(ServiceCharge), 2) AS SVC,
      ROUND(SUM(TotalTax), 2) AS [Tax 7%]
    FROM dbo.RestaurantInvoice
    WHERE InvoiceDate >= '2026-06-19 00:00:00' 
      AND InvoiceDate <= '2026-06-19 23:59:59'
    GROUP BY CONVERT(VARCHAR, InvoiceDate, 103);
    ```

### 2. Business Type Report
*   **Purpose:** Breaks down orders by service channel (Take Away vs Dine In).
*   **Tables:** `dbo.RestaurantOrder` (ro), `dbo.RestaurantInvoice` (ri)
*   **Verification SQL:**
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
*   **Purpose:** Summarizes active daily settlement closing metrics.
*   **Tables:** `dbo.SettlementHeader` (sh), `dbo.vw_Organization` (org)
*   **Verification SQL:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, sh.LastDayEndDate, 103) AS Date,
      CAST(sh.SubTotal AS DECIMAL(18,2)) AS SubTotal,
      CAST(ISNULL(sh.DiscountAmount, 0) AS DECIMAL(18,2)) AS Discount,
      CAST(ISNULL(sh.ServiceCharge, 0) AS DECIMAL(18,2)) AS [Service Charge],
      CAST(ISNULL(sh.TotalTax, 0) AS DECIMAL(18,2)) AS [Total Tax],
      CAST(ISNULL(sh.Tips, 0) AS DECIMAL(18,2)) AS Tips,
      sh.TotalPax,
      org.GstType,
      CAST(ISNULL(sh.RoundedBy, 0) AS DECIMAL(18,2)) AS [Round Off]
    FROM dbo.SettlementHeader sh
    INNER JOIN dbo.vw_Organization org ON sh.BusinessUnitId = org.BusinessUnitId
    WHERE sh.LastDayEndDate >= '2026-06-19' AND sh.LastDayEndDate <= '2026-06-19 23:59:59' AND sh.isDayEnd = 1;
    ```

### 4. Meal Period Report
*   **Purpose:** Analyzes sales trends based on meal hours (Breakfast, Lunch, etc.).
*   **Tables:** `dbo.RestaurantOrder` (ro), `dbo.RestaurantInvoice` (ri)
*   **Verification SQL:**
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
      SUM(ISNULL(ro.Persons, 0)) AS Pax,
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
*   **Purpose:** Comprehensive transactional matrix including payment methods and cover stats.
*   **Tables:** `dbo.RestaurantInvoice` (ri), `dbo.RestaurantOrder` (ro), `dbo.Discount` (d), `dbo.PaymentDetail` (pd), `dbo.Paymode` (pm)
*   **Verification SQL:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
      COUNT(DISTINCT ri.OrderId) AS [No of Bills],
      SUM(ISNULL(ro.Persons, 0)) AS Pax,
      SUM(CAST(ri.TotalLineItemAmount AS DECIMAL(25,2))) AS [Total Sales],
      SUM(CASE WHEN pm.PayMode = 'CASH' THEN pd.Amount ELSE 0 END) AS Cash,
      SUM(CASE WHEN pm.PayMode IN ('VISA', 'MASTERCARD', 'AMEX', 'DINERS', 'JCB') THEN pd.Amount ELSE 0 END) AS Cards
    FROM dbo.RestaurantInvoice ri
    LEFT JOIN dbo.RestaurantOrder ro ON ri.OrderId = ro.OrderId
    LEFT JOIN dbo.PaymentDetail pd ON ri.RestaurantBillId = pd.RestaurantBillId
    LEFT JOIN dbo.Paymode pm ON pd.Paymode = pm.Position
    WHERE ri.InvoiceDate >= '2026-06-19 00:00:00' AND ri.InvoiceDate <= '2026-06-19 23:59:59'
    GROUP BY CONVERT(VARCHAR, ri.InvoiceDate, 103);
    ```

---

## Category 2: By Item Reports

### 6. Month wise Report
*   **Purpose:** Monthly overview of sold items.
*   **Tables:** `dbo.Vw_MonthwiseSales` (vw), `dbo.DishMaster` (dm), `dbo.DishGroupMaster` (dgm), `dbo.CategoryMaster` (cm)
*   **Verification SQL:**
    ```sql
    SELECT 
      vw.TotalDetailLineAmount, 
      vw.OrderDateTime, 
      vw.DishName,
      dgm.DishGroupName,
      cm.CategoryName
    FROM dbo.Vw_MonthwiseSales vw
    LEFT JOIN dbo.DishMaster dm ON vw.DishName = dm.Name
    LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
    LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
    WHERE vw.OrderDateTime >= '2026-06-19 00:00:00' AND vw.OrderDateTime <= '2026-06-19 23:59:59';
    ```

### 7. Quantity wise Report
*   **Purpose:** Groups sales quantities by year/month.
*   **Tables:** `dbo.Vw_MonthwiseSales` (vw), `dbo.DishMaster` (dm), `dbo.DishGroupMaster` (dgm), `dbo.CategoryMaster` (cm)
*   **Verification SQL:**
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
*   **Purpose:** Item sales grouped by Category.
*   **Tables:** `dbo.RestaurantInvoice` (ri), `dbo.RestaurantOrderDetail` (rd), `dbo.DishMaster` (dm), `dbo.CategoryMaster` (cm)
*   **Verification SQL:**
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
*   **Purpose:** Item sales grouped by Category and Dish Group.
*   **Tables:** Same as Category Report.
*   **Verification SQL:**
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
*   **Purpose:** Item sales grouped by individual dish names.
*   **Tables:** Same as Category Report.
*   **Verification SQL:**
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

---

## Category 3: Order Sales Reports

### 11. Hourly Report
*   **Purpose:** Tracks sales amounts distributed by hour blocks.
*   **Tables:** `dbo.RestaurantInvoice` (ri), `dbo.RestaurantOrderDetail` (rd)
*   **Verification SQL:**
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
*   **Purpose:** Aggregates bill counts and sold quantities per calendar day.
*   **Tables:** `dbo.RestaurantInvoice` (ri), `dbo.RestaurantOrderDetail` (rd)
*   **Verification SQL:**
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
*   **Purpose:** Summary of sales performance for each individual item.
*   **Tables:** `dbo.RestaurantOrderDetail` (rd), `dbo.DishMaster` (dm), `dbo.RestaurantInvoice` (ri)
*   **Verification SQL:**
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
*   **Purpose:** Summarizes quantity and sales values grouped by Dish Group.
*   **Tables:** Same as Itemwise.
*   **Verification SQL:**
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

---

## Category 4: Day End Sub-reports

### 15. Top N Items Report
*   **Purpose:** Ranks best-selling items by total quantity sold.
*   **Views:** `dbo.vw_NItemSalesReport`
*   **Verification SQL:**
    ```sql
    SELECT 
      DishCode, DishName, CAST(Quantity AS DECIMAL(18,2)) AS Quantity, CAST(TotalDetailLineAmount AS DECIMAL(18,2)) AS Amount
    FROM dbo.vw_NItemSalesReport
    ORDER BY Quantity DESC;
    ```

### 16. Discount Summary Report
*   **Purpose:** Audits orders with active discount codes.
*   **Tables:** `dbo.RestaurantOrder` (ro), `dbo.Discount` (d), `dbo.RestaurantInvoice` (ri)
*   **Verification SQL:**
    ```sql
    SELECT 
      RI.BillNumber, CAST(RO.TotalLineItemAmount AS DECIMAL(18,2)) AS SubTotal, CAST(RO.TotalDiscountAmount AS DECIMAL(18,2)) AS Discount, D.Description
    FROM dbo.RestaurantOrder RO
    LEFT JOIN dbo.Discount D ON RO.DiscountId = D.DiscountId
    INNER JOIN dbo.RestaurantInvoice RI ON RO.OrderId = RI.OrderId
    WHERE CAST(RI.InvoiceDate AS DATE) = '2026-06-19';
    ```

### 17. Refund Summary Report
*   **Purpose:** Audit trail of returned/refunded items.
*   **Tables:** `dbo.RestaurantOrderDetail` (rod), `dbo.RestaurantInvoice` (ri), `dbo.DishMaster` (dm)
*   **Verification SQL:**
    ```sql
    SELECT 
      RI.BillNumber, DM.Name AS DishName, CAST(ROD.Quantity AS DECIMAL(18,2)) AS RefundedQty, CAST(ROD.TotalDetailLineAmount AS DECIMAL(18,2)) AS RefundedAmount
    FROM dbo.RestaurantOrderDetail ROD
    INNER JOIN dbo.RestaurantInvoice RI ON ROD.OrderId = RI.OrderId
    INNER JOIN dbo.DishMaster DM ON ROD.DishId = DM.DishId
    WHERE CAST(RI.InvoiceDate AS DATE) = '2026-06-19';
    ```

### 18. Table Change Report
*   **Purpose:** Logs table swapping operations.
*   **Views:** `dbo.vw_RestaurantOrder`
*   **Verification SQL:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, OrderDateTime, 103) AS OrderDate, OrderNumber, SourceTable, Tableno AS NewTable, TotalAmount, ModifyUser
    FROM dbo.vw_RestaurantOrder
    WHERE CAST(OrderDateTime AS DATE) = '2026-06-19';
    ```

### 19. Paymode Report
*   **Purpose:** Matrix showing total cash, credit card, and digital collections.
*   **Tables:** `dbo.RestaurantInvoice` (ri), `dbo.PaymentDetail` (pd), `dbo.Paymode` (pm)
*   **Verification SQL:**
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
*   **Purpose:** Splits total revenue generated by each active POS terminal.
*   **Tables:** `dbo.RestaurantInvoice`
*   **Verification SQL:**
    ```sql
    SELECT 
      ri.TerminalCode,
      ROUND(SUM(ri.TotalAmount), 2) AS Amount
    FROM dbo.RestaurantInvoice ri
    WHERE ri.InvoiceDate >= '2026-06-19' AND ri.InvoiceDate <= '2026-06-19 23:59:59'
    GROUP BY ri.TerminalCode;
    ```

### 21. Journal Report (Day End)
*   **Purpose:** Active Dayend settlements.
*   **Tables:** `dbo.SettlementHeader` (sh)
*   **Verification SQL:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, sh.LastDayEndDate, 103) AS Date,
      CAST(sh.SubTotal AS DECIMAL(10,2)) AS SubTotal,
      CAST(ISNULL(sh.DiscountAmount, 0) AS DECIMAL(10,2)) AS Discount
    FROM dbo.SettlementHeader sh
    WHERE sh.LastDayEndDate >= '2026-06-19' AND sh.LastDayEndDate <= '2026-06-19 23:59:59' AND sh.isDayEnd = 1;
    ```

### 22. Journal Summary Report
*   **Purpose:** Daily settlement metrics (Subtotal, Tax, Net) grouped by day.
*   **Tables:** `dbo.SettlementHeader`
*   **Verification SQL:**
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
*   **Purpose:** Summarizes active settlements by payment channel.
*   **Tables:** `dbo.TransactionMaster`
*   **Verification SQL:**
    ```sql
    SELECT 
      TransactionMode,
      CAST(SUM(Amount) AS DECIMAL(10,2)) AS Amount
    FROM dbo.TransactionMaster
    WHERE isSettlement = 1 AND TransactionDate >= '2026-06-19' AND TransactionDate <= '2026-06-19 23:59:59'
    GROUP BY TransactionMode;
    ```

### 24. Cancellation Report
*   **Purpose:** Main metrics for cancelled orders.
*   **Tables:** `dbo.RestaurantOrder` (ro)
*   **Verification SQL:**
    ```sql
    SELECT 
      OrderNumber, TotalLineItemAmount, TotalTax, TotalAmount, StatusCode, Description
    FROM dbo.RestaurantOrder
    WHERE StatusCode IN (0, 2, 3, 6, 7) AND OrderDateTime >= '2026-06-19 00:00:00' AND OrderDateTime <= '2026-06-19 23:59:59';
    ```

### 25. Cancellation Detail Report
*   **Purpose:** Item-level details of voided/cancelled transactions.
*   **Tables:** `dbo.RestaurantOrder` (ro), `dbo.RestaurantOrderDetail` (rod), `dbo.DishMaster` (dm)
*   **Verification SQL:**
    ```sql
    SELECT 
      RO.OrderNumber, DM.Name AS DishName, ROD.Quantity, CAST(ROD.TotalDetailLineAmount AS DECIMAL(18,2)) AS LineAmount, ROD.Remarks
    FROM dbo.RestaurantOrder RO
    INNER JOIN dbo.RestaurantOrderDetail ROD ON RO.OrderId = ROD.OrderId
    INNER JOIN dbo.DishMaster DM ON ROD.DishId = DM.DishId
    WHERE RO.StatusCode IN (0, 2, 3, 6, 7) AND RO.OrderDateTime >= '2026-06-19 00:00:00' AND RO.OrderDateTime <= '2026-06-19 23:59:59';
    ```

---

## Category 5: Special Reports

### 26. Guest Meal Report
*   **Purpose:** Track free guest meals issued.
*   **Tables:** `dbo.RestaurantOrder` (ro), `dbo.Discount` (d), `dbo.RestaurantInvoice` (ri)
*   **Verification SQL:**
    ```sql
    SELECT 
      RI.BillNumber, CAST(RO.TotalAmount AS DECIMAL(10,2)) AS TotalAmount, D.Description
    FROM dbo.RestaurantOrder RO
    INNER JOIN dbo.Discount D ON RO.DiscountId = D.DiscountId
    INNER JOIN dbo.PaymentDetail PD ON RO.OrderId = PD.OrderId
    INNER JOIN dbo.RestaurantInvoice RI ON PD.RestaurantBillId = RI.RestaurantBillId
    WHERE D.isGuestMeal = 1 AND CAST(RI.InvoiceDate AS DATE) = '2026-06-19';
    ```
