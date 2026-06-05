const { poolPromise, sql } = require("./db");

async function checkQueryWithDates() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT TOP 10
                ISNULL(cm.CategoryName, 'Unknown')    AS [Category Name],
                ISNULL(dg.DishGroupName, 'Unknown')   AS [DishGroup Name],
                ISNULL(dm.Name, rod.DishName)         AS [DishName],
                CONVERT(VARCHAR(10), rod.OrderDateTime, 103) AS [TranDate],
                SUM(ISNULL(rod.Quantity, 0)) AS [SQty]
            FROM RestaurantOrderDetail rod
            LEFT JOIN DishMaster dm ON rod.DishId = dm.DishId
            LEFT JOIN DishGroupMaster dg ON dm.DishGroupId = dg.DishGroupId
            LEFT JOIN CategoryMaster cm ON dg.CategoryId = cm.CategoryId
            WHERE rod.OrderDateTime BETWEEN '2024-01-01' AND '2026-12-31'
            GROUP BY 
                cm.CategoryName,
                dg.DishGroupName,
                dm.Name,
                rod.DishName,
                CONVERT(VARCHAR(10), rod.OrderDateTime, 103)
            ORDER BY [SQty] DESC
        `;
        
        const res = await pool.request().query(query);
        console.log("Results with SQty (ordered by desc):");
        console.log(JSON.stringify(res.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkQueryWithDates();
