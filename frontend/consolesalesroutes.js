const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// COMMON QUERIES FOR SUMMARY + DETAIL
const vwOrderDetailUnion = `
    SELECT
        OrderId,
        DishId,
        Quantity,
        BaseAmount,
        ManualDiscountAmount,
        TotalDetailLineAmount,
        OrderDateTime
    FROM dbo.vw_RestaurantOrderDetail
    UNION ALL
    SELECT
        OrderId,
        DishId,
        Quantity,
        BaseAmount,
        ManualDiscountAmount,
        TotalDetailLineAmount,
        OrderDateTime
    FROM dbo.vw_RestaurantOrderDetailCur
`;

const vwPaymentDetailUnion = `
    SELECT
        OrderId,
        OrderDateTime,
        RoundedBy,
        TotalDiscountAmount,
        TotalAmountLessFreight,
        BillNumber,
        PayModeName
    FROM dbo.vw_PaymentDetail
    UNION ALL
    SELECT
        OrderId,
        OrderDateTime,
        RoundedBy,
        TotalDiscountAmount,
        TotalAmountLessFreight,
        BillNumber,
        PayModeName
    FROM dbo.vw_PaymentDetailCur
`;

const vwRestaurantOrderUnion = `
    SELECT OrderId, OrderDateTime FROM dbo.vw_RestaurantOrder
    UNION ALL
    SELECT OrderId, OrderDateTime FROM dbo.vw_RestaurantOrderCur
`;

// ✅ FUNCTION ADDED HERE - Global Scope
function processPaymodeBreakdown(recordset) {
    const paymodeBreakdown = {
        CASH: { amount: 0, count: 0 },
        NETS: { amount: 0, count: 0 },
        PAYNOW: { amount: 0, count: 0 },
        UPI: { amount: 0, count: 0 },
        MEMBER: { amount: 0, count: 0 },
        CREDIT: { amount: 0, count: 0 },
        YEAHPAY_PAYNOW: { amount: 0, count: 0 },
        YEAHPAY_CARD: { amount: 0, count: 0 },
        UNKNOWN: { amount: 0, count: 0 },
        OTHERS: { amount: 0, count: 0 }
    };

    recordset.forEach(row => {
        const rawMode = (row.PayModeName || '').trim();
        const mode = rawMode.toUpperCase();
        const count = row.TransactionCount || row.count || 0;
        const amount = row.TotalAmount || row.amount || 0;

        if (mode === 'CASH') {
            paymodeBreakdown.CASH.amount += amount;
            paymodeBreakdown.CASH.count += count;
        } else if (mode === 'NETS') {
            paymodeBreakdown.NETS.amount += amount;
            paymodeBreakdown.NETS.count += count;
        } else if (mode === 'PAYNOW') {
            paymodeBreakdown.PAYNOW.amount += amount;
            paymodeBreakdown.PAYNOW.count += count;
        } else if (mode === 'UPI' || mode === 'UPI/GPAY') {
            paymodeBreakdown.UPI.amount += amount;
            paymodeBreakdown.UPI.count += count;
        } else if (mode === 'MEMBER') {
            paymodeBreakdown.MEMBER.amount += amount;
            paymodeBreakdown.MEMBER.count += count;
        } else if (mode === 'CREDIT') {
            paymodeBreakdown.CREDIT.amount += amount;
            paymodeBreakdown.CREDIT.count += count;
        } else if (mode === 'YEAHPAY PAYNOW' || mode === 'YEAHPAYPAYNOW') {
            paymodeBreakdown.YEAHPAY_PAYNOW.amount += amount;
            paymodeBreakdown.YEAHPAY_PAYNOW.count += count;
        } else if (mode === 'YEAHPAY CARD' || mode === 'YEAHPAYCARD') {
            paymodeBreakdown.YEAHPAY_CARD.amount += amount;
            paymodeBreakdown.YEAHPAY_CARD.count += count;
        } else if (mode === 'UNKNOWN' || mode === '') {
            paymodeBreakdown.UNKNOWN.amount += amount;
            paymodeBreakdown.UNKNOWN.count += count;
        } else {
            paymodeBreakdown.OTHERS.amount += amount;
            paymodeBreakdown.OTHERS.count += count;
        }
    });

    const preserveKeys = ['CASH', 'NETS', 'PAYNOW', 'UPI', 'MEMBER', 'CREDIT', 'YEAHPAY_PAYNOW', 'YEAHPAY_CARD', 'UNKNOWN', 'OTHERS'];
    Object.keys(paymodeBreakdown).forEach(key => {
        if (!preserveKeys.includes(key) && paymodeBreakdown[key].amount === 0 && paymodeBreakdown[key].count === 0) {
            delete paymodeBreakdown[key];
        }
    });

    return paymodeBreakdown;
}

