const { sql, poolPromise } = require('./db');

async function checkFinal() {
    try {
        const pool = await poolPromise;
        const start = '2024-04-10';
        const end = '2026-04-10';

        console.log("Checking JOINED totals...");
        const res = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT 
                    SUM(od.TotalDetailLineAmount) as NetSales,
                    SUM(od.ManualDiscountAmount) as ManualDiscount,
                    SUM(p.TotalDiscountAmount) as PaymentDiscount,
                    SUM(p.RoundedBy) as JoinedRounding
                FROM vw_RestaurantOrderDetail od
                INNER JOIN vw_PaymentDetail p ON od.OrderId = p.OrderId
                WHERE CAST(p.OrderDateTime AS DATE) BETWEEN @start AND @end
            `);
        console.table(res.recordset);

        console.log("\nChecking Payment Totals directly...");
        const resPay = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT 
                    SUM(TotalAmountLessFreight) as PayNetSales,
                    SUM(TotalDiscountAmount) as PayDiscount
                FROM vw_PaymentDetail
                WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
            `);
        console.table(resPay.recordset);

        console.table(resPay.recordset);

        console.log("\nChecking Discount Distribution...");
        const resDist = await pool.request().query(`
            SELECT TOP 10 
                od.OrderId,
                od.BaseAmount,
                od.ManualDiscountAmount,
                od.TotalDetailLineAmount,
                p.TotalDiscountAmount,
                (od.BaseAmount - od.TotalDetailLineAmount) as ComputedDiscount
            FROM vw_RestaurantOrderDetail od
            INNER JOIN vw_PaymentDetail p ON od.OrderId = p.OrderId
            WHERE p.TotalDiscountAmount > 0
        `);
        console.table(resDist.recordset);

        console.log("\nChecking Quantity > 1 fields...");
        const resQty = await pool.request().query(`
            SELECT TOP 5 
                Quantity, 
                BaseAmount, 
                ActualAmount, 
                ManualDiscountAmount, 
                TotalDetailLineAmount 
            FROM vw_RestaurantOrderDetail 
            WHERE Quantity > 1
        `);
        console.table(resQty.recordset);

    } catch (err) {
        console.error(err);
    }


}

checkFinal();
