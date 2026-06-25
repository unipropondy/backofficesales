const { poolPromise } = require("../db");

const fromDate = '2026-06-22';
const toDate = '2026-06-23';

async function testAll() {
  const pool = await poolPromise;
  const reports = [
    {
      name: "Summary (bySales)",
      query: `
        SELECT 
          SUM(s.Sales) AS TotalSales,
          0 AS TotalQty
        FROM (
          SELECT 
            CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
            MIN(ri.InvoiceDate) AS SortDate,
            ROUND(SUM(rd.TotalDetailLineAmount), 2) AS Sales
          FROM (
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetailCur
          ) rd
          INNER JOIN (
            SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
            FROM (
              SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) ri_all
            GROUP BY OrderId
          ) ri ON rd.OrderId = ri.OrderId
          INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
          WHERE ri.InvoiceDate >= '${fromDate} 00:00:00' 
            AND ri.InvoiceDate <= '${toDate} 23:59:59'
            AND ri.StatusCode = 5
            AND ri.TotalAmount <> 0
            AND rd.TotalDetailLineAmount < 1000000
            AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
          GROUP BY CONVERT(VARCHAR, ri.InvoiceDate, 103)
        ) s
      `
    },
    {
      name: "BusinessType (bySales)",
      query: `
        SELECT 
          SUM(s.SubTotal) AS TotalSales,
          0 AS TotalQty
        FROM (
          SELECT 
            CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
            MIN(ri.InvoiceDate) AS SortDate,
            CASE 
              WHEN ro.IsTakeAway = 1 THEN 'Take Away'
              ELSE 'Dine In'
            END AS Type,
            ro.IsTakeAway,
            SUM(rd.TotalDetailLineAmount) AS SubTotal
          FROM (
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetailCur
          ) rd
          INNER JOIN (
            SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
            FROM (
              SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) ri_all
            GROUP BY OrderId
          ) ri ON rd.OrderId = ri.OrderId
          INNER JOIN (
            SELECT OrderId, IsTakeAway
            FROM (
              SELECT OrderId, IsTakeAway,
                     ROW_NUMBER() OVER(PARTITION BY OrderId ORDER BY (SELECT NULL)) as rn
              FROM (
                SELECT OrderId, IsTakeAway FROM dbo.RestaurantOrder WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
                UNION ALL
                SELECT OrderId, IsTakeAway FROM dbo.RestaurantOrderCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              ) all_ro
            ) t_ro
            WHERE rn = 1
          ) ro ON rd.OrderId = ro.OrderId
          INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
          WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
            AND ri.InvoiceDate <= '${toDate} 23:59:59'
            AND ri.StatusCode = 5
            AND ri.TotalAmount <> 0
            AND rd.TotalDetailLineAmount < 1000000
            AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
          GROUP BY 
            CONVERT(VARCHAR, ri.InvoiceDate, 103),
            ro.IsTakeAway
        ) s
      `
    },
    {
      name: "Month (byItem)",
      query: `
        SELECT 
          SUM(rd.TotalDetailLineAmount) AS TotalSales,
          0 AS TotalQty
        FROM (
          SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
          FROM dbo.RestaurantOrderDetail
          UNION ALL
          SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
          FROM dbo.RestaurantOrderDetailCur
        ) rd
        INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
        INNER JOIN (
          SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
          FROM (
            SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            UNION ALL
            SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          ) ri_all
          GROUP BY OrderId
        ) ri ON rd.OrderId = ri.OrderId
        LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
        LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
        WHERE ri.InvoiceDate >= '${fromDate} 00:00:00' 
          AND ri.InvoiceDate <= '${toDate} 23:59:59'
          AND ri.StatusCode = 5
          AND ri.TotalAmount <> 0
          AND rd.TotalDetailLineAmount < 1000000
          AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
      `
    },
    {
      name: "Qty (byItem)",
      query: `
        SELECT 
          SUM(Amount) AS TotalSales,
          0 AS TotalQty
        FROM (
          SELECT 
            CAST(SUM(rd.TotalDetailLineAmount) AS DECIMAL(10,2)) AS Amount
          FROM (
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetailCur
          ) rd
          INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
          INNER JOIN (
            SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
            FROM (
              SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) ri_all
            GROUP BY OrderId
          ) ri ON rd.OrderId = ri.OrderId
          LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
          LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
          WHERE ri.InvoiceDate >= '${fromDate} 00:00:00' 
            AND ri.InvoiceDate <= '${toDate} 23:59:59'
            AND ri.StatusCode = 5
            AND ri.TotalAmount <> 0
            AND rd.TotalDetailLineAmount < 1000000
            AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
          GROUP BY 
            DATEPART(YEAR, ri.InvoiceDate),
            DATENAME(MONTH, ri.InvoiceDate),
            dm.Name,
            dgm.DishGroupName
        ) t
      `
    },
    {
      name: "Category (byItem)",
      query: `
        SELECT 
          SUM(ItemSales) AS TotalSales,
          SUM(Sold) AS TotalQty
        FROM (
          SELECT 
            SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
            SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales
          FROM (
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetailCur
          ) rd
          INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
          INNER JOIN (
            SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
            FROM (
              SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) ri_all
            GROUP BY OrderId
          ) ri ON rd.OrderId = ri.OrderId
          LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
          LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
          WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
            AND ri.InvoiceDate <= '${toDate} 23:59:59'
            AND ri.StatusCode = 5
            AND ri.TotalAmount <> 0
            AND rd.TotalDetailLineAmount < 1000000
            AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
          GROUP BY cm.CategoryId, cm.CategoryName
        ) t
      `
    },
    {
      name: "DishGroup (byItem)",
      query: `
        SELECT 
          SUM(ItemSales) AS TotalSales,
          SUM(Sold) AS TotalQty
        FROM (
          SELECT 
            SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
            SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales
          FROM (
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetailCur
          ) rd
          INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
          INNER JOIN (
            SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
            FROM (
              SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) ri_all
            GROUP BY OrderId
          ) ri ON rd.OrderId = ri.OrderId
          LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
          LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
          WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
            AND ri.InvoiceDate <= '${toDate} 23:59:59'
            AND ri.StatusCode = 5
            AND ri.TotalAmount <> 0
            AND rd.TotalDetailLineAmount < 1000000
            AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
          GROUP BY cm.CategoryName, dgm.DishGroupName
        ) t
      `
    },
    {
      name: "Dish (byItem)",
      query: `
        SELECT 
          SUM(ItemSales) AS TotalSales,
          SUM(Sold) AS TotalQty
        FROM (
          SELECT 
            SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
            SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales
          FROM (
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetailCur
          ) rd
          INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
          INNER JOIN (
            SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
            FROM (
              SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) ri_all
            GROUP BY OrderId
          ) ri ON rd.OrderId = ri.OrderId
          LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
          LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
          WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
            AND ri.InvoiceDate <= '${toDate} 23:59:59'
            AND ri.StatusCode = 5
            AND ri.TotalAmount <> 0
            AND rd.TotalDetailLineAmount < 1000000
            AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
          GROUP BY cm.CategoryName, dgm.DishGroupName, dm.Name
        ) t
      `
    },
    {
      name: "Daywise (orderSales)",
      query: `
        SELECT 
          SUM(Amount) AS TotalSales,
          SUM(Qty) AS TotalQty
        FROM (
          SELECT 
            SUM(CAST(rd.Quantity AS DECIMAL(18,2))) AS Qty,
            SUM(CAST(rd.TotalDetailLineAmount AS DECIMAL(18,2))) AS Amount
          FROM (
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetailCur
          ) rd
          INNER JOIN (
            SELECT OrderId, MIN(OrderDateTime) AS OrderDateTime, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
            FROM (
              SELECT OrderId, OrderDateTime, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, OrderDateTime, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) ri_all
            GROUP BY OrderId
          ) ri ON rd.OrderId = ri.OrderId
          INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
          WHERE ri.OrderDateTime >= '${fromDate}'  
            AND ri.OrderDateTime < '${toDate} 23:59:59'
            AND ri.StatusCode = 5
            AND ri.TotalAmount <> 0
            AND rd.TotalDetailLineAmount < 1000000
            AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
          GROUP BY CONVERT(VARCHAR, ri.OrderDateTime, 103)
        ) t
      `
    },
    {
      name: "Itemwise (orderSales)",
      query: `
        SELECT 
          SUM(Amount) AS TotalSales,
          SUM(Qty) AS TotalQty
        FROM (
          SELECT 
            SUM(rd.Quantity) AS Qty, 
            SUM(rd.TotalDetailLineAmount) AS Amount
          FROM (
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetailCur
          ) rd
          INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
          INNER JOIN (
            SELECT OrderId, MIN(OrderDateTime) AS OrderDateTime, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
            FROM (
              SELECT OrderId, OrderDateTime, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, OrderDateTime, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) ri_all
            GROUP BY OrderId
          ) ri ON rd.OrderId = ri.OrderId
          LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
          LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
          WHERE 1=1
            AND ri.OrderDateTime >= '${fromDate}'  
            AND ri.OrderDateTime < '${toDate} 23:59:59'
            AND ri.StatusCode = 5
            AND ri.TotalAmount <> 0
            AND rd.TotalDetailLineAmount < 1000000
            AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
          GROUP BY cm.CategoryName, dgm.DishGroupName, dm.Name
        ) t
      `
    },
    {
      name: "Group (orderSales)",
      query: `
        SELECT 
          SUM(Amount) AS TotalSales,
          SUM(Qty) AS TotalQty
        FROM (
          SELECT 
            SUM(rd.Quantity) AS Qty, 
            SUM(rd.TotalDetailLineAmount) AS Amount
          FROM (
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetailCur
          ) rd
          INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
          INNER JOIN (
            SELECT OrderId, MIN(OrderDateTime) AS OrderDateTime, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
            FROM (
              SELECT OrderId, OrderDateTime, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, OrderDateTime, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) ri_all
            GROUP BY OrderId
          ) ri ON rd.OrderId = ri.OrderId
          LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
          WHERE 1=1
            AND ri.OrderDateTime >= '${fromDate}'  
            AND ri.OrderDateTime < '${toDate} 23:59:59'
            AND ri.StatusCode = 5
            AND ri.TotalAmount <> 0
            AND rd.TotalDetailLineAmount < 1000000
            AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
          GROUP BY dgm.DishGroupName
        ) t
      `
    },
    {
      name: "TopNItems (dayEnd)",
      query: `
        SELECT 
          SUM(Amount) AS TotalSales,
          SUM(Quantity) AS TotalQty
        FROM (
          SELECT 
            CAST(SUM(rd.Quantity) AS DECIMAL(18,2)) AS Quantity,
            CAST(SUM(rd.TotalDetailLineAmount) AS DECIMAL(18,2)) AS Amount
          FROM (
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetail
            UNION ALL
            SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
            FROM dbo.RestaurantOrderDetailCur
          ) rd
          INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
          INNER JOIN (
            SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate, MAX(StatusCode) AS StatusCode, MAX(TotalAmount) AS TotalAmount
            FROM (
              SELECT OrderId, InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, CAST(CreatedOn AS DATE) AS InvoiceDate, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) ri_all
            GROUP BY OrderId
          ) ri ON rd.OrderId = ri.OrderId
          WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
            AND ri.InvoiceDate <= '${toDate} 23:59:59'
            AND ri.StatusCode = 5
            AND ri.TotalAmount <> 0
            AND rd.TotalDetailLineAmount < 1000000
            AND NOT (rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50 AND dm.Name = 'Masala Omelette ' AND rd.OrderId = '6C3F5E7D-4164-42A2-8E7F-A32F0D93B755')
          GROUP BY dm.DishCode, dm.Name
        ) t
      `
    }
  ];

  for (let rep of reports) {
    try {
      const res = await pool.request().query(rep.query);
      const row = res.recordset[0];
      console.log(`REPORT: ${rep.name.padEnd(25)} => Qty: ${Number(row.TotalQty || 0).toFixed(2).padStart(8)}, Amount: ${Number(row.TotalSales || 0).toFixed(2).padStart(10)}`);
    } catch (err) {
      console.error(`ERROR running ${rep.name}:`, err.message);
    }
  }

  process.exit(0);
}

testAll();
