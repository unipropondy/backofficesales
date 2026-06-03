const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        // Get all SettlementHeader with dates and join with SettlementTotalSales
        console.log('=== SettlementHeader + SettlementTotalSales joined ===');
        const res = await pool.request().query(`
            SELECT 
                sh.SettlementID,
                CAST(sh.LastSettlementDate AS DATE) as Date,
                sh.SubTotal,
                sh.RoundedBy,
                SUM(sts.SysAmount) as TotalSysAmount,
                SUM(sts.ReceiptCount) as TotalReceipts
            FROM SettlementHeader sh
            LEFT JOIN SettlementTotalSales sts ON sh.SettlementID = sts.SettlementID
            GROUP BY sh.SettlementID, sh.LastSettlementDate, sh.SubTotal, sh.RoundedBy
            ORDER BY sh.LastSettlementDate DESC
        `);
        
        res.recordset.forEach(r => {
            console.log(`Date: ${r.Date?.toISOString()?.split('T')[0]}, SubTotal: ${r.SubTotal}, RoundedBy: ${r.RoundedBy}, TotalSysAmount: ${r.TotalSysAmount}, Receipts: ${r.TotalReceipts}`);
        });

        // Also check Sheet1/Sheet2/Sheet3 tables which are suspicious
        console.log('\n=== Sheet1 schema ===');
        const s1 = await pool.request().query("SELECT TOP 3 * FROM Sheet1");
        if (s1.recordset.length > 0) {
            console.log("Sheet1 COLUMNS:", Object.keys(s1.recordset[0]));
            s1.recordset.forEach(r => console.log(r));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
