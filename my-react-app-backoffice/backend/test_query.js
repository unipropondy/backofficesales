const { sql, poolPromise } = require("./db");

async function testQuery() {
    try {
        const pool = await poolPromise;
        const summaryQuery = `
            SELECT
                ISNULL(CategoryName, '') as CategoryName,
                ISNULL(DishGroupName, '') as DishGroupName,
                ISNULL(Code, '') as Code,
                ISNULL(Name, '') as Name,
                ISNULL(SUM(PQty), 0) as TotalPQty,
                ISNULL(SUM(PRQty), 0) as TotalPRQty,
                ISNULL(SUM(SQty), 0) as TotalSQty,
                ISNULL(SUM(SRQty), 0) as TotalSRQty,
                ISNULL(SUM(OpeningStock), 0) as TotalOpeningStock,
                ISNULL(SUM(ClosingStock), 0) as TotalClosingStock,
                ISNULL(AVG(UnitPrice), 0) as UnitPrice
            FROM TempDishInventoryMovement
            WHERE CAST(TranDate AS DATE) BETWEEN @start AND @end
            GROUP BY CategoryName, DishGroupName, Code, Name
            ORDER BY CategoryName, DishGroupName, Name
        `;

        const request = pool.request()
            .input('start', sql.Date, '2026-04-24')
            .input('end', sql.Date, '2026-04-24');

        const result = await request.query(summaryQuery);
        console.log("SUCCESS. Rows:", result.recordset.length);
        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err.message);
        process.exit(1);
    }
}

testQuery();
