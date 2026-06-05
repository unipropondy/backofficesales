const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const res = await pool.request()
            .query("SELECT COUNT(*) as cnt FROM RestaurantOrderDetail WHERE OrderDateTime >= '2026-04-20'");
        console.log('Orders since April 20, 2026:', res.recordset[0].cnt);

        const latest = await pool.request().query("SELECT MAX(OrderDateTime) as maxdt FROM RestaurantOrderDetail");
        console.log('LATEST Order in RestaurantOrderDetail:', latest.recordset[0].maxdt);
    } catch (err) {
        console.error(err);
    }
}
run();
