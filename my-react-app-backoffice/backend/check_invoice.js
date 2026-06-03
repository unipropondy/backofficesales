const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log('=== RestaurantInvoice schema + sample ===');
        const schema = await pool.request().query("SELECT TOP 1 * FROM RestaurantInvoice");
        if (schema.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(schema.recordset[0]));
        } else {
            console.log("No records");
        }

        console.log('\n=== RestaurantInvoice daily totals ===');
        const res = await pool.request().query(`
            SELECT CAST(InvoiceDate AS DATE) as Date, 
                   COUNT(*) as Count,
                   SUM(NetAmount) as NetTotal
            FROM RestaurantInvoice 
            GROUP BY CAST(InvoiceDate AS DATE) 
            ORDER BY Date DESC
        `);
        res.recordset.forEach(r => {
            console.log(`Date: ${r.Date?.toISOString()?.split('T')[0]}, Count: ${r.Count}, Net: ${r.NetTotal}`);
        });

        process.exit(0);
    } catch (err) {
        // Try different column names
        console.error("RestaurantInvoice error:", err.message);
        
        const pool = await poolPromise;
        const schema = await pool.request().query("SELECT TOP 1 * FROM RestaurantInvoice");
        if (schema.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(schema.recordset[0]));
            console.log("SAMPLE:", schema.recordset[0]);
        }
        process.exit(0);
    }
}

check();
