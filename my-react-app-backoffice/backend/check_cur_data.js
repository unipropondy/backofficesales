const { sql, poolPromise } = require("./db");

async function checkCurData() {
    try {
        const pool = await poolPromise;
        const systemToday = '2026-05-12'; 

        const res = await pool.request()
            .input('today', sql.Date, systemToday)
            .query("SELECT COUNT(*) as Count FROM PaymentDetailCur WHERE CAST(CreatedOn AS DATE) = @today");
        
        console.log("PaymentDetailCur Today Count:", res.recordset[0].Count);

        const res2 = await pool.request()
            .input('today', sql.Date, systemToday)
            .query("SELECT COUNT(*) as Count FROM RestaurantOrderDetailCur od INNER JOIN RestaurantOrderCur ro ON od.OrderId = ro.OrderId WHERE CAST(ro.OrderDateTime AS DATE) = @today");
        
        console.log("RestaurantOrderDetailCur Today Count:", res2.recordset[0].Count);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkCurData();
