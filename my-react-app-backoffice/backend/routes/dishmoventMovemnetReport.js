const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// GET Dish Movement Report Data
router.get("/", async (req, res) => {
    try {
        const { type, fromDate, toDate, category, dishGroup, dishName, active } = req.query;
        const pool = await poolPromise;

        const start = fromDate || new Date().toISOString().split('T')[0];
        const end = toDate || new Date().toISOString().split('T')[0];

        console.log(`📦 Dish Movement Report - Type: ${type}, From: ${start}, To: ${end}`);
        console.log(`   Filters - Category: "${category}", DishGroup: "${dishGroup}", DishName: "${dishName}", Active: "${active}"`);

        const categoryFilter = category ? `AND REPLACE(v.CategoryName, ' ', '') LIKE '%' + REPLACE(@category, ' ', '') + '%'` : '';
        const dishGroupFilter = dishGroup ? `AND REPLACE(v.DishGroupName, ' ', '') LIKE '%' + REPLACE(@dishGroup, ' ', '') + '%'` : '';
        const dishNameFilter = dishName ? `AND REPLACE(v.Name, ' ', '') LIKE '%' + REPLACE(@dishName, ' ', '') + '%'` : '';
        const activeFilter = (active === 'true' || active === true) ? `AND dm.IsActive = 1` : '';

        const addFilters = (req) => {
            if (category) req = req.input('category', sql.NVarChar, category);
            if (dishGroup) req = req.input('dishGroup', sql.NVarChar, dishGroup);
            if (dishName) req = req.input('dishName', sql.NVarChar, dishName);
            return req;
        };

        // Optional filters - allow "All" selection
        /*
        if (!category || !dishGroup || !dishName) {
            console.log("⚠️ Dish Movement Report: Missing mandatory filters. Returning empty dataset.");
            return res.json({
                success: true,
                type: type || 'detail',
                data: [],
                count: 0,
                fromDate: start,
                toDate: end,
                message: "Please select Category, Dishgroup, and DishName"
            });
        }
        */

        // Common CTE for Dish Movement data
        const baseCte = `
            WITH AllMovements(TranDate, DishId, TranNo, PQty, PRQty, SQty, SRQty, Createdon) AS (
                -- PURCHASES
                SELECT 
                    PH.Trandate, PD.ItemID as DishId, PH.TranNo,
                    CONVERT(DECIMAL(18,2), ISNULL(PD.Qty, 0)), 0, 0, 0,
                    PH.Createdon
                FROM Purchasedetail PD
                INNER JOIN PurchaseHeader PH ON PD.TranId = PH.TranId
                WHERE PD.TranType = 'PURINV'

                UNION ALL

                -- PURCHASE RETURN
                SELECT 
                    PH.Trandate, PD.ItemID as DishId, PH.TranNo,
                    0, CONVERT(DECIMAL(18,2), ISNULL(PD.Qty, 0)), 0, 0,
                    PH.Createdon
                FROM Purchasedetail PD
                INNER JOIN PurchaseHeader PH ON PD.TranId = PH.TranId
                WHERE PD.TranType = 'PURRET'

                UNION ALL

                -- SALES
                SELECT 
                    RI.InvoiceDate, ROD.DishId, RI.BillNumber,
                    0, 0, CONVERT(DECIMAL(18,2), ISNULL(ROD.Quantity, 0)), 0,
                    RI.Createdon
                FROM (
                    SELECT OrderId, DishId, Quantity, Exflag FROM dbo.RestaurantOrderDetail
                    UNION ALL
                    SELECT OrderId, DishId, Quantity, Exflag FROM dbo.RestaurantOrderDetailCur
                ) ROD
                INNER JOIN (
                    SELECT OrderId, InvoiceDate, BillNumber, Createdon, StatusCode, TotalAmount FROM dbo.RestaurantInvoice
                    UNION ALL
                    SELECT OrderId, InvoiceDate, BillNumber, Createdon, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur
                ) RI ON CAST(ROD.OrderId AS VARCHAR(50)) = CAST(RI.OrderId AS VARCHAR(50))
                WHERE ROD.Exflag = 'N'
                AND RI.TotalAmount > 0
                AND RI.StatusCode = (SELECT PickListNumber FROM picklistmaster WHERE Tablename ='RestaurantOrder' AND FieldName='StatusCode' AND picklistvalue='Paid')

                UNION ALL

                -- SALES RETURN
                SELECT 
                    RI.InvoiceDate, ROD.DishId, RI.BillNumber,
                    0, 0, 0, CONVERT(DECIMAL(18,2), ISNULL(ROD.Quantity, 0)),
                    RI.Createdon
                FROM (
                    SELECT OrderId, DishId, Quantity, Exflag FROM dbo.RestaurantOrderDetail
                    UNION ALL
                    SELECT OrderId, DishId, Quantity, Exflag FROM dbo.RestaurantOrderDetailCur
                ) ROD
                INNER JOIN (
                    SELECT OrderId, InvoiceDate, BillNumber, Createdon, StatusCode, TotalAmount FROM dbo.RestaurantInvoice
                    UNION ALL
                    SELECT OrderId, InvoiceDate, BillNumber, Createdon, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur
                ) RI ON CAST(ROD.OrderId AS VARCHAR(50)) = CAST(RI.OrderId AS VARCHAR(50))
                WHERE ROD.Exflag IN ('E', 'R')
                AND RI.StatusCode = (SELECT PickListNumber FROM picklistmaster WHERE Tablename ='RestaurantOrder' AND FieldName='StatusCode' AND picklistvalue='Paid')

                UNION ALL

                -- STOCK LOCK
                SELECT 
                    CONVERT(DATE, SL.stockdate + 1), SL.DishID, 'STOCKLOCK',
                    0, 0, 0, 0,
                    SL.stockdate
                FROM stocklock SL
            ),
            DishTransactions AS (
                -- Transactions in range for filtered dishes
                SELECT 
                    v.DishId, v.TranDate, v.TranNo, v.PQty, v.PRQty, v.SQty, v.SRQty, v.Createdon
                FROM AllMovements v
                WHERE v.TranDate BETWEEN @start AND @end
                AND v.DishId IN (
                    SELECT dm.DishId 
                    FROM DishMaster dm
                    INNER JOIN DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
                    INNER JOIN CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
                    WHERE 1=1
                    ${categoryFilter.replace(/v\./g, 'cm.')}
                    ${dishGroupFilter.replace(/v\./g, 'dgm.')}
                    ${dishNameFilter.replace(/v\./g, 'dm.')}
                    ${activeFilter}
                )
            )
        `;

        if (type === "detail") {
            // DETAIL QUERY (Transactional with Running Balance)
            const detailQuery = `
                ${baseCte}
                SELECT 
                    ISNULL(SUM(v.PQty - v.PRQty - v.SQty + v.SRQty) OVER (PARTITION BY v.DishId ORDER BY v.TranDate, v.Createdon ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS OpeningStock,
                    DGM.DishGroupName,
                    CM.CategoryName,
                    v.TranDate,
                    CM.CategoryId,
                    DGM.DishGroupId,
                    DM.DishCode AS Code,
                    v.TranNo,
                    DM.Name,
                    v.PQty,
                    v.PRQty,
                    v.SQty,
                    v.SRQty,
                    ISNULL(SUM(v.PQty - v.PRQty - v.SQty + v.SRQty) OVER (PARTITION BY v.DishId ORDER BY v.TranDate, v.Createdon ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0) AS ClosingStock
                FROM DishTransactions v
                INNER JOIN DishMaster DM ON v.DishId = DM.DishId
                INNER JOIN DishGroupMaster DGM ON DM.DishGroupId = DGM.DishGroupId
                INNER JOIN CategoryMaster CM ON DGM.CategoryId = CM.CategoryId
                WHERE (v.PQty <> 0 OR v.PRQty <> 0 OR v.SQty <> 0 OR v.SRQty <> 0)
                ORDER BY CM.CategoryId, DGM.DishGroupId, v.DishId, v.TranDate, v.Createdon
            `;

            let request = pool.request()
                .input('start', sql.DateTime, start)
                .input('end', sql.DateTime, end);
            request = addFilters(request);

            console.log("Executing Dish Movement Detail Query (Joining DishMaster)...");
            const result = await request.query(detailQuery);

            return res.json({
                success: true,
                type: 'detail',
                data: result.recordset,
                count: result.recordset.length,
                fromDate: start,
                toDate: end
            });

        } else {
            // SUMMARY QUERY (Aggregated per Dish)
            const summaryQuery = `
                ${baseCte}
                SELECT 
                    DM.Name,
                    SUM(v.PQty) AS PQty,
                    SUM(v.PRQty) AS PRQty,
                    SUM(v.SQty) AS SQty,
                    SUM(v.SRQty) AS SRQty,
                    DM.DishCode AS Code,
                    CM.CategoryName,
                    DGM.DishGroupName,
                    CM.CategoryId,
                    DGM.DishGroupId,
                    v.DishId AS ID,
                    0 AS OpeningStock,
                    SUM(v.PQty) - SUM(v.PRQty) - SUM(v.SQty) + SUM(v.SRQty) AS ClosingStock,
                    MIN(v.TranDate) AS TranDate
                FROM DishTransactions v
                INNER JOIN DishMaster DM ON v.DishId = DM.DishId
                INNER JOIN DishGroupMaster DGM ON DM.DishGroupId = DGM.DishGroupId
                INNER JOIN CategoryMaster CM ON DGM.CategoryId = CM.CategoryId
                WHERE (v.PQty <> 0 OR v.PRQty <> 0 OR v.SQty <> 0 OR v.SRQty <> 0)
                GROUP BY DM.Name, DM.DishCode, CM.CategoryName, DGM.DishGroupName, CM.CategoryId, DGM.DishGroupId, v.DishId
                ORDER BY CM.CategoryId, DGM.DishGroupId, v.DishId
            `;

            let request = pool.request()
                .input('start', sql.DateTime, start)
                .input('end', sql.DateTime, end);
            request = addFilters(request);

            console.log("Executing Dish Movement Summary Query (Aggregated)...");
            const result = await request.query(summaryQuery);

            return res.json({
                success: true,
                type: 'summary',
                data: result.recordset,
                count: result.recordset.length,
                fromDate: start,
                toDate: end
            });
        }

    } catch (err) {
        console.error("🔥 Dish Movement Report Error:", err.message);
        const fs = require('fs');
        fs.appendFileSync('error_log.txt', `\n[${new Date().toISOString()}] Dish Movement ERROR: ${err.message}\n`);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

module.exports = router;