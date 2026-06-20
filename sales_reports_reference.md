# Sales Reports Reference Manual

This document serves as a complete reference guide for all **26 sales reports** available in the Sales Report module. It details the flow, database tables, column mappings, and the exact SQL queries executed.

---

## Category 1: By Sales Reports

### 1. Sales Summary Report
*   **Flow:** Fetches total daily sales, tax, and discount aggregates.
*   **Source Table:** `dbo.RestaurantInvoice`
*   **Columns:**
    *   `InvoiceDate` ➔ Date
    *   `TotalLineItemAmount` ➔ Sales
    *   `TotalDiscountAmount` ➔ Disc
    *   `ServiceCharge` ➔ SVC
    *   `TotalTax` ➔ Tax 7%
*   **SQL Query:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, InvoiceDate, 103) AS Date,
      ROUND(SUM(TotalLineItemAmount), 2) AS Sales,
      0 AS FOC,
      ROUND(SUM(TotalDiscountAmount), 2) AS Disc,
      ROUND(SUM(ServiceCharge), 2) AS SVC,
      ROUND(SUM(TotalTax), 2) AS [Tax 7%],
      0 AS Tips,
      0 AS Rnd,
      0 AS ENT,
      0 AS Cash,
      0 AS Master,
      0 AS Visa
    FROM dbo.RestaurantInvoice
    WHERE InvoiceDate >= '${fromDate}' 
      AND InvoiceDate <= '${toDate} 23:59:59'
    GROUP BY CONVERT(VARCHAR, InvoiceDate, 103)
    ORDER BY MIN(InvoiceDate)
    ```

### 2. Business Type Report
*   **Flow:** Groups sales by order channel type (Dine In vs Take Away).
*   **Source Tables:** `dbo.RestaurantOrder` (ro), `dbo.RestaurantInvoice` (ri)
*   **Columns:**
    *   `ri.InvoiceDate` ➔ Date
    *   `ro.IsTakeAway` ➔ Type (Take Away or Dine In)
    *   `ro.TotalLineItemAmount` ➔ SubTotal
    *   `ro.TotalDiscountAmount` ➔ Discount
    *   `ro.ServiceCharge` ➔ ServiceCharge
    *   `ro.TotalTax` ➔ Tax
    *   `ro.TotalAmount` ➔ NetTotal
*   **SQL Query:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
      CASE 
        WHEN ro.IsTakeAway = 1 THEN 'Take Away'
        ELSE 'Dine In'
      END AS Type,
      CAST(ISNULL(SUM(CAST(ro.TotalLineItemAmount AS DECIMAL(18,2))), 0) AS DECIMAL(18,2)) AS SubTotal,
      CAST(ISNULL(SUM(CAST(ro.TotalDiscountAmount AS DECIMAL(18,2))), 0) AS DECIMAL(18,2)) AS Discount,
      CAST(ISNULL(SUM(CAST(ro.ServiceCharge AS DECIMAL(18,2))), 0) AS DECIMAL(18,2)) AS ServiceCharge,
      CAST(ISNULL(SUM(CAST(ro.TotalTax AS DECIMAL(18,2))), 0) AS DECIMAL(18,2)) AS Tax,
      CAST(ISNULL(SUM(CAST(ro.TotalAmount AS DECIMAL(18,2))), 0) AS DECIMAL(18,2)) AS NetTotal
    FROM dbo.RestaurantOrder ro
    INNER JOIN dbo.RestaurantInvoice ri ON ro.OrderId = ri.OrderId
    WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
      AND ri.InvoiceDate <= '${toDate} 23:59:59'
    GROUP BY 
      CONVERT(VARCHAR, ri.InvoiceDate, 103),
      ro.IsTakeAway
    ORDER BY MIN(ri.InvoiceDate)
    ```

### 3. Sales Journal (By Sales)
*   **Flow:** Extracts business unit level day-end statistics.
*   **Source Tables:** `dbo.SettlementHeader` (sh), `dbo.vw_Organization` (org)
*   **Columns:**
    *   `sh.LastDayEndDate` ➔ Date
    *   `sh.SubTotal` ➔ SubTotal
    *   `sh.DiscountAmount` ➔ Discount
    *   `sh.ServiceCharge` ➔ Service Charge
    *   `sh.TotalTax` ➔ Total Tax
    *   `sh.Tips` ➔ Tips
    *   `sh.TotalPax` ➔ TotalPax
    *   `org.GstType` ➔ GstType
    *   `sh.RoundedBy` ➔ Round Off
