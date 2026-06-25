const fs = require('fs');
const path = require('path');
const { sql, poolPromise } = require("./db");

async function runVerification() {
    let reportText = "";
    function log(msg) {
        reportText += msg + "\n";
        console.log(msg);
    }

    try {
        const pool = await poolPromise;
        log("=== CONSOLIDATED REPORT, SALES REPORT & DAYEND REPORT VERIFICATION ===");
        log(`Run Date: ${new Date().toISOString()}`);
        log("");

        // Find the latest active date
        const datesResult = await pool.request().query(`
            SELECT TOP 1 
                CAST(InvoiceDate AS DATE) as InvoiceDate
            FROM dbo.RestaurantInvoice
            ORDER BY InvoiceDate DESC
        `);
        
        let targetDate = '2026-06-22';
        if (datesResult.recordset.length > 0) {
            const rawDate = datesResult.recordset[0].InvoiceDate;
            targetDate = rawDate instanceof Date ? rawDate.toISOString().split('T')[0] : rawDate;
        }
        log(`Target Verification Date: ${targetDate}`);
        log("====================================================");

        // 1. CONSOLIDATED SALES REPORT VERIFICATION
        log("\n--- 1. CONSOLIDATED SALES REPORT VERIFICATION ---");
        const consResult = await pool.request()
            .input('start', sql.Date, targetDate)
            .input('end', sql.Date, targetDate)
            .query(`
                SELECT
                    ISNULL(SUM(vrod.TotalDetailLineAmount), 0) as NetSales,
                    (SELECT ISNULL(SUM(RoundedBy), 0) FROM (
                        SELECT RoundedBy, OrderDateTime FROM dbo.vw_PaymentDetail
                        UNION ALL
                        SELECT RoundedBy, OrderDateTime FROM dbo.vw_PaymentDetailCur
                    ) pd WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end) as Rounding,
                    (SELECT ISNULL(SUM(TotalDiscountAmount), 0) FROM (
                        SELECT TotalDiscountAmount, OrderDateTime FROM dbo.vw_PaymentDetail
                        UNION ALL
                        SELECT TotalDiscountAmount, OrderDateTime FROM dbo.vw_PaymentDetailCur
                    ) pd WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end) as TotalDiscount,
                    (SELECT ISNULL(SUM(ServiceCharge), 0) FROM (
                        SELECT ServiceCharge, OrderDateTime FROM dbo.RestaurantOrder
                        UNION ALL
                        SELECT ServiceCharge, OrderDateTime FROM dbo.RestaurantOrderCur
                    ) ro WHERE CAST(ro.OrderDateTime AS DATE) BETWEEN @start AND @end) as ServiceCharge,
                    (SELECT ISNULL(SUM(TotalTax), 0) FROM (
                        SELECT TotalTax, OrderDateTime FROM dbo.RestaurantOrder
                        UNION ALL
                        SELECT TotalTax, OrderDateTime FROM dbo.RestaurantOrderCur
                    ) ro WHERE CAST(ro.OrderDateTime AS DATE) BETWEEN @start AND @end) as TaxCollected
                FROM (
                    SELECT TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetail
                    UNION ALL
                    SELECT TotalDetailLineAmount, OrderDateTime FROM dbo.vw_RestaurantOrderDetailCur
                ) vrod
                WHERE CAST(vrod.OrderDateTime AS DATE) BETWEEN @start AND @end
            `);
        
        log(JSON.stringify(consResult.recordset, null, 2));

        // Get Consolidated Paymodes
        log("\nConsolidated Paymode Breakdown:");
        const paymodeQuery = `
            SELECT 
                ISNULL(CAST(pd.PayModeName AS VARCHAR(50)), 'UNKNOWN') as PayModeName,
                COUNT(DISTINCT pd.BillNumber) as TransactionCount,
                SUM(pd.TotalAmountLessFreight) as TotalAmount
            FROM (
                SELECT BillNumber, PayModeName, TotalAmountLessFreight, OrderDateTime FROM dbo.vw_PaymentDetail
                UNION ALL
                SELECT BillNumber, PayModeName, TotalAmountLessFreight, OrderDateTime FROM dbo.vw_PaymentDetailCur
            ) pd
            WHERE CAST(pd.OrderDateTime AS DATE) BETWEEN @start AND @end
            GROUP BY pd.PayModeName
            ORDER BY pd.PayModeName
        `;
        const paymodeRes = await pool.request()
            .input('start', sql.Date, targetDate)
            .input('end', sql.Date, targetDate)
            .query(paymodeQuery);
        log(JSON.stringify(paymodeRes.recordset, null, 2));

        // 2. DAY END REPORT VERIFICATION
        log("\n--- 2. DAY END REPORT VERIFICATION ---");
        const dayendHeaderRes = await pool.request()
            .input('start', sql.Date, targetDate)
            .input('end', sql.Date, targetDate)
            .query(`
                SELECT
                    SettlementID,
                    SubTotal as TotalSales,
                    RoundedBy as RoundOff,
                    TotalTax,
                    DiscountAmount as Discount,
                    ServiceCharge,
                    InvoiceCount as NoOfBills,
                    VoidItemQty as VoidQty,
                    VoidItemAmount,
                    LastSettlementDate
                FROM SettlementHeader
                WHERE CAST(DATEADD(HOUR, 8, LastSettlementDate) AS DATE) BETWEEN @start AND @end
            `);
        log("Dayend Settlement Headers:");
        log(JSON.stringify(dayendHeaderRes.recordset, null, 2));

        if (dayendHeaderRes.recordset.length > 0) {
            const settlementIds = dayendHeaderRes.recordset.map(h => h.SettlementID);
            const detailQuery = `
                SELECT
                    Paymode,
                    SUM(SysAmount) as Amount,
                    SUM(ReceiptCount) as ReceiptCount
                FROM SettlementDetail
                WHERE SettlementId IN (${settlementIds.map(id => `'${id}'`).join(', ')})
                GROUP BY Paymode
            `;
            const dayendDetailRes = await pool.request().query(detailQuery);
            log("Dayend Settlement Details (Paymode collections):");
            log(JSON.stringify(dayendDetailRes.recordset, null, 2));
        } else {
            log("No Day End Settlements closed for this date.");
        }

        // 3. SALES REPORT VERIFICATION (Summary metrics from RestaurantInvoice)
        log("\n--- 3. SALES REPORT VERIFICATION ---");
        const salesSummaryRes = await pool.request()
            .input('start', sql.Date, targetDate)
            .input('end', sql.Date, targetDate)
            .query(`
                SELECT 
                    ROUND(SUM(TotalLineItemAmount), 2) AS Sales,
                    ROUND(SUM(TotalDiscountAmount), 2) AS Disc,
                    ROUND(SUM(ServiceCharge), 2) AS SVC,
                    ROUND(SUM(TotalTax), 2) AS [Tax 7%],
                    ROUND(SUM(TotalAmount), 2) AS NetTotal
                FROM dbo.RestaurantInvoice
                WHERE InvoiceDate >= @start AND InvoiceDate <= DATEADD(SECOND, 86399, CAST(@end AS DATETIME))
            `);
        log("Sales Report Summary:");
        log(JSON.stringify(salesSummaryRes.recordset, null, 2));

        // Save report to file
        const targetPath = path.join('C:\\Users\\faiza\\.gemini\\antigravity-ide\\brain\\a1df8899-3858-4e6f-a165-7d07961467fb', 'verification_report.txt');
        fs.writeFileSync(targetPath, reportText, 'utf8');
        log(`\nReport successfully written to ${targetPath}`);

        process.exit(0);
    } catch (err) {
        console.error("Verification Error:", err);
        process.exit(1);
    }
}

runVerification();
