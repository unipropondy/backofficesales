const { sql, poolPromise } = require("./db");

async function test() {
    const pool = await poolPromise;
    const start = '2026-06-19';
    const end = '2026-06-19';

    console.log("--- RestaurantOrderDetail (Base) ---");
    const r1 = await pool.request().query(`
        SELECT COUNT(*) as Cnt, SUM(TotalDetailLineAmount) as TotalSum 
        FROM dbo.RestaurantOrderDetail 
        WHERE CAST(OrderDateTime AS DATE) = '2026-06-19'
    `);
    console.log(r1.recordset);

    console.log("--- RestaurantOrderDetailCur (Base) ---");
    const r2 = await pool.request().query(`
        SELECT COUNT(*) as Cnt, SUM(TotalDetailLineAmount) as TotalSum 
        FROM dbo.RestaurantOrderDetailCur 
        WHERE CAST(OrderDateTime AS DATE) = '2026-06-19'
    `);
    console.log(r2.recordset);

    console.log("--- PaymentDetail (Base) ---");
    const r3 = await pool.request().query(`
        SELECT COUNT(*) as Cnt, SUM(Amount) as TotalSum 
        FROM dbo.PaymentDetail 
        WHERE RestaurantBillId IN (
            SELECT RestaurantBillId FROM dbo.RestaurantInvoice WHERE CAST(InvoiceDate AS DATE) = '2026-06-19'
        )
    `);
    console.log(r3.recordset);

    console.log("--- PaymentDetailCur (Base) ---");
    const r4 = await pool.request().query(`
        SELECT COUNT(*) as Cnt, SUM(Amount) as TotalSum 
        FROM dbo.PaymentDetailCur 
        WHERE RestaurantBillId IN (
            SELECT RestaurantBillId FROM dbo.RestaurantInvoiceCur WHERE CAST(InvoiceDate AS DATE) = '2026-06-19'
        )
    `);
    console.log(r4.recordset);
}

test().then(() => process.exit(0)).catch(console.error);
