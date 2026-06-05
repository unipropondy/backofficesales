const { poolPromise, sql } = require('../db');

async function checkDetailTables() {
    const pool = await poolPromise;
    const start = '2025-11-25';
    const end = '2026-05-06';

    const tables = [
        'dbo.vw_RestaurantOrder',
        'dbo.vw_RestaurantOrderCur',
        'dbo.vw_RestaurantOrderDetail',
        'dbo.vw_RestaurantOrderDetailCur',
        'dbo.vw_PaymentDetail',
        'dbo.vw_PaymentDetailCur',
        'dbo.vw_DishMaster',
        'dbo.DishMaster'
    ];

    for (const table of tables) {
        try {
            const countRes = await pool.request()
                .query(`SELECT COUNT(*) as cnt FROM ${table}`);
            console.log(`Table ${table} total rows: ${countRes.recordset[0].cnt}`);
            
            if (table.includes('Order') || table.includes('Payment')) {
                const dateField = table.includes('Payment') ? 'OrderDateTime' : 'OrderDateTime';
                const countRange = await pool.request()
                    .input('start', sql.Date, start)
                    .input('end', sql.Date, end)
                    .query(`SELECT COUNT(*) as cnt FROM ${table} WHERE CAST(${dateField} AS DATE) BETWEEN @start AND @end`);
                console.log(`  └─ Date range [${start} to ${end}] count: ${countRange.recordset[0].cnt}`);
            }
        } catch (e) {
            console.error(`❌ Error on ${table}:`, e.message);
        }
    }
    
    // Test the joins
    try {
        const join1 = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT COUNT(*) as cnt FROM (
                    SELECT * FROM dbo.vw_RestaurantOrderDetail
                    UNION ALL
                    SELECT * FROM dbo.vw_RestaurantOrderDetailCur
                ) od
                INNER JOIN dbo.vw_DishMaster dm ON od.DishId = dm.DishId
            `);
        console.log(`Join od and dm total: ${join1.recordset[0].cnt}`);
    } catch(e) {
        console.error("Join od and dm failed:", e.message);
    }

    try {
        const join2 = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT COUNT(*) as cnt FROM (
                    SELECT * FROM dbo.vw_RestaurantOrder
                    UNION ALL
                    SELECT * FROM dbo.vw_RestaurantOrderCur
                ) ro
                INNER JOIN (
                    SELECT * FROM dbo.vw_RestaurantOrderDetail
                    UNION ALL
                    SELECT * FROM dbo.vw_RestaurantOrderDetailCur
                ) od ON ro.OrderId = od.OrderId
            `);
        console.log(`Join ro and od total: ${join2.recordset[0].cnt}`);
    } catch(e) {
        console.error("Join ro and od failed:", e.message);
    }

    try {
        const join3 = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT COUNT(*) as cnt FROM (
                    SELECT * FROM dbo.vw_RestaurantOrder
                    UNION ALL
                    SELECT * FROM dbo.vw_RestaurantOrderCur
                ) ro
                INNER JOIN (
                    SELECT * FROM dbo.vw_PaymentDetail
                    UNION ALL
                    SELECT * FROM dbo.vw_PaymentDetailCur
                ) pd ON ro.OrderId = pd.OrderId
            `);
        console.log(`Join ro and pd total: ${join3.recordset[0].cnt}`);
    } catch(e) {
        console.error("Join ro and pd failed:", e.message);
    }

    process.exit(0);
}

checkDetailTables();
