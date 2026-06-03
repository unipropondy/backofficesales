const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        const date = '2025-11-25';
        
        console.log(`Checking SUM(TotalDetailLineAmount) from Joined Query for date: ${date}`);
        const res = await pool.request()
            .input('date', date)
            .query(`
                SELECT 
                    SUM(od.TotalDetailLineAmount) as TotalDetailSum
                FROM vw_RestaurantOrderDetail od
                INNER JOIN vw_PaymentDetail pd ON od.OrderId = pd.OrderId
                WHERE CAST(pd.OrderDateTime AS DATE) = @date
            `);
        console.log("TotalDetailLineAmount Sum:", res.recordset[0].TotalDetailSum);

        console.log(`\nChecking SUM(DISTINCT TotalAmountLessFreight) - just to see...`);
        const res2 = await pool.request()
            .input('date', date)
            .query(`
                SELECT 
                    SUM(DISTINCT pd.TotalAmountLessFreight) as DistinctNet
                FROM vw_RestaurantOrderDetail od
                INNER JOIN vw_PaymentDetail pd ON od.OrderId = pd.OrderId
                WHERE CAST(pd.OrderDateTime AS DATE) = @date
            `);
        console.log("Distinct Net Sales Sum:", res2.recordset[0].DistinctNet);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
