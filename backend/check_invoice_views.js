const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        // Check Invoice table
        console.log('=== Invoice table ===');
        const inv = await pool.request().query("SELECT TOP 2 * FROM Invoice");
        if (inv.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(inv.recordset[0]));
            inv.recordset.forEach(r => console.log(r));
        } else {
            console.log("No records in Invoice");
        }

        // Check tblPOSSalesHeaderCurSalesDashboard
        console.log('\n=== tblPOSSalesHeaderCurSalesDashboard ===');
        const pos = await pool.request().query("SELECT TOP 2 * FROM tblPOSSalesHeaderCurSalesDashboard");
        if (pos.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(pos.recordset[0]));
            pos.recordset.forEach(r => console.log(r));
        } else {
            console.log("No records");
        }

        // Check SettlementTranDetail
        console.log('\n=== SettlementTranDetail ===');
        const std = await pool.request().query("SELECT TOP 2 * FROM SettlementTranDetail");
        if (std.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(std.recordset[0]));
            std.recordset.forEach(r => console.log(r));
        } else {
            console.log("No records");
        }

        // Check Database Views
        console.log('\n=== Database VIEWS ===');
        const views = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS ORDER BY TABLE_NAME");
        views.recordset.forEach(v => console.log(v.TABLE_NAME));

        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

check();
