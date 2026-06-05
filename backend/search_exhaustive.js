const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        const target = 9797.66;
        
        console.log(`Searching for ${target} in all tables...`);
        
        const tablesRes = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        const tables = tablesRes.recordset.map(r => r.TABLE_NAME);
        
        for (const table of tables) {
            try {
                const res = await pool.request().query(`SELECT * FROM [${table}]`);
                res.recordset.forEach(row => {
                    for (const key in row) {
                        if (typeof row[key] === 'number' && Math.abs(row[key] - target) < 0.05) {
                            console.log(`MATCH in [${table}]: Col [${key}] = ${row[key]} | Row:`, row);
                        }
                    }
                });
            } catch (e) {
                // Ignore errors for tables we can't query
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
