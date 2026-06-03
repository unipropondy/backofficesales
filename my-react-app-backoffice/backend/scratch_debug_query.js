const { poolPromise, sql } = require("./db");

async function checkQuery() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT TOP 10
                ISNULL(cm.CategoryName, 'Unknown')    AS [Category Name],
                ISNULL(dg.DishGroupName, 'Unknown')   AS [DishGroup Name],
                ISNULL(dm.Name, rod.DishName)         AS [DishName],
                CONVERT(VARCHAR(10), rod.OrderDateTime, 103) AS [TranDate],
                SUM(CASE WHEN rod.PFlag IN ('R', 'D') OR rod.PFlag IS NULL OR rod.PFlag = '' THEN ISNULL(rod.Quantity, 0) ELSE 0 END) AS [SQty]
            FROM RestaurantOrderDetail rod
            LEFT JOIN DishMaster dm ON rod.DishId = dm.DishId
            LEFT JOIN DishGroupMaster dg ON dm.DishGroupId = dg.DishGroupId
            LEFT JOIN CategoryMaster cm ON dg.CategoryId = cm.CategoryId
            GROUP BY 
                cm.CategoryName,
                dg.DishGroupName,
                dm.Name,
                rod.DishName,
                CONVERT(VARCHAR(10), rod.OrderDateTime, 103)
            HAVING SUM(CASE WHEN rod.PFlag IN ('R', 'D') OR rod.PFlag IS NULL OR rod.PFlag = '' THEN ISNULL(rod.Quantity, 0) ELSE 0 END) > 0
        `;
        
        const res = await pool.request().query(query);
        console.log("Results with SQty > 0:");
        console.log(JSON.stringify(res.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkQuery();