*   **SQL Query:**
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
    WHERE sh.LastDayEndDate >= '${fromDate}' 
      AND sh.LastDayEndDate <= '${toDate} 23:59:59'
      AND sh.isDayEnd = 1
    ORDER BY sh.LastDayEndDate
    ```

### 4. Meal Period Report
*   **Flow:** Groups sales based on meal hour windows (Breakfast, Lunch, Dinner, Supper).
*   **Source Tables:** `dbo.RestaurantOrder` (ro), `dbo.RestaurantInvoice` (ri)
*   **Columns:**
    *   `ri.InvoiceDate` ➔ Date / MealPeriod
    *   `ri.OrderId` ➔ Bills Count
    *   `ro.Persons` ➔ Pax
    *   `ri.TotalLineItemAmount` ➔ Sub Total
    *   `ri.TotalDiscountAmount` ➔ Discount
    *   `ro.ServiceCharge` ➔ SVC
    *   `ri.TotalTax` ➔ Tax Total
*   **SQL Query:**
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
      SUM(CAST(ri.TotalLineItemAmount AS DECIMAL(25,2))) AS [Sub Total],
      SUM(CAST(ISNULL(ri.TotalDiscountAmount,0) AS DECIMAL(25,2))) AS Discount,
      SUM(CAST(ISNULL(ro.ServiceCharge,0) AS DECIMAL(25,2))) AS SVC,
      SUM(CAST(ISNULL(ri.TotalTax,0) AS DECIMAL(25,2))) AS [Tax Total],
      SUM(CAST(ri.TotalLineItemAmount - ISNULL(ri.TotalDiscountAmount,0) + ISNULL(ro.ServiceCharge,0) + ISNULL(ri.TotalTax,0) + ISNULL(ri.RoundedBy,0) AS DECIMAL(25,2))) AS [Total Sales]
    FROM dbo.RestaurantOrder ro
    INNER JOIN dbo.RestaurantInvoice ri ON ro.OrderId = ri.OrderId
    WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
      AND ri.InvoiceDate <= '${toDate} 23:59:59'
      AND ri.TotalLineItemAmount < 1000000
      AND ri.TotalLineItemAmount > 0
    GROUP BY 
      CONVERT(VARCHAR, ri.InvoiceDate, 103),
      CASE 
        WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 6 AND 10 THEN 'BreakFast'
        WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 11 AND 16 THEN 'Lunch'
        WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 17 AND 22 THEN 'Dinner'
        ELSE 'Supper'
      END
    ORDER BY MIN(ri.InvoiceDate), MealPeriod
    ```

