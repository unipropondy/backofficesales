const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        // List ALL tables in database
        const tables = await pool.request()
            .query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
        
        console.log('=== ALL TABLES IN DATABASE ===');
        tables.recordset.forEach(r => console.log(r.TABLE_NAME));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
