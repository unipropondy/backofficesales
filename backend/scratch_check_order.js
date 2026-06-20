const { sql, poolPromise } = require("./db");

async function test() {
    const pool = await poolPromise;
    const orderId = '6E0E559E-C532-45B6-AF71-0733639EAB5D';

    console.log("--- Check in vw_RestaurantOrderDetail ---");
    const res1 = await pool.request().query(`SELECT * FROM dbo.vw_RestaurantOrderDetail WHERE OrderId = '${orderId}'`);
    console.log(res1.recordset);

    console.log("--- Check in vw_RestaurantOrderDetailCur ---");
    const res2 = await pool.request().query(`SELECT * FROM dbo.vw_RestaurantOrderDetailCur WHERE OrderId = '${orderId}'`);
    console.log(res2.recordset);

    console.log("--- Check in base RestaurantOrderDetail ---");
    const res3 = await pool.request().query(`SELECT * FROM dbo.RestaurantOrderDetail WHERE OrderId = '${orderId}'`);
    console.log(res3.recordset);

    console.log("--- Check in base RestaurantOrderDetailCur (if exists) ---");
    try {
        const res4 = await pool.request().query(`SELECT * FROM dbo.RestaurantOrderDetailCur WHERE OrderId = '${orderId}'`);
        console.log(res4.recordset);
    } catch(e) {
        console.log(e.message);
    }

    console.log("--- Check in vw_PaymentDetail ---");
    const res5 = await pool.request().query(`SELECT * FROM dbo.vw_PaymentDetail WHERE OrderId = '${orderId}'`);
    console.log(res5.recordset);

    console.log("--- Check in RestaurantOrder ---");
    const res6 = await pool.request().query(`SELECT * FROM dbo.RestaurantOrder WHERE OrderId = '${orderId}'`);
    console.log(res6.recordset);
}

test().then(() => process.exit(0)).catch(console.error);
