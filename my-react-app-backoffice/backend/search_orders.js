const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log(`Searching for 9797.66 in RestaurantOrder...`);
        const res = await pool.request()
            .query("SELECT * FROM RestaurantOrder WHERE NetAmount BETWEEN 9797.65 AND 9797.67");
        console.log("RestaurantOrder Matches:", res.recordset.length);

        console.log(`Searching for 13674.32 in RestaurantOrder...`);
        const res2 = await pool.request()
            .query("SELECT * FROM RestaurantOrder WHERE NetAmount BETWEEN 13674.31 AND 13674.33");
        console.log("RestaurantOrder Matches:", res2.recordset.length);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
