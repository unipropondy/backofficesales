const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        // Get vw_CashierSales columns
        console.log('=== vw_CashierSales columns ===');
        const cols = await pool.request().query("SELECT TOP 1 * FROM vw_CashierSales");
        if (cols.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(cols.recordset[0]));
            console.log("SAMPLE:", cols.recordset[0]);
        }

        // Sum by InvoiceDate using correct column
        const colNames = cols.recordset.length > 0 ? Object.keys(cols.recordset[0]) : [];
        const amountCol = colNames.find(c => c.toLowerCase().includes('amount') || c.toLowerCase().includes('sales') || c.toLowerCase().includes('net'));
        console.log("Amount column found:", amountCol);

        if (amountCol) {
            const res = await pool.request().query(`
                SELECT InvoiceDate, SUM([${amountCol}]) as Total
                FROM vw_CashierSales
                GROUP BY InvoiceDate
                ORDER BY InvoiceDate DESC
            `);
            res.recordset.forEach(r => console.log(`Date: ${r.InvoiceDate}, Total: ${r.Total?.toFixed(2)}`));
        }

        // Check vw_RestaurantDailyHistorySales columns
        console.log('\n=== vw_RestaurantDailyHistorySales columns ===');
        const h = await pool.request().query("SELECT TOP 1 * FROM vw_RestaurantDailyHistorySales");
        if (h.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(h.recordset[0]));
            console.log("SAMPLE:", h.recordset[0]);
        }

        // Check vw_Paymodesales
        console.log('\n=== vw_Paymodesales columns + totals ===');
        const pm = await pool.request().query("SELECT TOP 2 * FROM vw_Paymodesales");
        if (pm.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(pm.recordset[0]));
            pm.recordset.forEach(r => console.log(r));
        }

        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

check();
