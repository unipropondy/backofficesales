const { sql, poolPromise } = require("./db");

async function checkTodayRI() {
    try {
        const pool = await poolPromise;
        const systemToday = '2026-05-12'; 

        const res = await pool.request()
            .input('today', sql.Date, systemToday)
            .query("SELECT COUNT(*) as Count FROM RestaurantInvoice WHERE CAST(OrderDateTime AS DATE) = @today");
        
        console.log("RestaurantInvoice Today Count:", res.recordset[0].Count);

        const res2 = await pool.request()
            .input('today', sql.Date, systemToday)
            .query("SELECT COUNT(*) as Count FROM PaymentDetail WHERE CAST(CreatedOn AS DATE) = @today");
        
        console.log("PaymentDetail Today Count (CreatedOn):", res2.recordset[0].Count);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkTodayRI();
