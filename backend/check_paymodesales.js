const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log('=== vw_Paymodesales ALL dates ===');
        const res = await pool.request().query(`
            SELECT * FROM vw_Paymodesales ORDER BY Invoicedate DESC
        `);
        
        res.recordset.forEach(r => {
            const date = r.Invoicedate ? r.Invoicedate.toISOString().split('T')[0] : 'null';
            console.log(`Date: ${date}, ItemSales: ${r.ItemSales}, Discount: ${r.Discount}, Rnd: ${r.Rnd}, Totcollect: ${r.Totcollect}`);
        });

        // Check if any date has ItemSales ~9797.66
        console.log('\n=== Checking for 9797.66 ===');
        const match = res.recordset.find(r => Math.abs(r.ItemSales - 9797.66) < 0.05);
        if (match) {
            console.log("FOUND MATCH:", match);
        } else {
            console.log("No single-day match for 9797.66");
            
            // Try summing ranges
            const dates = ['2025-11-25', '2025-11-24', '2025-11-23'];
            for (const d of dates) {
                const rec = res.recordset.find(r => r.Invoicedate?.toISOString().split('T')[0] === d);
                if (rec) console.log(`  ${d}: ItemSales=${rec.ItemSales}, Rnd=${rec.Rnd}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

check();