### 5. Sales Analysis Report
*   **Flow:** Comprehensive report combining category distribution, cashier collection breakdown, and cover statistics.
*   **Source Tables:** `dbo.RestaurantInvoice` (ri), `dbo.RestaurantOrder` (ro), `dbo.Discount` (d), `dbo.PaymentDetail` (pd), `dbo.Paymode` (pm)
*   **SQL Query:**
    ```sql
    SELECT 
      'MAIN' AS DataType,
      CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
      COUNT(DISTINCT ri.OrderId) AS [No of Bills],
      SUM(ISNULL(ro.Persons, 0)) AS Pax,
      SUM(CAST(ri.TotalLineItemAmount AS DECIMAL(25,2))) AS [Total Sales],
      SUM(CAST(ISNULL(ri.TotalDiscountAmount,0) AS DECIMAL(25,2))) AS Discount,
      SUM(CAST(ISNULL(ro.ServiceCharge,0) AS DECIMAL(25,2))) AS [Service Charge],
      SUM(CAST(ISNULL(ri.TotalTax,0) AS DECIMAL(25,2))) AS Tax,
      SUM(CAST(ri.TotalAmount AS DECIMAL(25,2))) AS [Net Total],
      SUM(CAST(ISNULL(ri.Tips,0) AS DECIMAL(25,2))) AS Tips,
      SUM(CAST(ISNULL(ri.RoundedBy,0) AS DECIMAL(25,2))) AS [Round Off],
      SUM(CASE WHEN d.isGuestMeal = 1 THEN ri.TotalAmount ELSE 0 END) AS FOC,
      SUM(CASE WHEN pm.PayMode = 'CASH' THEN pd.Amount ELSE 0 END) AS Cash,
      SUM(CASE WHEN pm.PayMode IN ('VISA', 'MASTERCARD', 'AMEX', 'DINERS', 'JCB') THEN pd.Amount ELSE 0 END) AS Cards,
      SUM(CASE WHEN pm.PayMode = 'CHEQUE' THEN pd.Amount ELSE 0 END) AS Cheque,
      SUM(CASE WHEN pm.PayMode = 'LEDGER' THEN pd.Amount ELSE 0 END) AS Ledger,
      SUM(CASE WHEN pm.PayMode = 'NEKTAR' THEN pd.Amount ELSE 0 END) AS Nektar,
      SUM(CASE WHEN pm.PayMode = 'VOUCHER' THEN pd.Amount ELSE 0 END) AS Voucher,
      SUM(CASE WHEN pm.PayMode = 'ENTERTAINMENT' THEN pd.Amount ELSE 0 END) AS ENT,
      SUM(pd.Amount) AS TotalCollection
    FROM dbo.RestaurantInvoice ri
    LEFT JOIN dbo.RestaurantOrder ro ON ri.OrderId = ro.OrderId
    LEFT JOIN dbo.Discount d ON ro.DiscountId = d.DiscountId
    LEFT JOIN dbo.PaymentDetail pd ON ri.RestaurantBillId = pd.RestaurantBillId
    LEFT JOIN dbo.Paymode pm ON pd.Paymode = pm.Position
    WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
      AND ri.InvoiceDate <= '${toDate} 23:59:59'
    GROUP BY CONVERT(VARCHAR, ri.InvoiceDate, 103)
    ```

---

## Category 2: By Item Reports

### 6. Month Report
*   **Flow:** Month-wise breakdown of item sales.
*   **Source Tables:** `dbo.Vw_MonthwiseSales` (vw), `dbo.DishMaster` (dm), `dbo.DishGroupMaster` (dgm), `dbo.CategoryMaster` (cm)
*   **SQL Query:**
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
    WHERE vw.OrderDateTime >= '${fromDate}' 
      AND vw.OrderDateTime <= '${toDate} 23:59:59'
    ```

### 7. Quantity Report
*   **Flow:** Summary of item sales quantities grouped by Year and Month.
*   **Source Tables:** `dbo.Vw_MonthwiseSales` (vw), `dbo.DishMaster` (dm), `dbo.DishGroupMaster` (dgm), `dbo.CategoryMaster` (cm)
*   **SQL Query:**
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
    WHERE vw.OrderDateTime >= '${fromDate}' 
      AND vw.OrderDateTime <= '${toDate} 23:59:59'
    GROUP BY 
      DATEPART(YEAR, vw.OrderDateTime),
      DATENAME(MONTH, vw.OrderDateTime),
      vw.DishName,
      dgm.DishGroupName
    ORDER BY 
      DATEPART(YEAR, vw.OrderDateTime),
      MIN(vw.OrderDateTime),
      Amount DESC
    ```

### 8. Category Report
*   **Flow:** Sales quantities and revenue grouped by high-level categories.
*   **Source Tables:** `dbo.RestaurantInvoice` (ri), `dbo.RestaurantOrderDetail` (rd), `dbo.DishMaster` (dm), `dbo.DishGroupMaster` (dgm), `dbo.CategoryMaster` (cm)
*   **SQL Query:**
    ```sql
    SELECT 
      ISNULL(CAST(cm.CategoryId AS VARCHAR(50)), '') AS CategoryId,
      ISNULL(cm.CategoryName, 'Uncategorized') AS CategoryName,
      SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
      SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales,
      0 AS ItemDisc,
      0 AS Foc,
      0 AS Revenue70,
      0 AS Revenue30,
      SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS Revenue
    FROM dbo.RestaurantInvoice ri
    INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
    LEFT JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
    LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
    LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
    WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
      AND ri.InvoiceDate <= '${toDate} 23:59:59'
    GROUP BY cm.CategoryId, cm.CategoryName 
    ORDER BY cm.CategoryName
    ```

