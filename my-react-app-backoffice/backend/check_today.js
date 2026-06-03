const { sql, poolPromise } = require("./db");

async function checkTodayData() {
    try {
        const pool = await poolPromise;
        const systemToday = '2026-05-12'; 

        console.log(`\n🔍 Checking data for: ${systemToday}`);

        // Helper to check columns
        async function getCols(tableName) {
            const res = await pool.request().query(`SELECT TOP 1 * FROM ${tableName}`);
            return res.recordset.length > 0 ? Object.keys(res.recordset[0]) : [];
        }

        const pdCols = await getCols('dbo.PaymentDetail');
        console.log(`\n📊 PaymentDetail Columns:`, pdCols.join(', '));
        
        const roCols = await getCols('dbo.RestaurantOrder');
        console.log(`📊 RestaurantOrder Columns:`, roCols.join(', '));

        const dateColPD = pdCols.find(c => c.toLowerCase().includes('date') || c.toLowerCase().includes('time')) || 'OrderDateTime';
        const dateColRO = roCols.find(c => c.toLowerCase().includes('date') || c.toLowerCase().includes('time')) || 'OrderDateTime';

        console.log(`\n🔎 Using Date Columns - PD: ${dateColPD}, RO: ${dateColRO}`);

        // 1. Check PaymentDetail
        const paymentCheck = await pool.request()
            .input('today', sql.Date, systemToday)
            .query(`
                SELECT 
                    COUNT(*) as Count,
                    MIN(${dateColPD}) as MinTime,
                    MAX(${dateColPD}) as MaxTime
                FROM dbo.PaymentDetail
                WHERE CAST(${dateColPD} AS DATE) = @today
            `);
        
        console.log("\n💳 PaymentDetail (Base Table):");
        console.table(paymentCheck.recordset);

        // 2. Check RestaurantOrderDetail
        const orderDetailCheck = await pool.request()
            .input('today', sql.Date, systemToday)
            .query(`
                SELECT 
                    COUNT(*) as Count
                FROM dbo.RestaurantOrderDetail od
                INNER JOIN dbo.RestaurantOrder ro ON od.OrderId = ro.OrderId
                WHERE CAST(ro.${dateColRO} AS DATE) = @today
            `);
        
        console.log("\n📦 RestaurantOrderDetail (Base Table):");
        console.table(orderDetailCheck.recordset);

        // 3. Check SettlementHeader
        const settlementCheck = await pool.request()
            .input('today', sql.Date, systemToday)
            .query(`
                SELECT 
                    COUNT(*) as Count,
                    MIN(LastSettlementDate) as MinTime,
                    MAX(LastSettlementDate) as MaxTime
                FROM dbo.SettlementHeader
                WHERE CAST(LastSettlementDate AS DATE) = @today
            `);
        
        console.log("\n🏦 SettlementHeader:");
        console.table(settlementCheck.recordset);

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}


checkTodayData();
