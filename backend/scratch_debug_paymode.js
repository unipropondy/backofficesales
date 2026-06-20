const { sql, poolPromise } = require("./db");

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

async function test() {
    const pool = await poolPromise;
    const start = '2026-06-19';
    const end = '2026-06-19';

    const paymodeQuery = `
    SELECT 
        ISNULL(CAST(pd.PayModeName AS VARCHAR(50)), 'UNKNOWN') as PayModeName,
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

    paymodeResult.recordset.forEach(row => {
        const mode = row.PayModeName?.toUpperCase() || '';
        console.log(`Row PayModeName: "${row.PayModeName}" (length: ${row.PayModeName?.length})`);
        console.log(`Processed mode: "${mode}"`);
        console.log(`mode.includes('UNKNOWN'):`, mode.includes('UNKNOWN'));
        console.log(`mode.includes('CASH'):`, mode.includes('CASH'));
    });
}

test().then(() => process.exit(0)).catch(console.error);