### 9. Dish Group Report
*   **Flow:** Detailed Dish group sales values categorized under their parent categories.
*   **Source Tables:** `dbo.RestaurantInvoice` (ri), `dbo.RestaurantOrderDetail` (rd), `dbo.DishMaster` (dm), `dbo.DishGroupMaster` (dgm), `dbo.CategoryMaster` (cm)
*   **SQL Query:**
    ```sql
    SELECT 
      ISNULL(cm.CategoryName, 'Uncategorized') AS CategoryName,
      ISNULL(dgm.DishGroupName, 'Uncategorized') AS DishGroupname,
      SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
      SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales,
      0 AS ItemDisc,
      0 AS Foc,
      SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS NetSales
    FROM dbo.RestaurantInvoice ri
    INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
    LEFT JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
    LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
    LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
    WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
      AND ri.InvoiceDate <= '${toDate} 23:59:59'
    GROUP BY cm.CategoryName, dgm.DishGroupName
    ORDER BY cm.CategoryName, dgm.DishGroupName
    ```

### 10. Dish Report
*   **Flow:** Individual dish sales, grouped under their Category and Dish Group hierarchies.
*   **Source Tables:** `dbo.RestaurantInvoice` (ri), `dbo.RestaurantOrderDetail` (rd), `dbo.DishMaster` (dm), `dbo.DishGroupMaster` (dgm), `dbo.CategoryMaster` (cm)
*   **SQL Query:**
    ```sql
    SELECT 
      ISNULL(cm.CategoryName, 'Uncategorized') AS CategoryName,
      ISNULL(dgm.DishGroupName, 'Uncategorized') AS DishGroupname,
      ISNULL(dm.Name, 'Unknown') AS Dishname,
      SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
      SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales,
      0 AS ItemDisc,
      0 AS Foc,
      SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS NetSales
    FROM dbo.RestaurantInvoice ri
    INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
    INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
    LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
    LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
    WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
      AND ri.InvoiceDate <= '${toDate} 23:59:59'
    GROUP BY cm.CategoryName, dgm.DishGroupName, dm.Name
    ORDER BY cm.CategoryName, dgm.DishGroupName, dm.Name
    ```

---

## Category 3: Order Sales Reports

### 11. Hourly Report
*   **Flow:** Aggregates order values by their execution hours.
*   **Source Tables:** `dbo.RestaurantInvoice` (ri), `dbo.RestaurantOrderDetail` (rd)
*   **SQL Query:**
    ```sql
    SELECT 
      CONCAT(
        FORMAT(DATEPART(HOUR, ri.OrderDateTime), '00'), ':00 - ',
        FORMAT(DATEPART(HOUR, ri.OrderDateTime) + 1, '00'), ':00'
      ) AS Hour,
      SUM(CAST(rd.TotalDetailLineAmount AS DECIMAL(18,2))) AS Amount
    FROM dbo.RestaurantInvoice ri
    INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
    WHERE ri.OrderDateTime >= '${fromDate}'  
      AND ri.OrderDateTime < '${toDate} 23:59:59'
    GROUP BY DATEPART(HOUR, ri.OrderDateTime)
    ORDER BY DATEPART(HOUR, ri.OrderDateTime)
    ```

