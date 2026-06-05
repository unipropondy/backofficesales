const { sql, poolPromise } = require("../db");

async function inspectSales() {
    try {
        const pool = await poolPromise;
        const dishId = 217;
        const date = '2025-11-25';

        console.log(`--- Inspecting Sales for Dish ${dishId} on ${date} ---`);
        
        // Use string for GUID if needed, but SQL usually handles it if we don't try to compare it to an INT.
        // The error likely came from my input parameters or join.
        
        const res = await pool.request()
            .input('dishId', sql.Int, dishId)
            .input('date', sql.Date, date)
            .query(`
                SELECT 
                    VD.DishID, VD.DishCode, VD.DishName, VD.Quantity, VD.OrderId, VD.Exflag,
                    RI.BillNumber, RI.InvoiceDate, RI.TotalAmount
                FROM Vw_DishwiseSales VD
                INNER JOIN vw_RestaurantInvoiceList RI ON VD.OrderId = RI.OrderId
                WHERE VD.DishID = @dishId AND CAST(RI.InvoiceDate AS DATE) = @date
            `);
        
        console.log("Results from Vw_DishwiseSales + vw_RestaurantInvoiceList:");
        console.table(res.recordset);

        const res2 = await pool.request()
            .input('dishId', sql.Int, dishId)
            .input('date', sql.Date, date)
            .query(`
                SELECT 
                    rod.DishID, rod.DishCode, rod.DishName, rod.Quantity, rod.OrderId,
                    ri.BillNumber, ri.InvoiceDate
                FROM RestaurantOrderDetail rod
                INNER JOIN RestaurantInvoice ri ON rod.OrderId = ri.OrderId
                WHERE rod.DishID = @dishId AND CAST(ri.InvoiceDate AS DATE) = @date
            `);
        
        console.log("Results from Raw RestaurantOrderDetail + RestaurantInvoice:");
        console.table(res2.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
inspectSales();