// GET Console Sales Report Data
router.get("/", async (req, res) => {
    try {
        const { type, fromDate, toDate } = req.query;
        const pool = await poolPromise;

        // Default to today if dates are missing
        const start = fromDate || new Date().toISOString().split('T')[0];
        const end = toDate || new Date().toISOString().split('T')[0];

        console.log(`📊 Report Request - Type: ${type}, From: ${start}, To: ${end}`);

        const categorySalesQuery = `
            SELECT 
                dg.DishGroupName as CategoryName,
                SUM(od.TotalDetailLineAmount) as TotalSales,
                SUM(od.Quantity) as TotalQuantity
            FROM (
                ${vwOrderDetailUnion}
            ) od
            INNER JOIN DishMaster dm ON od.DishId = dm.DishId 
            INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId 
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
                  AND dg.DishGroupName NOT LIKE '%DEMO%'
                  AND dm.Name NOT LIKE '%DEMO%'
            GROUP BY dg.DishGroupName
            ORDER BY TotalSales DESC;
        `;

        const departmentSalesQuery = `
            SELECT 
                dg.DishGroupName as DepartmentName,
                SUM(od.TotalDetailLineAmount) as TotalSales,
                SUM(od.Quantity) as TotalQuantity
            FROM (
                ${vwOrderDetailUnion}
            ) od
            INNER JOIN DishMaster dm ON od.DishId = dm.DishId
            INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
                  AND dg.DishGroupName NOT LIKE '%DEMO%'
                  AND dm.Name NOT LIKE '%DEMO%'
            GROUP BY dg.DishGroupName
            ORDER BY TotalSales DESC
        `;

        const topItemsQuery = `
            SELECT TOP 10
                dm.DishCode,
                dm.Name as ItemName,
                dg.DishGroupName as Category,
                SUM(od.Quantity) as TotalQuantity,
                SUM(od.TotalDetailLineAmount) as TotalSales
            FROM (
                ${vwOrderDetailUnion}
            ) od
            INNER JOIN DishMaster dm ON od.DishId = dm.DishId
            INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
                  AND dg.DishGroupName NOT LIKE '%DEMO%'
                  AND dm.Name NOT LIKE '%DEMO%'
            GROUP BY dm.DishCode, dm.Name, dg.DishGroupName
            ORDER BY TotalSales DESC
        `;

        const slowItemsQuery = `
            SELECT TOP 10
                dm.DishCode,
                dm.Name as ItemName,
                dg.DishGroupName as Category,
                SUM(od.Quantity) as TotalQuantity,
                SUM(od.TotalDetailLineAmount) as TotalSales
            FROM (
                ${vwOrderDetailUnion}
            ) od
            INNER JOIN DishMaster dm ON od.DishId = dm.DishId
            INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
                  AND dg.DishGroupName NOT LIKE '%DEMO%'   -- ✅ ADDED
                  AND dm.Name NOT LIKE '%DEMO%'            -- ✅ ADDED
            GROUP BY dm.DishCode, dm.Name, dg.DishGroupName
            ORDER BY TotalSales ASC
        `;

        const slowCategoryQuery = `
            SELECT TOP 10
                dg.DishGroupName as CategoryName,
                SUM(od.TotalDetailLineAmount) as TotalSales,
                SUM(od.Quantity) as TotalQuantity
            FROM (
                ${vwOrderDetailUnion}
            ) od
            INNER JOIN DishMaster dm ON od.DishId = dm.DishId
            INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId
            WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
                  AND dg.DishGroupName NOT LIKE '%DEMO%'   -- ✅ ADDED
                  AND dm.Name NOT LIKE '%DEMO%'            -- ✅ ADDED
            GROUP BY dg.DishGroupName
            ORDER BY TotalSales ASC
        `;

        if (type === "detail") {
            // DETAILED REPORT QUERY
            const detailQuery = `
                SELECT
                    dm.DishGroupId,
                    dg.DishGroupName as DishGroupIdName,
                    dm.DishCode,
                    dm.Name as DishName,
                    od.Quantity,
                    od.ManualDiscountAmount,
                    od.BaseAmount,
                    od.TotalDetailLineAmount,
                    pd.BillNumber,
                    pd.PayModeName
                FROM (
                    ${vwRestaurantOrderUnion}
                ) ro
                INNER JOIN (
                    ${vwOrderDetailUnion}
                ) od ON ro.OrderId = od.OrderId
                INNER JOIN (
                    ${vwPaymentDetailUnion}
                ) pd ON ro.OrderId = pd.OrderId
                INNER JOIN dbo.DishMaster dm ON od.DishId = dm.DishId
                LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
                WHERE CAST(ro.OrderDateTime AS DATE) BETWEEN @start AND @end
                      AND dg.DishGroupName NOT LIKE '%DEMO%'
                      AND dm.Name NOT LIKE '%DEMO%'
                ORDER BY dm.DishGroupId
            `;

            console.log("Executing Legacy Detail Query...");
            const result = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(detailQuery);

            // Get Paymode Breakdown
            const summaryPaymodeQuery = `
                SELECT 
                    pd.PayModeName,
                    COUNT(DISTINCT BillNumber) as TransactionCount,
                    SUM(TotalAmountLessFreight) as TotalAmount
                FROM (
                    ${vwPaymentDetailUnion}
                ) pd
                WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end
                GROUP BY PayModeName
            `;
            const paymodeResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(summaryPaymodeQuery);
            console.log(paymodeResult.recordset);

            // Get Sales by Category (DishGroup) - detail variant
            const categorySalesQueryDetail = `
                SELECT 
                    dg.DishGroupName as CategoryName,
                    SUM(od.TotalDetailLineAmount) as TotalSales,
                    SUM(od.Quantity) as TotalQuantity
                FROM (
                    ${vwOrderDetailUnion}
                ) od
                INNER JOIN DishMaster dm ON od.DishId = dm.DishId 
                INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId 
                INNER JOIN (
                    SELECT DISTINCT OrderId FROM (
                        SELECT OrderId FROM dbo.vw_PaymentDetail
                        UNION ALL
                        SELECT OrderId FROM dbo.vw_PaymentDetailCur
                    ) p
                ) p ON od.OrderId = p.OrderId
                WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
                      AND dg.DishGroupName NOT LIKE '%DEMO%'
                      AND dm.Name NOT LIKE '%DEMO%'
                GROUP BY dg.DishGroupName
                ORDER BY TotalSales DESC
            `;
            const categoryResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(categorySalesQueryDetail);

            // Get Sales by Department (using DishGroup as department)
            const departmentSalesQueryDetail = `
                SELECT 
                    dg.DishGroupName as CategoryName,
                    SUM(od.TotalDetailLineAmount) as TotalSales,
                    SUM(od.Quantity) as TotalQuantity
                FROM (
                    ${vwOrderDetailUnion}
                ) od
                INNER JOIN DishMaster dm ON od.DishId = dm.DishId 
                INNER JOIN Dishgroupmaster dg ON dg.DishGroupId = dm.DishGroupId 
                INNER JOIN (
                    SELECT DISTINCT OrderId FROM (
                        SELECT OrderId FROM dbo.vw_PaymentDetail
                        UNION ALL
                        SELECT OrderId FROM dbo.vw_PaymentDetailCur
                    ) p
                ) p ON od.OrderId = p.OrderId
                WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
                      AND dg.DishGroupName NOT LIKE '%DEMO%'
                      AND dm.Name NOT LIKE '%DEMO%'
                GROUP BY dg.DishGroupName
                ORDER BY TotalSales DESC
            `;
            const departmentResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(departmentSalesQueryDetail);

            // Get Top Selling Items (detail variant)
            const topItemsQueryDetail = `
                SELECT TOP 10
                    dm.DishCode,
                    dm.Name as ItemName,
                    dg.DishGroupName as Category,
                    SUM(od.Quantity) as TotalQuantity,
                    SUM(od.TotalDetailLineAmount) as TotalSales
                FROM (
                    ${vwOrderDetailUnion}
                ) od
                INNER JOIN dbo.DishMaster dm ON od.DishId = dm.DishId
                LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
                INNER JOIN (
                    SELECT DISTINCT OrderId FROM (
                        SELECT OrderId FROM dbo.vw_PaymentDetail
                        UNION ALL
                        SELECT OrderId FROM dbo.vw_PaymentDetailCur
                    ) p
                ) p ON od.OrderId = p.OrderId
                WHERE CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
                      AND dg.DishGroupName NOT LIKE '%DEMO%'
                      AND dm.Name NOT LIKE '%DEMO%'
                GROUP BY dm.DishCode, dm.Name, dg.DishGroupName
                ORDER BY TotalSales DESC
            `;
            const topItemsResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(topItemsQueryDetail);

            // Get Slow Moving Items (least sold) - detail variant
            const slowItemsQueryDetail = `
                SELECT TOP 10
                    dm.DishCode,
                    dm.Name as ItemName,
                    dg.DishGroupName as Category,
                    ISNULL(SUM(od.Quantity), 0) as TotalQuantity,
                    ISNULL(SUM(od.TotalDetailLineAmount), 0) as TotalSales
                FROM dbo.DishMaster dm
                LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
                LEFT JOIN (
                    ${vwOrderDetailUnion}
                ) od ON dm.DishId = od.DishId 
                    AND CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
                LEFT JOIN (
                    SELECT DISTINCT OrderId FROM (
                        SELECT OrderId FROM dbo.vw_PaymentDetail
                        UNION ALL
                        SELECT OrderId FROM dbo.vw_PaymentDetailCur
                    ) p
                ) p ON od.OrderId = p.OrderId
                WHERE dm.IsActive = 1
                  AND dg.DishGroupName NOT LIKE '%DEMO%'
                  AND dm.Name NOT LIKE '%DEMO%'
                GROUP BY dm.DishCode, dm.Name, dg.DishGroupName
                HAVING ISNULL(SUM(od.Quantity), 0) > 0
                ORDER BY TotalSales ASC
            `;
            const slowItemsResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(slowItemsQueryDetail);

            // Get Slow Moving Category - detail variant
            const slowCategoryQueryDetail = `
                SELECT 
                    dg.DishGroupName as CategoryName,
                    ISNULL(SUM(od.TotalDetailLineAmount), 0) as TotalSales,
                    ISNULL(SUM(od.Quantity), 0) as TotalQuantity
                FROM dbo.DishMaster dm
                LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
                LEFT JOIN (
                    ${vwOrderDetailUnion}
                ) od ON dm.DishId = od.DishId 
                    AND CAST(od.OrderDateTime AS DATE) BETWEEN @start AND @end
                LEFT JOIN (
                    SELECT DISTINCT OrderId FROM (
                        SELECT OrderId FROM dbo.vw_PaymentDetail
                        UNION ALL
                        SELECT OrderId FROM dbo.vw_PaymentDetailCur
                    ) p
                ) p ON od.OrderId = p.OrderId
                WHERE dg.DishGroupName NOT LIKE '%DEMO%'
                  AND dm.Name NOT LIKE '%DEMO%'
                GROUP BY dg.DishGroupName
                ORDER BY TotalSales ASC
            `;
            const slowCategoryResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(slowCategoryQueryDetail);

            // Meta Query for Total Transactions
            const summaryMetaQuery = `
                SELECT
                    COUNT(DISTINCT pd.BillNumber) as TotalReceipts,
                    ISNULL(SUM(pd.TotalAmountLessFreight), 0) as TotalNetSales
                FROM (
                    ${vwPaymentDetailUnion}
                ) pd
                WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end
            `;

            const metaResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(summaryMetaQuery);

            const totalReceipts = metaResult.recordset[0]?.TotalReceipts || 0;
            const totalNetSales = metaResult.recordset[0]?.TotalNetSales || 0;
            const averageReceipt = totalReceipts > 0 ? (totalNetSales / totalReceipts).toFixed(2) : "0.00";

            // ✅ Process Paymode data - USING FUNCTION
            const paymodeBreakdown = processPaymodeBreakdown(paymodeResult.recordset);

            console.log(`✅ Legacy Detail Query returned ${result.recordset.length} rows`);

            return res.json({
                success: true,
                type: 'detail',
                data: result.recordset,
                totalReceipts,
                averageReceipt,
                paymodeBreakdown,
                salesByCategory: categoryResult.recordset,
                salesByDepartment: departmentResult.recordset,
                topSellingItems: topItemsResult.recordset,
                slowMovingItems: slowItemsResult.recordset,
                slowMovingCategory: slowCategoryResult.recordset,
                count: result.recordset.length,
                fromDate: start,
                toDate: end
            });

        } else {

            // SUMMARY REPORT QUERY
            const summaryQuery = `
                SELECT
                    ISNULL(SUM(vrod.TotalDetailLineAmount), 0) as NetSales,
                    MAX(CAST(dg.DishGroupName AS VARCHAR(50))) as DishGroupName,
                    0 as ServiceCharge,
                    0 as TaxCollected,
                    ISNULL(SUM(vpd.RoundedBy), 0) as Rounding,
                    ISNULL(SUM(vpd.TotalDiscountAmount), 0) as TotalDiscount,
                    ISNULL(SUM(vrod.TotalDetailLineAmount), 0) + ISNULL(SUM(vpd.RoundedBy), 0) as TotalRevenue
                FROM (
                    ${vwPaymentDetailUnion}
                ) vpd
                INNER JOIN (
                    ${vwOrderDetailUnion}
                ) vrod ON vpd.OrderId = vrod.OrderId
                INNER JOIN dbo.DishMaster dm ON vrod.DishId = dm.DishId
                LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
                WHERE CAST(vpd.OrderDateTime AS DATE) BETWEEN @start AND @end
                      AND dg.DishGroupName NOT LIKE '%DEMO%'
                      AND dm.Name NOT LIKE '%DEMO%'
            `;

            console.log("Executing Legacy Summary Query...");
            const result = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(summaryQuery);

            const paymodeQuery = `
                SELECT 
                    pd.PayModeName,
                    COUNT(DISTINCT pd.BillNumber) as TransactionCount,
                    SUM(pd.TotalAmountLessFreight) as TotalAmount
                FROM (
                    ${vwPaymentDetailUnion}
                ) pd
                WHERE CAST(pd.OrderDateTime AS DATE) 
                    BETWEEN @start AND @end
                GROUP BY pd.PayModeName
                ORDER BY pd.PayModeName
            `;

            const paymodeResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(paymodeQuery);

            // ✅ Process Paymode data - USING FUNCTION
            const paymodeBreakdown = processPaymodeBreakdown(paymodeResult.recordset);

            // Get Sales by Category
            const categoryResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(categorySalesQuery);

            // Get Sales by Department
            const departmentResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(departmentSalesQuery);

            // Get Top Selling Items
            const topItemsResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(topItemsQuery);

            // Get Slow Moving Items
            const slowItemsResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(slowItemsQuery);

            // Get Slow Moving Category
            const slowCategoryResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(slowCategoryQuery);

            // Meta Query for Total Transactions
            const metaQuery = `
                SELECT
                    COUNT(DISTINCT pd.BillNumber) as TotalReceipts,
                    ISNULL(SUM(pd.TotalAmountLessFreight), 0) as TotalNetSales
                FROM (
                    ${vwPaymentDetailUnion}
                ) pd
                WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end
            `;

            const metaResult = await pool.request()
                .input('start', sql.Date, start)
                .input('end', sql.Date, end)
                .query(metaQuery);

            const totalReceipts = metaResult.recordset[0]?.TotalReceipts || 0;
            const totalNetSales = metaResult.recordset[0]?.TotalNetSales || 0;
            const averageReceipt = totalReceipts > 0 ? (totalNetSales / totalReceipts).toFixed(2) : "0.00";

            let dishGroupName = result.recordset[0]?.DishGroupName || '';

            const summaryData = {
                NetSales: result.recordset[0]?.NetSales || 0,
                DishGroupName: dishGroupName,
                ServiceCharge: result.recordset[0]?.ServiceCharge || 0,
                TaxCollected: result.recordset[0]?.TaxCollected || 0,
                TotalDiscount: result.recordset[0]?.TotalDiscount || 0,
                Rounding: result.recordset[0]?.Rounding || 0,
                TotalRevenue: result.recordset[0]?.TotalRevenue || 0
            };

            console.log("✅ Legacy Summary Query Result:", summaryData);

            return res.json({
                success: true,
                type: 'summary',
                data: summaryData,
                salesByCategory: categoryResult.recordset,
                salesByDepartment: departmentResult.recordset,
                topSellingItems: topItemsResult.recordset,
                slowMovingItems: slowItemsResult.recordset,
                slowMovingCategory: slowCategoryResult.recordset,
                totalReceipts,
                averageReceipt,
                paymodeBreakdown,
                fromDate: start,
                toDate: end
            });
        }

    } catch (err) {
        console.error("🔥 Console Sales Report Error:", err.message);
        res.status(500).json({
            success: false,
            error: err.message,
            details: err.toString()
        });
    }
});

