const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        const date = '2025-11-25';
        
        console.log(`Checking data for date: ${date}`);
        
        const resOrderDetail = await pool.request()
            .input('date', date)
            .query("SELECT SUM(TotalDetailLineAmount) as Total FROM RestaurantOrderDetail WHERE CAST(OrderDateTime AS DATE) = @date");
        console.log("RestaurantOrderDetail Total:", resOrderDetail.recordset[0].Total);

        const resSettlement = await pool.request()
            .input('date', date)
            .query("SELECT SUM(SubTotal) as SubTotal, SUM(RoundedBy) as RoundedBy, SUM(TotalTax) as TotalTax FROM SettlementHeader WHERE CAST(LastSettlementDate AS DATE) = @date AND IsCancelled = 0");
        console.log("SettlementHeader (Not Cancelled) SubTotal:", resSettlement.recordset[0].SubTotal);
        console.log("SettlementHeader (Not Cancelled) RoundedBy:", resSettlement.recordset[0].RoundedBy);

        const resSettlementAll = await pool.request()
            .input('date', date)
            .query("SELECT SUM(SubTotal) as SubTotal FROM SettlementHeader WHERE CAST(LastSettlementDate AS DATE) = @date");
        console.log("SettlementHeader (All) SubTotal:", resSettlementAll.recordset[0].SubTotal);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