### 12. Daywise Report
*   **Flow:** Daily summary of bill count, quantity sold, and total sales.
*   **Source Tables:** `dbo.RestaurantInvoice` (ri), `dbo.RestaurantOrderDetail` (rd)
*   **SQL Query:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, ri.OrderDateTime, 103) AS Date,
      COUNT(DISTINCT ri.OrderId) AS [No of Bills],
      SUM(CAST(rd.Quantity AS DECIMAL(18,2))) AS Qty,
      SUM(CAST(rd.TotalDetailLineAmount AS DECIMAL(18,2))) AS Amount
    FROM dbo.RestaurantInvoice ri
    JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
    WHERE ri.OrderDateTime >= '${fromDate}'  
      AND ri.OrderDateTime < '${toDate} 23:59:59'
    GROUP BY CONVERT(VARCHAR, ri.OrderDateTime, 103)
    ORDER BY MIN(ri.OrderDateTime)
    ```

### 13. Itemwise Report
*   **Flow:** Overall quantity and sales breakdown ranking items by revenue.
*   **Source Tables:** `dbo.RestaurantOrderDetail` (rd), `dbo.DishMaster` (dm), `dbo.RestaurantInvoice` (ri)
*   **SQL Query:**
    ```sql
    SELECT 
      dm.Name AS Item, 
      SUM(rd.Quantity) AS Qty, 
      SUM(rd.TotalDetailLineAmount) AS Amount
    FROM dbo.RestaurantOrderDetail rd
    JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
    JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
    WHERE ri.OrderDateTime >= '${fromDate}'  
      AND ri.OrderDateTime < '${toDate} 23:59:59'
    GROUP BY dm.Name
    ORDER BY Amount DESC
    ```

### 14. Group Report
*   **Flow:** Summarizes quantity and sales values grouped by Dish Group.
*   **Source Tables:** `dbo.RestaurantOrderDetail` (rd), `dbo.DishMaster` (dm), `dbo.RestaurantInvoice` (ri), `dbo.DishGroupMaster` (dgm)
*   **SQL Query:**
    ```sql
    SELECT 
      ISNULL(dgm.DishGroupName, 'Uncategorized') AS [Group],
      SUM(rd.Quantity) AS Qty,
      SUM(rd.TotalDetailLineAmount) AS Amount
    FROM dbo.RestaurantOrderDetail rd
    JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
    JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
    LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
    WHERE ri.OrderDateTime >= '${fromDate}'  
      AND ri.OrderDateTime < '${toDate} 23:59:59'
    GROUP BY dgm.DishGroupName
    ORDER BY Amount DESC
    ```

---

## Category 4: Day End Sub-reports

### 15. Top N Items Report
*   **Flow:** Fast-moving items ranked by total quantity sold.
*   **Source View:** `dbo.vw_NItemSalesReport`
*   **SQL Query:**
    ```sql
    SELECT 
      DishCode,
      DishName,
      CAST(Quantity AS DECIMAL(18,2)) AS Quantity,
      CAST(TotalDetailLineAmount AS DECIMAL(18,2)) AS Amount
    FROM dbo.vw_NItemSalesReport
    ORDER BY Quantity DESC, DishCode DESC
    ```

### 16. Discount Summary Report
*   **Flow:** Invoices that contained discounts, showing applied discount code details.
*   **Source Tables:** `dbo.RestaurantOrder` (ro), `dbo.Discount` (d), `dbo.RestaurantInvoice` (ri)
*   **SQL Query:**
    ```sql
    SELECT 
      RI.BillNumber AS InvoiceNo,
      CAST(RO.TotalLineItemAmount AS DECIMAL(18,2)) AS SubTotal,
      CAST(RO.TotalDiscountAmount AS DECIMAL(18,2)) AS Discount,
      CAST(RO.ServiceCharge AS DECIMAL(18,2)) AS ServiceCharge,
      CAST(RO.TotalTax AS DECIMAL(18,2)) AS TotalTax,
      CAST(RO.TotalAmount AS DECIMAL(18,2)) AS TotalAmount,
      D.Description,
      CONVERT(VARCHAR, RI.InvoiceDate, 103) AS InvoiceDate,
      D.DiscountId
    FROM dbo.RestaurantOrder RO
    LEFT JOIN dbo.Discount D ON RO.DiscountId = D.DiscountId
    INNER JOIN dbo.RestaurantInvoice RI ON RO.OrderId = RI.OrderId
    WHERE CAST(RI.InvoiceDate AS DATE) BETWEEN CAST('${fromDate}' AS DATE) AND CAST('${toDate}' AS DATE)
    ORDER BY CAST(RI.InvoiceDate AS DATE), D.Description, RI.BillNumber
    ```

### 17. Refund Summary Report
*   **Flow:** Detail lines showing quantity and amount refunded/returned.
*   **Source Tables:** `dbo.RestaurantOrderDetail` (rod), `dbo.RestaurantInvoice` (ri), `dbo.DishMaster` (dm)
*   **SQL Query:**
    ```sql
    SELECT 
      RI.BillNumber,
      DM.DishCode,
      DM.Name AS DishName,
      CAST(ROD.Quantity AS DECIMAL(18,2)) AS Quantity,
      CAST(ROD.TotalDetailLineAmount AS DECIMAL(18,2)) AS Amount,
      RI.TotalAmount,
      RI.TotalDiscountAmount,
      RI.ServiceCharge,
      RI.Tips,
      ROD.PricePerUnit,
      ROD.Tax,
      RI.OrderId,
      RI.InvoiceDate
    FROM dbo.RestaurantOrderDetail ROD
    INNER JOIN dbo.RestaurantInvoice RI ON ROD.OrderId = RI.OrderId
    INNER JOIN dbo.DishMaster DM ON ROD.DishId = DM.DishId
    WHERE CAST(RI.InvoiceDate AS DATE) BETWEEN CAST('${fromDate}' AS DATE) AND CAST('${toDate}' AS DATE)
    ORDER BY RI.OrderId
    ```

### 18. Table Change Report
*   **Flow:** Audit log showing orders that underwent table changes.
*   **Source View:** `dbo.vw_RestaurantOrder`
*   **SQL Query:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, OrderDateTime, 103) AS OrderDate,
      OrderNumber,
      SourceTable,
      Tableno AS NewTable,
      TotalAmount,
      ModifyUser,
      StatusCodeName
    FROM dbo.vw_RestaurantOrder
    WHERE CAST(OrderDateTime AS DATE) BETWEEN CAST('${fromDate}' AS DATE) AND CAST('${toDate}' AS DATE)
    ORDER BY CAST(OrderDateTime AS DATE), OrderNumber
    ```

