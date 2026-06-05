const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        const date = '2025-11-25';
        
        console.log(`Checking vw_PaymentDetail for date: ${date}`);
        const resPayment = await pool.request()
            .input('date', date)
            .query(`
                SELECT 
                    SUM(TotalAmountLessFreight) as NetSales,
                    SUM(TotalTax) as TotalTax,
                    SUM(ServiceCharge) as ServiceCharge,
                    SUM(RoundedBy) as Rounding,
                    SUM(TotalDiscountAmount) as Discount
                FROM vw_PaymentDetail
                WHERE CAST(OrderDateTime AS DATE) = @date
            `);
        console.log("vw_PaymentDetail Totals:", resPayment.recordset[0]);

        console.log(`\nChecking Joined Summary for date: ${date}`);
        const resSummary = await pool.request()
            .input('date', date)
            .query(`
                SELECT 
                    SUM(pd.TotalAmountLessFreight) as NetSales,
                    SUM(pd.TotalTax) as TotalTax,
                    SUM(pd.ServiceCharge) as ServiceCharge,
                    SUM(pd.RoundedBy) as Rounding
                FROM vw_RestaurantOrderDetail od
                INNER JOIN vw_PaymentDetail pd ON od.OrderId = pd.OrderId
                WHERE CAST(pd.OrderDateTime AS DATE) = @date
            `);
        console.log("Joined Summary Totals (This might be inflated due to joins):", resSummary.recordset[0]);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
