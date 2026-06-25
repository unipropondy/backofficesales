const { poolPromise } = require("./db");

async function checkBadTestData() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
              dm.Name as Item,
              rd.Quantity,
              rd.TotalDetailLineAmount,
              rd.OrderDateTime
            FROM dbo.RestaurantOrderDetail rd
            JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
            WHERE rd.TotalDetailLineAmount > 1000000
        `;
        const res = await pool.request().query(query);
        console.log("Bad test records in RestaurantOrderDetail:");
        console.log(res.recordset);

        const query2 = `
            SELECT 
              dm.Name as Item,
              rd.Quantity,
              rd.TotalDetailLineAmount,
              rd.OrderDateTime
            FROM dbo.RestaurantOrderDetailCur rd
            JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
            WHERE rd.TotalDetailLineAmount > 1000000
        `;
        const res2 = await pool.request().query(query2);
        console.log("Bad test records in RestaurantOrderDetailCur:");
        console.log(res2.recordset);

    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}

checkBadTestData();
