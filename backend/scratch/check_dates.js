const { sql, poolPromise } = require("../db");

async function checkDates() {
    try {
        const pool = await poolPromise;
        const dishId = 217;
        const targetDate = '2025-11-25';

        console.log(`--- Checking Dates for Dish ${dishId} on ${targetDate} ---`);
        
        const res = await pool.request()
            .input('dishId', sql.Int, dishId)
            .query(`
                SELECT TOP 20
                    rod.DishId, rod.Quantity, rod.OrderId, rod.Exflag,
                    ri.InvoiceDate, ri.OrderDateTime, ri.BillNumber
                FROM RestaurantOrderDetail rod
                INNER JOIN RestaurantInvoice ri ON rod.OrderId = ri.OrderId
                WHERE rod.DishID = @dishId
                ORDER BY ri.InvoiceDate DESC
            `);
        
        console.log("RestaurantOrderDetail + RestaurantInvoice (Historical):");
        console.table(res.recordset);

        const res2 = await pool.request()
            .input('dishId', sql.Int, dishId)
            .query(`
                SELECT TOP 20
                    rod.DishId, rod.Quantity, rod.OrderId, rod.Exflag,
                    ri.InvoiceDate, ri.OrderDateTime, ri.BillNumber
                FROM RestaurantOrderDetailCur rod
                INNER JOIN RestaurantInvoiceCur ri ON rod.OrderId = ri.OrderId
                WHERE rod.DishID = @dishId
                ORDER BY ri.InvoiceDate DESC
            `);
        
        console.log("RestaurantOrderDetailCur + RestaurantInvoiceCur (Current):");
        console.table(res2.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkDates();
