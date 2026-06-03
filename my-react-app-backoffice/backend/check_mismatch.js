const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log('=== ALL SettlementHeader Records ===');
        const res = await pool.request()
            .query("SELECT CAST(LastSettlementDate AS DATE) as Date, SubTotal, RoundedBy, SubTotal + RoundedBy as TotalRevenue, TotalTax, ServiceCharge, DiscountAmount FROM SettlementHeader ORDER BY LastSettlementDate DESC");
        
        res.recordset.forEach(r => {
            console.log(`Date: ${r.Date?.toISOString()?.split('T')[0]}, SubTotal: ${r.SubTotal}, RoundedBy: ${r.RoundedBy}, TotalRevenue: ${r.TotalRevenue}`);
        });

        console.log('\n=== Searching for 13674.32 in SettlementHeader (any range) ===');
        const res2 = await pool.request()
            .query("SELECT CAST(LastSettlementDate AS DATE) as Date, SUM(SubTotal) as Total FROM SettlementHeader GROUP BY CAST(LastSettlementDate AS DATE) HAVING SUM(SubTotal) BETWEEN 13670 AND 13680");
        
        if (res2.recordset.length === 0) {
            console.log('Not found as single-day total. Checking multi-day ranges...');
            
            // Check if 13674.32 is a sum of multiple days
            const res3 = await pool.request()
                .query("SELECT SUM(SubTotal) as Total FROM SettlementHeader WHERE CAST(LastSettlementDate AS DATE) BETWEEN '2025-11-21' AND '2025-11-24'");
            console.log('2025-11-21 to 2025-11-24 sum:', res3.recordset[0].Total);

            const res4 = await pool.request()
                .query("SELECT SUM(SubTotal) as Total FROM SettlementHeader WHERE CAST(LastSettlementDate AS DATE) BETWEEN '2025-11-22' AND '2025-11-25'");
            console.log('2025-11-22 to 2025-11-25 sum:', res4.recordset[0].Total);

            const res5 = await pool.request()
                .query("SELECT SUM(SubTotal) as Total FROM SettlementHeader WHERE CAST(LastSettlementDate AS DATE) BETWEEN '2025-11-23' AND '2025-11-25'");
            console.log('2025-11-23 to 2025-11-25 sum:', res5.recordset[0].Total);
        } else {
            res2.recordset.forEach(r => console.log(`MATCH Date: ${r.Date?.toISOString()?.split('T')[0]}, Total: ${r.Total}`));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
