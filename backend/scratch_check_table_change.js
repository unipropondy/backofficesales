const { poolPromise } = require("./db");

async function checkTableChangeData() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TOP 20
                OrderNumber,
                SourceTable,
                Tableno,
                StatusCode,
                OrderDateTime
            FROM dbo.RestaurantOrder
            ORDER BY OrderDateTime DESC;
        `);
        console.log("=== RestaurantOrder Sample ===");
        console.log(res.recordset);

        const res2 = await pool.request().query(`
            SELECT 
                COUNT(*) as TotalOrders,
                SUM(CASE WHEN SourceTable IS NULL THEN 1 ELSE 0 END) as NullSourceTable,
                SUM(CASE WHEN SourceTable IS NOT NULL THEN 1 ELSE 0 END) as NotNullSourceTable,
                SUM(CASE WHEN Tableno IS NULL THEN 1 ELSE 0 END) as NullTableno,
                SUM(CASE WHEN Tableno IS NOT NULL THEN 1 ELSE 0 END) as NotNullTableno
            FROM dbo.RestaurantOrder;
        `);
        console.log("\n=== Totals ===");
        console.log(res2.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkTableChangeData();
