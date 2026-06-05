const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
 
// GET Dish Movement Data - GROUPED SUMMARY VERSION (Matches Legacy Business Day)
router.get("/", async (req, res) => {
    try {
        const { fromDate, toDate, category, dishGroup, dishName, active } = req.query;
        const pool = await poolPromise;
 
        const start = fromDate || new Date().toISOString().split('T')[0];
        const end = toDate || new Date().toISOString().split('T')[0];
 
        const categoryFilter = category ? `AND REPLACE(cm.CategoryName, ' ', '') LIKE '%' + REPLACE(@category, ' ', '') + '%'` : '';
        const dishGroupFilter = dishGroup ? `AND REPLACE(dgm.DishGroupName, ' ', '') LIKE '%' + REPLACE(@dishGroup, ' ', '') + '%'` : '';
        const dishNameFilter = dishName ? `AND REPLACE(dm.Name, ' ', '') LIKE '%' + REPLACE(@dishName, ' ', '') + '%'` : '';
        const activeFilter = (active === 'true' || active === true) ? `AND dm.IsActive = 1` : '';
 
        const query = `
            WITH AllMovements AS (
                -- PURCHASES
                SELECT
                    PH.Trandate as TranDate, PD.ItemID as DishId,
                    CONVERT(DECIMAL(18,2), ISNULL(PD.Qty, 0)) as PQty,
                    0 as PRQty, 0 as SQty, 0 as SRQty,
                    PH.Createdon
                FROM Purchasedetail PD
                INNER JOIN purchaseHeader PH ON PD.TranId = PH.Tranid
                WHERE PD.TranType = 'PURINV'
 
                UNION ALL
 
                -- PURCHASE RETURN
                SELECT
                    PH.Trandate as TranDate, PD.ItemID as DishId,
                    0, CONVERT(DECIMAL(18,2), ISNULL(PD.Qty, 0)), 0, 0,
                    PH.Createdon
                FROM Purchasedetail PD
                INNER JOIN purchaseHeader PH ON PD.TranId = PH.Tranid
                WHERE PD.TranType = 'PURRET'
 
                UNION ALL
 
                -- SALES
                SELECT
                    RI.InvoiceDate as TranDate, ROD.DishId,
                    0, 0, CONVERT(DECIMAL(18,2), ISNULL(ROD.Quantity, 0)), 0,
                    RI.Createdon
                FROM (
                    SELECT OrderId, DishId, Quantity, Exflag FROM dbo.RestaurantOrderDetail
                    UNION ALL
                    SELECT OrderId, DishId, Quantity, Exflag FROM dbo.RestaurantOrderDetailCur
                ) ROD
                INNER JOIN (
                    SELECT OrderId, InvoiceDate, Createdon, StatusCode, TotalAmount FROM dbo.RestaurantInvoice
                    UNION ALL
                    SELECT OrderId, InvoiceDate, Createdon, StatusCode, TotalAmount FROM dbo.RestaurantInvoiceCur
                ) RI ON CAST(ROD.OrderId AS VARCHAR(50)) = CAST(RI.OrderId AS VARCHAR(50))
                WHERE ROD.Exflag = 'N'
                AND RI.TotalAmount > 0
                AND RI.StatusCode = 5
 
                UNION ALL
 
                -- SALES RETURN
                SELECT
                    RI.InvoiceDate as TranDate, ROD.DishId,
                    0, 0, 0, CONVERT(DECIMAL(18,2), ISNULL(ROD.Quantity, 0)),
                    RI.Createdon
                FROM (
                    SELECT OrderId, DishId, Quantity, Exflag FROM dbo.RestaurantOrderDetail
                    UNION ALL
                    SELECT OrderId, DishId, Quantity, Exflag FROM dbo.RestaurantOrderDetailCur
                ) ROD
                INNER JOIN (
                    SELECT OrderId, InvoiceDate, Createdon, StatusCode FROM dbo.RestaurantInvoice
                    UNION ALL
                    SELECT OrderId, InvoiceDate, Createdon, StatusCode FROM dbo.RestaurantInvoiceCur
                ) RI ON CAST(ROD.OrderId AS VARCHAR(50)) = CAST(RI.OrderId AS VARCHAR(50))
                WHERE ROD.Exflag IN ('E', 'R')
                AND RI.StatusCode = 5
            ),
            FilteredDishes AS (
                SELECT dm.DishId, dm.Name, dm.DishCode, dgm.DishGroupName, cm.CategoryName, cm.CategoryId, dgm.DishGroupId
                FROM DishMaster dm
                INNER JOIN DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
                INNER JOIN CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
                WHERE 1=1
                ${categoryFilter}
                ${dishGroupFilter}
                ${dishNameFilter}
                ${activeFilter}
            ),
            DailyMovements AS (
                SELECT
                    DishId,
                    CAST(TranDate AS DATE) as GroupDate,
                    SUM(PQty) as PQty,
                    SUM(PRQty) as PRQty,
                    SUM(SQty) as SQty,
                    SUM(SRQty) as SRQty
                FROM AllMovements
                WHERE TranDate BETWEEN @start AND @end
                GROUP BY DishId, CAST(TranDate AS DATE)
            )
            SELECT
                fd.CategoryName as [Category Name],
                fd.DishGroupName as [DishGroup Name],
                fd.Name as [DishName],
                CONVERT(VARCHAR(10), dm.GroupDate, 103) as [TranDate],
                fd.CategoryId,
                fd.DishGroupId,
                fd.DishCode as Code,
                -- Start at 0 for the selected range to match legacy relative movement
                ISNULL(SUM(dm.PQty - dm.PRQty - dm.SQty + dm.SRQty) OVER (PARTITION BY dm.DishId ORDER BY dm.GroupDate ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) as [Opening Stock],
                dm.PQty,
                dm.PRQty,
                dm.SQty,
                dm.SRQty,
                ISNULL(SUM(dm.PQty - dm.PRQty - dm.SQty + dm.SRQty) OVER (PARTITION BY dm.DishId ORDER BY dm.GroupDate ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0) as [Closing Stock]
            FROM DailyMovements dm
            INNER JOIN FilteredDishes fd ON dm.DishId = fd.DishId
            ORDER BY fd.CategoryId, fd.DishGroupId, fd.DishId, dm.GroupDate
        `;
 
        const request = pool.request()
            .input('start', sql.DateTime, start)
            .input('end', sql.DateTime, end);
       
        if (category) request.input('category', sql.NVarChar, category);
        if (dishGroup) request.input('dishGroup', sql.NVarChar, dishGroup);
        if (dishName) request.input('dishName', sql.NVarChar, dishName);
 
        const result = await request.query(query);
        res.json({ success: true, data: result.recordset });
 
    } catch (err) {
        console.error("🔥 Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});
 
module.exports = router;
 