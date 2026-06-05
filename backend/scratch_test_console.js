const { poolPromise, sql } = require('./db');
async function test() {
  try {
    const pool = await poolPromise;
    const res = await pool.request()
      .input('start', sql.Date, '2020-01-01')
      .input('end', sql.Date, '2030-01-01')
      .query(`SELECT TOP 1 * FROM RestaurantOrderDetail`);
    console.log("RestaurantOrderDetail columns:", Object.keys(res.recordset[0] || {}));
    
    // Test the summary query
    const res2 = await pool.request()
      .input('start', sql.Date, '2020-01-01')
      .input('end', sql.Date, '2030-01-01')
      .query(`
        SELECT 
            ISNULL(SUM(TotalDetailLineAmount), 0) as NetSales
        FROM RestaurantOrderDetail
        WHERE CAST(OrderDateTime AS DATE) BETWEEN @start AND @end
      `);
    console.log("Summary success!", res2.recordset);
    process.exit(0);
  } catch(e) {
    console.error("ERROR", e);
    process.exit(1);
  }
}
test();
