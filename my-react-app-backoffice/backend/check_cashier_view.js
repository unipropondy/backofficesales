const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log('=== vw_CashierSales totals by date ===');
        const res = await pool.request().query(`
            SELECT InvoiceDate, SUM(NetAmount) as Total, COUNT(*) as Rows
            FROM vw_CashierSales
            GROUP BY InvoiceDate
            ORDER BY InvoiceDate DESC
        `);
        res.recordset.forEach(r => {
            console.log(`Date: ${r.InvoiceDate}, Total: ${r.Total?.toFixed(2)}, Rows: ${r.Rows}`);
        });

        console.log('\n=== vw_CashierSales for 2025-11-25 ===');
        const res2 = await pool.request()
            .query("SELECT SUM(NetAmount) as Total FROM vw_CashierSales WHERE InvoiceDate = '2025-11-25'");
        console.log("Total for 2025-11-25:", res2.recordset[0].Total);

        console.log('\n=== vw_RestaurantDailyHistorySales totals by date ===');
        const res3 = await pool.request().query(`
            SELECT InvoiceDate, SUM(NetAmount) as Total
            FROM vw_RestaurantDailyHistorySales
            GROUP BY InvoiceDate
            ORDER BY InvoiceDate DESC
        `);
        res3.recordset.forEach(r => {
            console.log(`Date: ${r.InvoiceDate}, Total: ${r.Total?.toFixed(2)}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

check();
