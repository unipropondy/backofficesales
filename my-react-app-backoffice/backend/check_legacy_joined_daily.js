const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log(`Checking joined query for all dates to find 9797.66...`);
        const res = await pool.request()
            .query(`
                SELECT CAST(pd.OrderDateTime AS DATE) as Date, SUM(od.TotalDetailLineAmount) as Total
                FROM vw_RestaurantOrderDetail od
                INNER JOIN vw_PaymentDetail pd ON od.OrderId = pd.OrderId
                GROUP BY CAST(pd.OrderDateTime AS DATE)
                ORDER BY Date DESC
            `);
        
        res.recordset.forEach(r => {
            console.log(`Date: ${r.Date.toISOString().split('T')[0]}, TotalDetailLineSum: ${r.Total}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
