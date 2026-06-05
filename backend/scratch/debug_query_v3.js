const { sql, poolPromise } = require("../db");

async function runQuery() {
    try {
        const pool = await poolPromise;
        const start = '2025-11-25';
        const end = '2025-11-25';
        
        console.log("Running optimized query...");
        
        const baseCte = `
            WITH AllMovements AS (
                SELECT PH.TranDate, PD.ItemID AS DishId, CONVERT(VARCHAR(100), PD.TranNo) AS TranNo,
                    CONVERT(DECIMAL(18,2), ISNULL(PD.Qty, 0)) AS PQty, 0 AS PRQty, 0 AS SQty, 0 AS SRQty, PH.Createdon
                FROM Purchasedetail PD INNER JOIN purchaseHeader PH ON PD.TranId = PH.Tranid WHERE PD.TranType = 'PURINV'
                UNION ALL
                SELECT CONVERT(DATE, pd.OrderDateTime), od.DishId, CONVERT(VARCHAR(100), pd.BillNumber),
                    0, 0, CONVERT(DECIMAL(18,2), ISNULL(od.Quantity, 0)), 0, pd.OrderDateTime
                FROM (SELECT OrderId, DishId, Quantity, Exflag FROM dbo.vw_RestaurantOrderDetail UNION ALL SELECT OrderId, DishId, Quantity, Exflag FROM dbo.vw_RestaurantOrderDetailCur) od
                INNER JOIN (SELECT OrderId, OrderDateTime, BillNumber FROM dbo.vw_PaymentDetail UNION ALL SELECT OrderId, OrderDateTime, BillNumber FROM dbo.vw_PaymentDetailCur) pd 
                ON CAST(od.OrderId AS VARCHAR(50)) = CAST(pd.OrderId AS VARCHAR(50)) WHERE od.Exflag = 'N'
            ),
            DishOpening AS (
                SELECT v_hist.DishId, SUM(v_hist.PQty - v_hist.PRQty - v_hist.SQty + v_hist.SRQty) AS OpeningBalance
                FROM AllMovements v_hist WHERE v_hist.TranDate < @start GROUP BY v_hist.DishId
            ),
            DishTransactions AS (
                SELECT DishId, TranDate, TranNo, PQty, PRQty, SQty, SRQty, Createdon
                FROM AllMovements WHERE TranDate BETWEEN @start AND @end
            )
            SELECT TOP 10 
                DM.Name, v.TranDate,
                ISNULL(o.OpeningBalance, 0) + ISNULL(SUM(v.PQty - v.PRQty - v.SQty + v.SRQty) OVER (PARTITION BY v.DishId ORDER BY v.TranDate, v.Createdon ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) as OpeningStock,
                v.SQty,
                ISNULL(o.OpeningBalance, 0) + ISNULL(SUM(v.PQty - v.PRQty - v.SQty + v.SRQty) OVER (PARTITION BY v.DishId ORDER BY v.TranDate, v.Createdon ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0) as ClosingStock
            FROM DishTransactions v
            LEFT JOIN DishOpening o ON v.DishId = o.DishId
            INNER JOIN DishMaster DM ON v.DishId = DM.DishId
        `;

        const result = await pool.request()
            .input('start', sql.DateTime, start)
            .input('end', sql.DateTime, end)
            .query(baseCte);
        
        console.log("Success! Rows:", result.recordset.length);
        process.exit(0);
    } catch (err) {
        console.error("SQL Error:", err.message);
        process.exit(1);
    }
}
runQuery();
