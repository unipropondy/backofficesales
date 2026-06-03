const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        const date = '2025-11-25';
        
        console.log(`Checking SettlementHeader for date: ${date}`);
        const res = await pool.request()
            .input('date', date)
            .query("SELECT * FROM SettlementHeader WHERE CAST(LastSettlementDate AS DATE) = @date");
        
        console.log("Found rows:", res.recordset.length);
        res.recordset.forEach(r => {
            console.log(`Row: SubTotal=${r.SubTotal}, RoundedBy=${r.RoundedBy}, TotalTax=${r.TotalTax}, Svc=${r.ServiceCharge}, Total=${r.SubTotal + r.RoundedBy + r.TotalTax + r.ServiceCharge}`);
        });

        console.log("Checking RestaurantOrderDetail for date: ${date}");
        const res2 = await pool.request()
            .input('date', date)
            .query("SELECT SUM(TotalDetailLineAmount) as Total FROM RestaurantOrderDetail WHERE CAST(OrderDateTime AS DATE) = @date");
        console.log("RestaurantOrderDetail Total:", res2.recordset[0].Total);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
