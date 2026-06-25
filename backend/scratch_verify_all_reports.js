const { poolPromise } = require("./db");

async function verifyAllReports() {
    try {
        const pool = await poolPromise;
        const testDate = '2026-06-19';

        console.log(`\n========================================`);
        console.log(`🔍 STARTING METADATA VERIFICATION FOR DATE: ${testDate}`);
        console.log(`========================================\n`);

        // 1. Verify Sales & Round Off from SettlementHeader (Day End Report Source)
        const dayEndHeaderRes = await pool.request().query(`
            SELECT 
                SUM(ISNULL(SubTotal, 0)) as TotalSales,
                SUM(ISNULL(RoundedBy, 0)) as RoundOff,
                COUNT(*) as SettlementRecords
            FROM SettlementHeader
            WHERE CAST(DATEADD(HOUR, 8, LastSettlementDate) AS DATE) = '${testDate}'
        `);
        const headerRow = dayEndHeaderRes.recordset[0];
        console.log("📊 [Database] DayEnd SettlementHeader totals:");
        console.log(`   - Total Sales: ${headerRow.TotalSales}`);
        console.log(`   - Round Off: ${headerRow.RoundOff}`);
        console.log(`   - Records Found: ${headerRow.SettlementRecords}\n`);

        // 2. Verify Payments Breakdown from SettlementDetail (Day End Paymodes)
        const dayEndDetailsRes = await pool.request().query(`
            SELECT 
                sd.Paymode,
                SUM(ISNULL(sd.SysAmount, 0)) as TotalAmount,
                SUM(ISNULL(sd.ReceiptCount, 0)) as TotalCount
            FROM SettlementDetail sd
            INNER JOIN SettlementHeader sh ON sd.SettlementId = sh.SettlementID
            WHERE CAST(DATEADD(HOUR, 8, sh.LastSettlementDate) AS DATE) = '${testDate}'
            GROUP BY sd.Paymode
        `);
        console.log("💳 [Database] DayEnd SettlementDetail payment breakdown:");
        dayEndDetailsRes.recordset.forEach(r => {
            console.log(`   - ${r.Paymode}: $${r.TotalAmount} (${r.TotalCount} txs)`);
        });
        console.log("");

        // 3. Verify Consolidated Report Totals (from RestaurantOrderDetail and RestaurantOrder tables)
        const salesTotalRes = await pool.request().query(`
            SELECT 
                SUM(TotalDetailLineAmount) as NetSales,
                SUM(Quantity) as Quantity
            FROM (
                SELECT TotalDetailLineAmount, Quantity, OrderDateTime, OrderId FROM dbo.vw_RestaurantOrderDetail
                UNION ALL
                SELECT TotalDetailLineAmount, Quantity, OrderDateTime, OrderId FROM dbo.vw_RestaurantOrderDetailCur
            ) od
            WHERE CAST(od.OrderDateTime AS DATE) = '${testDate}'
        `);
        console.log("📈 [Database] Consolidated Report Sales totals:");
        console.log(`   - Net Sales: ${salesTotalRes.recordset[0].NetSales}`);
        console.log(`   - Total Quantity Sold: ${salesTotalRes.recordset[0].Quantity}\n`);

        // 4. Verify Consolidated Paymode Breakdown (from PaymentDetail / PaymentDetailCur)
        const paymodeRes = await pool.request().query(`
            SELECT 
                PayModeName,
                SUM(TotalAmountLessFreight) as TotalAmount,
                COUNT(DISTINCT BillNumber) as TransactionCount
            FROM (
                SELECT TotalAmountLessFreight, BillNumber, PayModeName, OrderDateTime FROM dbo.vw_PaymentDetail
                UNION ALL
                SELECT TotalAmountLessFreight, BillNumber, PayModeName, OrderDateTime FROM dbo.vw_PaymentDetailCur
            ) pd
            WHERE CAST(pd.OrderDateTime AS DATE) = '${testDate}'
            GROUP BY PayModeName
        `);
        console.log("💰 [Database] Consolidated Report Payment breakdown:");
        paymodeRes.recordset.forEach(r => {
            console.log(`   - ${r.PayModeName || 'UNKNOWN'}: $${r.TotalAmount} (${r.TransactionCount} txs)`);
        });

        console.log(`\n========================================`);
        console.log(`✅ VERIFICATION COMPLETED SUCCESSFULLY!`);
        console.log(`========================================\n`);

        process.exit(0);
    } catch(e) {
        console.error("Verification failed:", e);
        process.exit(1);
    }
}

verifyAllReports();
