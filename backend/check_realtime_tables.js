const { sql, poolPromise } = require("./db");

async function checkRealtimeTables() {
    try {
        const pool = await poolPromise;
        const today = new Date().toISOString().split('T')[0];
        console.log(`Checking database records for today: ${today}`);

        const tables = [
            'dbo.RestaurantOrder',
            'dbo.RestaurantOrderCur',
            'dbo.RestaurantOrderDetail',
            'dbo.RestaurantOrderDetailCur',
            'dbo.RestaurantInvoice',
            'dbo.RestaurantInvoiceCur',
            'dbo.PaymentDetail',
            'dbo.PaymentDetailCur',
            'dbo.SettlementHeader',
            'dbo.SettlementDetail'
        ];

        for (const table of tables) {
            try {
                // Check if table exists first
                const exists = await pool.request().query(`
                    SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_SCHEMA = '${table.split('.')[0]}' AND TABLE_NAME = '${table.split('.')[1]}'
                `);
                
                if (exists.recordset.length === 0) {
                    console.log(`Table ${table} does not exist.`);
                    continue;
                }

                // Check count for today
                let dateCol = 'OrderDateTime';
                if (table.includes('Invoice')) dateCol = 'InvoiceDate';
                if (table.includes('Settlement')) dateCol = 'LastSettlementDate';

                const countRes = await pool.request().query(`
                    SELECT COUNT(*) as Count 
                    FROM ${table} 
                    WHERE CAST(${dateCol} AS DATE) = '${today}'
                `);
                console.log(`Table ${table}: ${countRes.recordset[0].Count} records today`);
            } catch (e) {
                console.log(`Table ${table}: Error checking - ${e.message}`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRealtimeTables();
