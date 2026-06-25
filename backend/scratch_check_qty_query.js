const { poolPromise } = require("./db");

async function checkQuery() {
    try {
        const pool = await poolPromise;
        const fromDate = '2026-06-22';
        const toDate = '2026-06-23';
        const category = 'South Indian Kitchen';
        const dishGroup = 'Chicken';

        let qtyQuery = `
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
        `;

        if (category && category !== "") {
          qtyQuery += ` AND cm.CategoryName = '${category}'`;
        }

        if (dishGroup && dishGroup !== "") {
          qtyQuery += ` AND dgm.DishGroupName = '${dishGroup}'`;
        }

        qtyQuery += `
          GROUP BY 
            DATEPART(YEAR, vw.OrderDateTime),
            DATENAME(MONTH, vw.OrderDateTime),
            vw.DishName,
            dgm.DishGroupName
          ORDER BY 
            DATEPART(YEAR, vw.OrderDateTime),
            MIN(vw.OrderDateTime),
            Amount DESC
        `;

        const result = await pool.request().query(qtyQuery);
        console.log("Qty Sales query result:");
        console.log(result.recordset);
        
        // Also check if there's any other records in Vw_MonthwiseSales for this date range
        const rawRes = await pool.request().query(`
            SELECT vw.DishName, vw.Quantity, vw.TotalDetailLineAmount, vw.OrderDateTime, cm.CategoryName, dgm.DishGroupName
            FROM dbo.Vw_MonthwiseSales vw
            LEFT JOIN dbo.DishMaster dm ON vw.DishName = dm.Name
            LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
            LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
            WHERE vw.OrderDateTime >= '${fromDate}' 
              AND vw.OrderDateTime <= '${toDate} 23:59:59'
        `);
        console.log("\nRaw sales in Vw_MonthwiseSales for date range:");
        console.log(rawRes.recordset);

    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}

checkQuery();
