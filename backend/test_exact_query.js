const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        
        const start = '2025-11-11T00:00:00';
        const end = '2025-11-27T23:59:59';
        const category = 'SOUTH INDIAN';
        const dishGroup = 'PRATA';
        const dishName = 'Bomb Prata';

        const categoryFilter = category ? `AND REPLACE(ISNULL(CategoryName,''), ' ', '') LIKE '%' + REPLACE(@category, ' ', '') + '%'` : '';
        const dishGroupFilter = dishGroup ? `AND REPLACE(ISNULL(DishGroupName,''), ' ', '') LIKE '%' + REPLACE(@dishGroup, ' ', '') + '%'` : '';
        const dishNameFilter = dishName ? `AND REPLACE(ISNULL(Name,''), ' ', '') LIKE '%' + REPLACE(@dishName, ' ', '') + '%'` : '';

        const summaryQuery = `
            SELECT 
                Name, 
                PQty, 
                PRQty, 
                SQty, 
                SRQty, 
                Code, 
                CategoryName, 
                DishGroupName, 
                CategoryId, 
                DishGroupId, 
                ID, 
                OpeningStock, 
                TranDate
            FROM vw_DishInventoryMovement
            WHERE TranDate BETWEEN @start AND @end
            ${categoryFilter}
            ${dishGroupFilter}
            ${dishNameFilter}
            ORDER BY CategoryId, DishGroupId, ID
        `;

        const result = await pool.request()
            .input('start', sql.DateTime, start)
            .input('end', sql.DateTime, end)
            .input('category', sql.NVarChar, category)
            .input('dishGroup', sql.NVarChar, dishGroup)
            .input('dishName', sql.NVarChar, dishName)
            .query(summaryQuery);

        console.log(`✅ Results count:`, result.recordset.length);
        if (result.recordset.length > 0) {
            console.log('First row:', result.recordset[0]);
        }
        
    } catch (err) {
        console.error(err);
    }
}
run();
