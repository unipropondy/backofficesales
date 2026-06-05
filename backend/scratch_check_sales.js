const { sql, poolPromise } = require('./db');

async function checkData() {
    try {
        const pool = await poolPromise;
        const start = '2025-11-20';
        const end = '2025-11-30';

        console.log("Checking vw_PaymentDetail sample...");
        const resPay = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT TOP 10 
                    OrderId, BillNumber, OrderDateTime, PayModeName, 
                    TotalAmountLessFreight, TotalTax, ServiceCharge, RoundedBy, TotalDiscountAmount
                FROM vw_PaymentDetail
                WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
                ORDER BY OrderDateTime
            `);
        console.table(resPay.recordset);

        console.log("\nChecking for duplicate OrderIds in vw_PaymentDetail...");
        const resDup = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT OrderId, COUNT(*) as PayCount
                FROM vw_PaymentDetail
                WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
                GROUP BY OrderId
                HAVING COUNT(*) > 1
            `);
        console.log("Orders with multiple payment rows:", resDup.recordset.length);

        console.log("\nCalculating totals carefully...");
        const resTotal = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT 
                    SUM(TotalAmountLessFreight) as SumTotalAmount,
                    SUM(TotalDiscountAmount) as SumDiscount
                FROM (
                    SELECT DISTINCT OrderId, TotalAmountLessFreight, TotalDiscountAmount
                    FROM vw_PaymentDetail
                    WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
                ) t
            `);
        console.table(resTotal.recordset);

        console.log("\nChecking TotalDetailLineAmount from vw_RestaurantOrderDetail...");
        const resDetailTotal = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT SUM(TotalDetailLineAmount) as TotalLineSum
                FROM vw_RestaurantOrderDetail
                WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
            `);
        console.table(resDetailTotal.recordset);

        console.log("\nChecking TotalDiscount from vw_RestaurantOrderDetail...");
        const resDiscountDetail = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT SUM(ManualDiscountAmount) as TotalManualDiscount
                FROM vw_RestaurantOrderDetail
                WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
            `);
        console.table(resDiscountDetail.recordset);

        console.log("\nChecking Joined Sum (od.TotalDetailLineAmount INNER JOIN p.vw_PaymentDetail)...");
        const resJoinedSum = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT 
                    SUM(od.TotalDetailLineAmount) as JoinedSum,
                    SUM(od.ManualDiscountAmount) as JoinedDiscount
                FROM vw_RestaurantOrderDetail od
                INNER JOIN vw_PaymentDetail p ON od.OrderId = p.OrderId
                WHERE CAST(p.OrderDateTime AS DATE) BETWEEN @start AND @end
            `);
        console.table(resJoinedSum.recordset);

        console.log("\nChecking TotalDiscountAmount from vw_PaymentDetail...");
        const resDiscountSum = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT SUM(TotalDiscountAmount) as DiscountSum
                FROM vw_PaymentDetail
                WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
            `);
        console.table(resDiscountSum.recordset);

        console.log("\nInspecting columns of vw_PaymentDetail...");
        const resCols = await pool.request().query("SELECT TOP 1 * FROM vw_PaymentDetail");
        console.log("Columns:", Object.keys(resCols.recordset[0]));

        console.log("\nChecking Nov 22, 2025 data specifically...");
        const resNov22 = await pool.request().query(`
            SELECT 
                OrderId, BillNumber, TotalAmountLessFreight, TotalDiscountAmount, 
                DiscountAmount, TotalLineItemDiscountAmount, TotalTax, ServiceCharge, RoundedBy
            FROM vw_PaymentDetail 
            WHERE CAST(OrderDateTime AS DATE) = '2025-11-22'
        `);
        console.table(resNov22.recordset);

        console.log("\nChecking Nov 22, 2025 Line Items...");
        const resNov22Line = await pool.request().query(`
            SELECT SUM(TotalDetailLineAmount) as LineSum
            FROM vw_RestaurantOrderDetail
            WHERE CAST(OrderDateTime AS DATE) = '2025-11-22'
        `);
        console.table(resNov22Line.recordset);

        console.log("\nChecking various Discount fields from vw_PaymentDetail...");
        const resDiscounts = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT 
                    SUM(TotalDiscountAmount) as SumTotalDiscount,
                    SUM(DiscountAmount) as SumDiscount,
                    SUM(TotalLineItemDiscountAmount) as SumLineItemDiscount
                FROM vw_PaymentDetail
                WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
            `);
        console.table(resDiscounts.recordset);

        console.log("\nInspecting columns of vw_RestaurantOrderDetail...");
        const resDetailCols = await pool.request().query("SELECT TOP 1 * FROM vw_RestaurantOrderDetail");
        console.log("Columns:", Object.keys(resDetailCols.recordset[0]));

    } catch (err) {
        console.error(err);
    }
}

checkData();
