const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT TOP 5 * FROM RestaurantOrderDetail");
        console.log("COLUMNS:", Object.keys(result.recordset[0]));
        console.log("SAMPLE DATA:", result.recordset[0]);
        
        const settlement = await pool.request().query("SELECT TOP 1 * FROM SettlementHeader");
        if (settlement.recordset.length > 0) {
            console.log("SETTLEMENT COLUMNS:", Object.keys(settlement.recordset[0]));
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
