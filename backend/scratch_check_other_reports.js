const { poolPromise } = require("./db");

async function checkOtherReports() {
    try {
        const pool = await poolPromise;
        const fromDate = '2026-06-22';
        const toDate = '2026-06-23';
        const category = 'South Indian Kitchen';
        const dishGroup = 'Chicken';

        console.log("--- Dish Sales Query ---");
        let dishQuery = `
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
        `;
        if (category && category !== "") {
            dishQuery += ` AND cm.CategoryName = '${category}'`;
        }
        if (dishGroup && dishGroup !== "") {
            dishQuery += ` AND dgm.DishGroupName = '${dishGroup}'`;
        }
        dishQuery += ` 
            GROUP BY cm.CategoryName, dgm.DishGroupName, dm.Name
            ORDER BY cm.CategoryName, dgm.DishGroupName, dm.Name
        `;

        const dishRes = await pool.request().query(dishQuery);
        console.log(dishRes.recordset);

        console.log("\n--- Dish Group Sales Query ---");
        let dgQuery = `
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
        `;
        if (category && category !== "") {
            dgQuery += ` AND cm.CategoryName = '${category}'`;
        }
        if (dishGroup && dishGroup !== "") {
            dgQuery += ` AND dgm.DishGroupName = '${dishGroup}'`;
        }
        dgQuery += ` 
            GROUP BY cm.CategoryName, dgm.DishGroupName
            ORDER BY cm.CategoryName, dgm.DishGroupName
        `;
        const dgRes = await pool.request().query(dgQuery);
        console.log(dgRes.recordset);

    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

checkOtherReports();
