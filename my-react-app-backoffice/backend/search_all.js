const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        const tables = ['SettlementHeader', 'RestaurantOrderDetail', 'RestaurantOrder', 'CashierSettlement'];
        const target = 9797.66;
        
        for (const table of tables) {
            console.log(`Searching in ${table}...`);
            const res = await pool.request().query(`SELECT * FROM ${table}`);
            res.recordset.forEach(row => {
                for (const key in row) {
                    if (typeof row[key] === 'number' && Math.abs(row[key] - target) < 0.05) {
                        console.log(`MATCH in ${table}: Col ${key} = ${row[key]}`);
                    }
                }
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
