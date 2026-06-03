const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        const start = '2026-04-10';
        const end = '2026-04-10';
        
        console.log('--- Testing Individual Tables ---');
        try {
            const res1 = await pool.request().query("SELECT TOP 1 OrderDateTime FROM temporderDetail");
            console.log('temporderDetail.OrderDateTime:', res1.recordset[0]);
        } catch(e) { console.log('temporderDetail Check Failed:', e.message); }

        try {
            const res2 = await pool.request().query("SELECT TOP 1 Date FROM CashierSettlement");
            console.log('CashierSettlement.Date:', res2.recordset[0]);
        } catch(e) { console.log('CashierSettlement Check Failed:', e.message); }

        console.log('\n--- Testing Full Summary Query ---');
        const summaryQuery = `
            SELECT 
                SUM(ISNULL(TotalDetailLineAmount, 0)) as NetSales,
                SUM(ISNULL(ServiceCharge, 0)) as ServiceCharge,
                SUM(ISNULL(Tax, 0)) as TaxCollected,
                (SELECT SUM(ISNULL(SortOrExces, 0)) FROM CashierSettlement WHERE CAST([Date] AS DATE) BETWEEN @start AND @end) as Rounding,
                SUM(ISNULL(TotalDetailLineAmount, 0)) + SUM(ISNULL(ServiceCharge, 0)) + SUM(ISNULL(Tax, 0)) as TotalRevenue
            FROM temporderDetail
            WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
        `;
        
        const result = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(summaryQuery);
        
        console.log('Summary Result:', result.recordset);

    } catch (err) {
        console.error('FINAL ERROR:', err.message);
    }
}
run();
