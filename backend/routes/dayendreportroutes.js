const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

router.get('/', async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        console.log(`📅 Day End Report - From: ${fromDate}, To: ${toDate}`);

        const pool = await poolPromise;

        // Organization Info
        const orgQuery = `
            SELECT TOP 1
                Name,
                Address1_Line1,
                Address1_Line2,
                Address1_City,
                Address1_PostalCode,
                Address1_Telephone1
            FROM Organization
        `;
        const orgResult = await pool.request().query(orgQuery);
        const orgInfo = orgResult.recordset[0] || {};

        // 1. Get SettlementHeader data
        let headerQuery = `
            SELECT
                SettlementID,
                ISNULL(SubTotal, 0) as TotalSales,
                ISNULL(RoundedBy, 0) as RoundOff,
                ISNULL(TotalTax, 0) as TotalTax,
                ISNULL(DiscountAmount, 0) as Discount,
                ISNULL(ServiceCharge, 0) as ServiceCharge,
                ISNULL(InvoiceCount, 0) as NoOfBills,
                ISNULL(VoidItemQty, 0) as VoidQty,
                ISNULL(VoidItemAmount, 0) as VoidItemAmount,
                ISNULL(TerminalCode, 'SR') as TerminalCode,
                ISNULL(DayendRefNo, 'D000001') as DayendRefNo,
                LastSettlementDate
            FROM SettlementHeader
           
        `;

        if (fromDate && toDate) {
            headerQuery += `
WHERE CAST(
    DATEADD(HOUR, 8, LastSettlementDate)
AS DATE) BETWEEN @start AND @end
`;
        }

        const headerRequest = pool.request();
        if (fromDate && toDate) {
            headerRequest.input('start', sql.Date, fromDate);
            headerRequest.input('end', sql.Date, toDate);
        }

        const headerResult = await headerRequest.query(headerQuery);
        const headers = headerResult.recordset;

        console.log(`📊 Found ${headers.length} settlement records`);

        if (headers.length === 0) {
            return res.json({
                success: true,
                orgInfo: orgInfo,
                reportData: {
                    cashier: "System",
                    receiptCount: 0,
                    refNo: "",
                    salesDetail: { totalSales: 0, roundOff: 0, netTotal: 0 },
                    paymodeDetail: {},
                    settlementDetail: { cashTotal: 0, otherTotal: 0 },
                    analysis: { salesAmount: 0, noOfBills: 0, avgPerBill: 0 },
                    voidDetail: { voidItemQty: 0, voidItemAmount: 0 }
                }
            });
        }

        // Get SettlementID
        const settlementId = headers[0]?.SettlementID;

        // 2. Get Cash Amount and ReceiptCount from SettlementDetail table
        let cashTotal = 0;
        let cardTotal = 0;
        let receiptCount = 0;
        const paymodeDetail = {};

        if (settlementId) {
            const detailQuery = `
                SELECT
                    Paymode,
                    ISNULL(SysAmount, 0) as Amount,
                    ISNULL(ReceiptCount, 0) as ReceiptCount
                FROM SettlementDetail
                WHERE SettlementId = @settlementId
            `;

            const detailRequest = pool.request();
            detailRequest.input('settlementId', sql.UniqueIdentifier, settlementId);
            const detailResult = await detailRequest.query(detailQuery);
            const details = detailResult.recordset;

            console.log("SettlementDetail Records:", details);

            details.forEach(detail => {
                if (detail.Amount > 0) {
                    paymodeDetail[detail.Paymode] = detail.Amount;
                    if (detail.Paymode === 'CASH') {
                        cashTotal = detail.Amount;
                        receiptCount = detail.ReceiptCount;
                        console.log(`Found CASH - Amount: ${cashTotal}, ReceiptCount: ${receiptCount}`);
                    }
                    if (detail.Paymode === 'CARD' || detail.Paymode === 'NETS' || detail.Paymode === 'PAYNOW') {
                        cardTotal += detail.Amount;
                    }
                }
            });
        }

        // Calculate totals from SettlementHeader
        const totalSales = headers.reduce((sum, s) => sum + (s.TotalSales || 0), 0);
        const totalRoundOff = headers.reduce((sum, s) => sum + (s.RoundOff || 0), 0);
        const totalTax = headers.reduce((sum, s) => sum + (s.TotalTax || 0), 0);
        const totalDiscount = headers.reduce((sum, s) => sum + (s.Discount || 0), 0);
        const totalServiceCharge = headers.reduce((sum, s) => sum + (s.ServiceCharge || 0), 0);
        const totalVoidQty = headers.reduce((sum, s) => sum + (s.VoidQty || 0), 0);
        const totalVoidItemAmount = headers.reduce((sum, s) => sum + (s.VoidItemAmount || 0), 0);

        const netTotal = totalSales + totalRoundOff;
        const noOfBills = headers.reduce((sum, s) => sum + (s.NoOfBills || 0), 0);
        const avgPerBill = noOfBills > 0 ? (totalSales / noOfBills).toFixed(2) : 0;

        const terminalCode = headers[0]?.TerminalCode || "";
        const dayendRefNo = headers[0]?.DayendRefNo || "";

        const reportData = {
            cashier: terminalCode,
            receiptCount: receiptCount,
            refNo: dayendRefNo,
            salesDetail: {
                totalSales: totalSales,
                totalTax: totalTax,
                totalDiscount: totalDiscount,
                totalServiceCharge: totalServiceCharge,
                roundOff: totalRoundOff,
                netTotal: netTotal
            },
            paymodeDetail: paymodeDetail,
            settlementDetail: {
                cashTotal: cashTotal,
                cardTotal: cardTotal,
                otherTotal: 0
            },
            analysis: {
                salesAmount: netTotal,
                noOfBills: noOfBills,
                avgPerBill: parseFloat(avgPerBill)
            },
            voidDetail: {
                voidItemQty: totalVoidQty,
                voidItemAmount: totalVoidItemAmount
            }
        };

        console.log(`FINAL - Cash: ${cashTotal}, ReceiptCount: ${receiptCount}, Bills: ${noOfBills}, RefNo: ${dayendRefNo}`);

        res.json({
            success: true,
            orgInfo: orgInfo,
            reportData: reportData,
            fromDate: fromDate,
            toDate: toDate
        });

    } catch (err) {
        console.error("Dayend Report Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Get available dates
router.get('/dates', async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT DISTINCT
                CAST(DATEADD(HOUR, 8, LastSettlementDate) AS DATE) as OrderDate,
                COUNT(*) as OrderCount,
                SUM(ISNULL(SubTotal, 0)) as TotalAmount,
                SUM(ISNULL(InvoiceCount, 0)) as TotalBills
            FROM SettlementHeader
            WHERE LastSettlementDate IS NOT NULL
           GROUP BY CAST(DATEADD(HOUR, 8, LastSettlementDate) AS DATE)

ORDER BY CAST(DATEADD(HOUR, 8, LastSettlementDate) AS DATE) DESC
        `);

        res.json({
            success: true,
            dates: result.recordset
        });

    } catch (err) {
        console.error("Error fetching dates:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;

