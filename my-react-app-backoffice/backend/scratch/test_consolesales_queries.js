const { poolPromise, sql } = require('../db');

async function testQueries() {
    const pool = await poolPromise;
    const start = '2025-11-25';
    const end = '2026-05-06';

    const queries = {
        categorySalesQuery: `
           SELECT 
                dg.DishGroupName as CategoryName,
                SUM(od.TotalDetailLineAmount) as TotalSales,
                SUM(od.Quantity) as TotalQuantity
            FROM (
                SELECT * FROM dbo.vw_RestaurantOrderDetail
                UNION ALL
                SELECT * FROM dbo.vw_RestaurantOrderDetailCur
            ) od
            INNER JOIN DishMaster dm ON od.DishId = dm.DishId 
            INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId 
             WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
           GROUP BY dg.DishGroupName
            ORDER BY TotalSales DESC;
        `,
        departmentSalesQuery: `
            SELECT 
                dg.DishGroupName as DepartmentName,
                SUM(od.TotalDetailLineAmount) as TotalSales,
                SUM(od.Quantity) as TotalQuantity
            FROM (
                SELECT * FROM dbo.vw_RestaurantOrderDetail
                UNION ALL
                SELECT * FROM dbo.vw_RestaurantOrderDetailCur
            ) od
            INNER JOIN DishMaster dm ON od.DishId = dm.DishId
            INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
            GROUP BY dg.DishGroupName
            ORDER BY TotalSales DESC
        `,
        topItemsQuery: `
            SELECT TOP 10
                dm.DishCode,
                dm.Name as ItemName,
                dg.DishGroupName as Category,
                SUM(od.Quantity) as TotalQuantity,
                SUM(od.TotalDetailLineAmount) as TotalSales
            FROM (
                SELECT * FROM dbo.vw_RestaurantOrderDetail
                UNION ALL
                SELECT * FROM dbo.vw_RestaurantOrderDetailCur
            ) od
            INNER JOIN DishMaster dm ON od.DishId = dm.DishId
            INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
            GROUP BY dm.DishCode, dm.Name, dg.DishGroupName
            ORDER BY TotalSales DESC
        `,
        slowItemsQuery: `
            SELECT TOP 10
                dm.DishCode,
                dm.Name as ItemName,
                dg.DishGroupName as Category,
                SUM(od.Quantity) as TotalQuantity,
                SUM(od.TotalDetailLineAmount) as TotalSales
            FROM (
                SELECT * FROM dbo.vw_RestaurantOrderDetail
                UNION ALL
                SELECT * FROM dbo.vw_RestaurantOrderDetailCur
            ) od
            INNER JOIN DishMaster dm ON od.DishId = dm.DishId
            INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
            GROUP BY dm.DishCode, dm.Name, dg.DishGroupName
            ORDER BY TotalSales ASC
        `,
        slowCategoryQuery: `
            SELECT TOP 10
                dg.DishGroupName as CategoryName,
                SUM(od.TotalDetailLineAmount) as TotalSales,
                SUM(od.Quantity) as TotalQuantity
            FROM (
                SELECT * FROM dbo.vw_RestaurantOrderDetail
                UNION ALL
                SELECT * FROM dbo.vw_RestaurantOrderDetailCur
            ) od
            INNER JOIN DishMaster dm ON od.DishId = dm.DishId
            INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
            GROUP BY dg.DishGroupName
            ORDER BY TotalSales ASC
        `,
        summaryQuery: `
            SELECT
                ISNULL(SUM(vrod.TotalDetailLineAmount), 0) as NetSales,
             MAX(CAST(vrod.DishGroupName AS VARCHAR(50))) as DishGroupName,
             0 as ServiceCharge,
                0 as TaxCollected,
                ISNULL(SUM(vpd.RoundedBy), 0) as Rounding,
                ISNULL(SUM(vpd.TotalDiscountAmount), 0) as TotalDiscount,
                ISNULL(SUM(vrod.TotalDetailLineAmount), 0) + ISNULL(SUM(vpd.RoundedBy), 0) as TotalRevenue
            FROM (
                SELECT * FROM dbo.vw_PaymentDetail
                UNION ALL
                SELECT * FROM dbo.vw_PaymentDetailCur
            ) vpd
            INNER JOIN (
                SELECT * FROM dbo.vw_RestaurantOrderDetail
                UNION ALL
                SELECT * FROM dbo.vw_RestaurantOrderDetailCur
            ) vrod ON vpd.OrderId = vrod.OrderId
            INNER JOIN dbo.vw_DishMaster dm ON vrod.DishId = dm.DishId
            WHERE CAST(vpd.OrderDateTime AS DATE) BETWEEN @start AND @end
        `
    };

    for (const [name, sqlQuery] of Object.entries(queries)) {
        try {
            console.log(`Running ${name}...`);
            const res = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(sqlQuery);
            console.log(`✅ ${name} succeeded! Rows: ${res.recordset.length}`);
        } catch (e) {
            console.error(`❌ ${name} failed:`, e.message);
        }
    }
    process.exit(0);
}

testQueries();