### 19. Paymode Report
*   **Flow:** Daily paymode breakdown matrix.
*   **Source Tables:** `dbo.RestaurantInvoice` (ri), `dbo.PaymentDetail` (pd), `dbo.Paymode` (pm)
*   **SQL Query:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, CAST(ri.InvoiceDate AS DATE), 103) AS Date,
      ISNULL(SUM(CASE WHEN UPPER(pm.PayMode) = 'CASH' THEN pd.Amount ELSE 0 END), 0) AS Cash,
      ISNULL(SUM(CASE WHEN UPPER(pm.PayMode) = 'CHEQUE' THEN pd.Amount ELSE 0 END), 0) AS Cheque,
      ISNULL(SUM(CASE WHEN UPPER(pm.PayMode) = 'VISA' THEN pd.Amount ELSE 0 END), 0) AS Visa,
      ...
    FROM dbo.RestaurantInvoice ri
    INNER JOIN dbo.PaymentDetail pd ON ri.RestaurantBillId = pd.RestaurantBillId
    INNER JOIN dbo.Paymode pm ON pd.Paymode = pm.Position
    WHERE CAST(ri.InvoiceDate AS DATE) BETWEEN CAST('${fromDate}' AS DATE) AND CAST('${toDate}' AS DATE)
    GROUP BY CAST(ri.InvoiceDate AS DATE)
    ORDER BY MIN(ri.InvoiceDate)
    ```

### 20. Terminal Report
*   **Flow:** Sales distribution split across active terminals.
*   **Source Table:** `dbo.RestaurantInvoice`
*   **SQL Query:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
      ri.TerminalCode,
      ROUND(SUM(ri.TotalAmount), 2) AS Amount
    FROM dbo.RestaurantInvoice ri
    WHERE ri.InvoiceDate >= '${fromDate}' 
      AND ri.InvoiceDate <= '${toDate} 23:59:59'
    GROUP BY CONVERT(VARCHAR, ri.InvoiceDate, 103), ri.TerminalCode
    ORDER BY MIN(ri.InvoiceDate), ri.TerminalCode
    ```

