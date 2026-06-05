const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        
        const start = '2025-11-20T00:00:00';
        const end = '2025-11-30T23:59:59';
        const category = 'INDIAN KITCHEN';

        const categoryFilter = category ? `AND REPLACE(ISNULL(CategoryName,''), ' ', '') LIKE '%' + REPLACE(@category, ' ', '') + '%'` : '';
        
        const detailQuery = `
            SELECT 
                OpeningStock, 
                DishGroupName, 
                CategoryName, 
                TranDate, 
                CategoryId, 
                DishGroupId, 
                Code, 
                TranNo, 
                Name, 
                PQty, 
                PRQty, 
                SQty, 
                SRQty, 
                ClosingStock
            FROM vw_DishInventoryMovement
            WHERE TranDate BETWEEN @start AND @end
            ${categoryFilter}
            ORDER BY TranDate, CategoryName, DishGroupName, Name
        `;

        const result = await pool.request()
            .input('start', sql.DateTime, start)
            .input('end', sql.DateTime, end)
            .input('category', sql.NVarChar, category)
            .query(detailQuery);

        console.log(`✅ Results for ${category} from ${start} to ${end}:`, result.recordset.length);
        if (result.recordset.length > 0) {
            console.log('First row:', result.recordset[0]);
        } else {
            console.log('NO DATA FOUND. Checking if category exists at all...');
            const cats = await pool.request().query("SELECT DISTINCT CategoryName FROM vw_DishInventoryMovement");
            console.log('Available Categories:', cats.recordset.map(r => r.CategoryName));
        }
        
    } catch (err) {
        console.error(err);
    }
}
run();
