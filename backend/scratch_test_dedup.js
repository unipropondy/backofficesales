const { poolPromise } = require("./db");

async function testDeduplicated() {
    try {
        const pool = await poolPromise;
        const fromDate = '2026-06-22';
        const toDate = '2026-06-23';

        const qtyQuery = `
            WITH UniqueInvoices AS (
              SELECT OrderId, OrderDateTime, StatusCode, InvoiceDate
              FROM (
                SELECT OrderId, OrderDateTime, StatusCode, InvoiceDate,
                       ROW_NUMBER() OVER (PARTITION BY OrderId ORDER BY InvoiceDate DESC) as rn
                FROM (
                  SELECT OrderId, OrderDateTime, StatusCode, InvoiceDate FROM dbo.RestaurantInvoice
                  UNION ALL
                  SELECT OrderId, OrderDateTime, StatusCode, CAST(CreatedOn AS DATE) as InvoiceDate FROM dbo.RestaurantInvoicecur
                ) t
              ) t2
              WHERE rn = 1
            )
            SELECT 
              DATEPART(YEAR, rod.OrderDateTime) AS Year,
              DATENAME(MONTH, rod.OrderDateTime) AS Month,
              dm.Name AS Item,
              dgm.DishGroupName,
              CAST(SUM(rod.TotalDetailLineAmount) AS DECIMAL(10,2)) AS Amount
            FROM dbo.RestaurantOrderDetail rod
            INNER JOIN UniqueInvoices ri ON ri.OrderId = rod.OrderId
            INNER JOIN dbo.DishMaster dm ON rod.DishId = dm.DishId
            LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
            LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
            INNER JOIN dbo.PickListMaster pl ON ri.StatusCode = pl.PickListNumber
            WHERE pl.TableName = 'RestaurantOrder' AND pl.FieldName = 'StatusCode' AND pl.PickListValue = 'Paid'
              AND cm.CategoryName = 'South Indian Kitchen' AND dgm.DishGroupName = 'Chicken'
              AND rod.OrderDateTime >= '${fromDate}' 
              AND rod.OrderDateTime <= '${toDate} 23:59:59'
            GROUP BY 
              DATEPART(YEAR, rod.OrderDateTime),
              DATENAME(MONTH, rod.OrderDateTime),
              dm.Name,
              dgm.DishGroupName
        `;

        const qtyRes = await pool.request().query(qtyQuery);
        console.log("Deduplicated Qty Sales results:");
        console.log(qtyRes.recordset);

        const catQuery = `
            WITH UniqueInvoices AS (
              SELECT OrderId, OrderDateTime, StatusCode, InvoiceDate
              FROM (
                SELECT OrderId, OrderDateTime, StatusCode, InvoiceDate,
                       ROW_NUMBER() OVER (PARTITION BY OrderId ORDER BY InvoiceDate DESC) as rn
                FROM (
                  SELECT OrderId, OrderDateTime, StatusCode, InvoiceDate FROM dbo.RestaurantInvoice
                  UNION ALL
                  SELECT OrderId, OrderDateTime, StatusCode, CAST(CreatedOn AS DATE) as InvoiceDate FROM dbo.RestaurantInvoicecur
                ) t
              ) t2
              WHERE rn = 1
            )
            SELECT 
              ISNULL(cm.CategoryName, 'Uncategorized') AS CategoryName,
              SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
              SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales,
              0 AS ItemDisc,
              0 AS Foc,
              SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS NetSales
            FROM UniqueInvoices ri
            INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
            LEFT JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
            LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
            LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
            INNER JOIN dbo.PickListMaster pl ON ri.StatusCode = pl.PickListNumber
            WHERE pl.TableName = 'RestaurantOrder' AND pl.FieldName = 'StatusCode' AND pl.PickListValue = 'Paid'
              AND cm.CategoryName = 'South Indian Kitchen' AND dgm.DishGroupName = 'Chicken'
              AND ri.InvoiceDate >= '${fromDate} 00:00:00'
              AND ri.InvoiceDate <= '${toDate} 23:59:59'
            GROUP BY cm.CategoryId, cm.CategoryName
        `;
        const catRes = await pool.request().query(catQuery);
        console.log("\nDeduplicated Category Sales results:");
        console.log(catRes.recordset);

    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

testDeduplicated();
