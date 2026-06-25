const { poolPromise } = require("./db");

async function checkPaymentDetailCur() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT 
                pd.RestaurantBillId,
                pd.Paymode,
                pd.Amount,
                pm.Paymode as PayModeName
            FROM dbo.PaymentDetailCur pd
            LEFT JOIN dbo.Paymode pm ON pd.Paymode = pm.Position
        `);

        console.log("=== Raw PaymentDetailCur for Today ===");
        console.log(res.recordset);

        const viewRes = await pool.request().query(`
            SELECT 
                OrderId,
                BillNumber,
                PayModeName,
                TotalAmountLessFreight,
                OrderDateTime
            FROM dbo.vw_PaymentDetailCur
            WHERE CAST(OrderDateTime AS DATE) = CAST(GETDATE() AS DATE)
        `);
        console.log("\n=== vw_PaymentDetailCur rows for Today ===");
        console.log(viewRes.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

checkPaymentDetailCur();
