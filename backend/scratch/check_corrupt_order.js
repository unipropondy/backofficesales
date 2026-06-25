const { poolPromise } = require("../db");

async function check() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query(`
      SELECT Quantity, TotalDetailLineAmount, StatusCode
      FROM dbo.RestaurantOrderDetail
      WHERE OrderId = '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      UNION ALL
      SELECT Quantity, TotalDetailLineAmount, StatusCode
      FROM dbo.RestaurantOrderDetailCur
      WHERE OrderId = '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.table(res.recordset);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