### 21. Journal Report (Day End)
*   **Flow:** Historical Settlement header details for Dayend-marked records.
*   **Source Tables:** `dbo.SettlementHeader` (sh), `dbo.vw_Organization` (org)
*   **SQL Query:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, sh.LastDayEndDate, 103) AS Date,
      CAST(sh.SubTotal AS DECIMAL(10,2)) AS SubTotal,
      CAST(ISNULL(sh.DiscountAmount, 0) AS DECIMAL(10,2)) AS Discount,
      CAST(ISNULL(sh.ServiceCharge, 0) AS DECIMAL(10,2)) AS [Service Charge],
      CAST(ISNULL(sh.TotalTax, 0) AS DECIMAL(10,2)) AS [Total Tax],
      CAST(ISNULL(sh.Tips, 0) AS DECIMAL(10,2)) AS Tips,
      sh.TotalPax,
      org.GstType,
      CAST(ISNULL(sh.RoundedBy, 0) AS DECIMAL(10,2)) AS [Round Off]
    FROM dbo.SettlementHeader sh
    INNER JOIN dbo.vw_Organization org ON sh.BusinessUnitId = org.BusinessUnitId
    WHERE sh.LastDayEndDate >= '${fromDate}' 
      AND sh.LastDayEndDate <= '${toDate} 23:59:59'
      AND sh.isDayEnd = 1
    ORDER BY sh.LastDayEndDate
    ```

### 22. Journal Summary Report
*   **Flow:** Daily settlement aggregates (Subtotal, Gross, Tax, Net) grouped by day.
*   **Source Table:** `dbo.SettlementHeader`
*   **SQL Query:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, sh.LastDayEndDate, 103) AS Date,
      CAST(SUM(sh.SubTotal) AS DECIMAL(10,2)) AS [Sub Total],
      CAST(SUM(ISNULL(sh.DiscountAmount, 0)) AS DECIMAL(10,2)) AS Discount,
      CAST(SUM(ISNULL(sh.ServiceCharge, 0)) AS DECIMAL(10,2)) AS [Service Charge],
      CAST(SUM(sh.SubTotal) - SUM(ISNULL(sh.DiscountAmount, 0)) + SUM(ISNULL(sh.ServiceCharge, 0)) AS DECIMAL(10,2)) AS [Gross Total],
      CAST(SUM(ISNULL(sh.TotalTax, 0)) AS DECIMAL(10,2)) AS [Total Tax],
      CAST(SUM(ISNULL(sh.RoundedBy, 0)) AS DECIMAL(10,2)) AS [Round],
      CAST(SUM(sh.SubTotal) - SUM(ISNULL(sh.DiscountAmount, 0)) + SUM(ISNULL(sh.ServiceCharge, 0)) + SUM(ISNULL(sh.TotalTax, 0)) + SUM(ISNULL(sh.RoundedBy, 0)) AS DECIMAL(10,2)) AS [Net Total]
    FROM dbo.SettlementHeader sh
    WHERE sh.LastDayEndDate >= '${fromDate}' 
      AND sh.LastDayEndDate <= '${toDate} 23:59:59'
    GROUP BY CONVERT(VARCHAR, sh.LastDayEndDate, 103)
    ORDER BY MIN(sh.LastDayEndDate)
    ```

### 23. Transaction Report
*   **Flow:** Closed transactions summarized by Mode (Cash, Nets, etc.).
*   **Source Table:** `dbo.TransactionMaster`
*   **SQL Query:**
    ```sql
    SELECT 
      TransactionMode,
      CAST(SUM(Amount) AS DECIMAL(10,2)) AS Amount
    FROM dbo.TransactionMaster
    WHERE isSettlement = 1
      AND TransactionDate >= '${fromDate}' 
      AND TransactionDate <= '${toDate} 23:59:59'
    GROUP BY TransactionMode
    ```

### 24. Cancellation Report
*   **Flow:** Orders marked with cancellation/void status codes.
*   **Source Tables:** `dbo.RestaurantOrder` (ro), `dbo.RestaurantInvoice` (ri), `dbo.vw_Organization` (org)
*   **SQL Query:**
    ```sql
    SELECT 
      RO.OrderNumber,
      CONVERT(VARCHAR, RO.OrderDateTime, 103) AS OrderDateTime,
      CAST(RO.TotalLineItemAmount AS DECIMAL(18,2)) AS TotalLineItemAmount,
      CAST(RO.TotalTax AS DECIMAL(18,2)) AS TotalTax,
      org.GstType,
      CAST(RO.TotalDiscountAmount AS DECIMAL(18,2)) AS TotalDiscountAmount,
      CAST(RO.ServiceCharge AS DECIMAL(18,2)) AS ServiceCharge,
      CAST(RO.TotalAmount AS DECIMAL(18,2)) AS TotalAmount,
      RO.StatusCode,
      CAST(RO.RoundedBy AS DECIMAL(18,2)) AS RoundedBy,
      RI.BillNumber,
      ISNULL(RO.Description, '') AS Description
    FROM dbo.RestaurantOrder RO
    LEFT JOIN dbo.RestaurantInvoice RI ON RO.OrderId = RI.OrderId
    INNER JOIN dbo.vw_Organization org ON RO.BusinessUnitId = org.BusinessUnitId
    WHERE RO.StatusCode IN (0, 2, 3, 6, 7)
      AND RO.OrderDateTime >= '${fromDate} 00:00:00'
      AND RO.OrderDateTime <= '${toDate} 23:59:59'
    ORDER BY RO.OrderNumber, RO.OrderDateTime
    ```

