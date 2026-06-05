const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log('=== SettlementTotalSales schema + data ===');
        const res = await pool.request().query("SELECT TOP 5 * FROM SettlementTotalSales");
        if (res.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(res.recordset[0]));
            res.recordset.forEach(r => console.log(r));
        } else {
            console.log("No records found");
        }

        console.log('\n=== SettlementItemDetail schema + data ===');
        const res2 = await pool.request().query("SELECT TOP 5 * FROM SettlementItemDetail");
        if (res2.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(res2.recordset[0]));
            res2.recordset.forEach(r => console.log(r));
        } else {
            console.log("No records found");
        }

        console.log('\n=== SettlementDetail schema + data ===');
        const res3 = await pool.request().query("SELECT TOP 5 * FROM SettlementDetail");
        if (res3.recordset.length > 0) {
            console.log("COLUMNS:", Object.keys(res3.recordset[0]));
            res3.recordset.forEach(r => console.log(r));
        } else {
            console.log("No records found");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
