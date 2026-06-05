const { sql, poolPromise } = require('./db');
async function run() {
    try {
        const pool = await poolPromise;
        
        const fromDate = '2025-11-11T00:00:00';
        const toDate = '2025-11-27T23:59:59';
        const category = 'SOUTH INDIAN';
        const dishGroup = 'PRATA';
        const dishName = 'Bomb Prata';
        const active = 'true';
        const type = 'summary';

        const start = fromDate;
        const end = toDate;

        const categoryFilter = category ? `AND REPLACE(ISNULL(CategoryName,''), ' ', '') LIKE '%' + REPLACE(@category, ' ', '') + '%'` : '';
        const dishGroupFilter = dishGroup ? `AND REPLACE(ISNULL(DishGroupName,''), ''), ' ', '') LIKE '%' + REPLACE(@dishGroup, ' ', '') + '%'` : '';
        const dishNameFilter = dishName ? `AND REPLACE(ISNULL(Name,''), ' ', '') LIKE '%' + REPLACE(@dishName, ' ', '') + '%'` : '';
        const activeFilter = (active === 'true' || active === true) ? `AND IsActive = 1` : '';

        const addFilters = (req) => {
            if (category) req = req.input('category', sql.NVarChar, category);
            if (dishGroup) req = req.input('dishGroup', sql.NVarChar, dishGroup);
            if (dishName) req = req.input('dishName', sql.NVarChar, dishName);
            return req;
        };

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
            ${activeFilter}
            ORDER BY CategoryId, DishGroupId, ID
        `;

        let request = pool.request()
            .input('start', sql.DateTime, start)
            .input('end', sql.DateTime, end);
        request = addFilters(request);

        const result = await request.query(summaryQuery);
        console.log('Success!', result.recordset.length);
        
    } catch (err) {
        console.error('🔥 ERROR:', err.message);
    }
}
run();