### 25. Cancellation Detail Report
*   **Flow:** Item-level audit details of cancelled orders.
*   **Source Tables:** `dbo.RestaurantOrder` (ro), `dbo.RestaurantOrderDetail` (rod), `dbo.RestaurantInvoice` (ri), `dbo.DishMaster` (dm)
*   **SQL Query:**
    ```sql
    SELECT 
      ROD.Quantity,
      ROD.PricePerUnit,
      DM.Name AS DishName,
      RO.StatusCode,
      RI.BillNumber,
      CAST(ROD.TotalDetailLineAmount AS DECIMAL(18,2)) AS TotalDetailLineAmount,
      CAST(RO.TotalAmount AS DECIMAL(18,2)) AS TotalAmount,
      RO.OrderNumber,
      CAST(RO.TotalDiscountAmount AS DECIMAL(18,2)) AS TotalDiscountAmount,
      CAST(RO.TotalTax AS DECIMAL(18,2)) AS TotalTax,
      CAST(RO.ServiceCharge AS DECIMAL(18,2)) AS ServiceCharge,
      ISNULL(ROD.Remarks, '') AS Remarks,
      ROD.SeqNo,
      CONVERT(VARCHAR, ROD.OrderDateTime, 103) AS OrderDateTime,
      CONVERT(VARCHAR, RO.OrderDateTime, 103) AS OrderHeaderDateTime
    FROM dbo.RestaurantOrder RO
    INNER JOIN dbo.RestaurantOrderDetail ROD ON RO.OrderId = ROD.OrderId
    LEFT JOIN dbo.RestaurantInvoice RI ON RO.OrderId = RI.OrderId
    INNER JOIN dbo.DishMaster DM ON ROD.DishId = DM.DishId
    WHERE RO.StatusCode IN (0, 2, 3, 6, 7)
      AND RO.OrderDateTime >= '${fromDate} 00:00:00'
      AND RO.OrderDateTime <= '${toDate} 23:59:59'
    ORDER BY RO.OrderNumber, RI.BillNumber, ROD.SeqNo
    ```

---

## Category 5: Special Reports

### 26. Guest Meal Report
*   **Flow:** Summarizes free meals / guest meals issued.
*   **Source Tables:** `dbo.RestaurantOrder` (ro), `dbo.Discount` (d), `dbo.PaymentDetail` (pd), `dbo.RestaurantInvoice` (ri)
*   **SQL Query:**
    ```sql
    SELECT 
      CONVERT(VARCHAR, RI.InvoiceDate, 103) AS InvoiceDate,
      RI.BillNumber,
      CAST(RO.TotalLineItemAmount AS DECIMAL(10,2)) AS ItemAmount,
      CAST(RO.TotalDiscountAmount AS DECIMAL(10,2)) AS discountAmount,
      CAST(RO.ServiceCharge AS DECIMAL(10,2)) AS ServiceCharge,
      CAST(RO.TotalTax AS DECIMAL(10,2)) AS TotalTax,
      CAST(RO.TotalAmount AS DECIMAL(10,2)) AS TotalAmount,
      ISNULL(D.Description, '') AS Description
    FROM dbo.RestaurantOrder RO
    INNER JOIN dbo.Discount D ON RO.DiscountId = D.DiscountId
    INNER JOIN dbo.PaymentDetail PD ON RO.OrderId = PD.OrderId
    INNER JOIN dbo.RestaurantInvoice RI ON PD.RestaurantBillId = RI.RestaurantBillId
    WHERE D.isGuestMeal = 1
      AND CAST(RI.InvoiceDate AS DATE) >= CAST('${fromDate}' AS DATE)
      AND CAST(RI.InvoiceDate AS DATE) <= CAST('${toDate}' AS DATE)
    ORDER BY RI.InvoiceDate, RI.BillNumber
    ```