// GET Console Sales Report by DishGroup
router.get("/group", async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        const pool = await poolPromise;

        const start = fromDate || new Date().toISOString().split('T')[0];
        const end = toDate || new Date().toISOString().split('T')[0];

        const groupQuery = `
            SELECT
                dg.DishGroupName,
                ISNULL(SUM(vrod.TotalDetailLineAmount), 0) as TotalSales,
                ISNULL(SUM(vpd.RoundedBy), 0) as Rounding,
                ISNULL(SUM(vpd.TotalDiscountAmount), 0) as TotalDiscount
            FROM (
                ${vwPaymentDetailUnion}
            ) vpd
            INNER JOIN (
                ${vwOrderDetailUnion}
            ) vrod ON vpd.OrderId = vrod.OrderId
            INNER JOIN dbo.DishMaster dm ON vrod.DishId = dm.DishId
            LEFT JOIN dbo.Dishgroupmaster dg ON dm.DishGroupId = dg.DishGroupId
            WHERE CAST(vpd.OrderDateTime AS DATE) BETWEEN @start AND @end
                  AND dg.DishGroupName NOT LIKE '%DEMO%'
                  AND dm.Name NOT LIKE '%DEMO%'
            GROUP BY dg.DishGroupName
            ORDER BY dg.DishGroupName
        `;

        const result = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(groupQuery);

        return res.json({
            success: true,
            data: result.recordset,
            fromDate: start,
            toDate: end
        });

    } catch (err) {
        console.error("🔥 Group Report Error:", err.message);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;