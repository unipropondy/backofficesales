const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query(`
      SELECT 
        SUM(Quantity) AS TotalQty,
        SUM(TotalDetailLineAmount) AS TotalAmount
      FROM dbo.RestaurantOrderDetail
      WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("RestaurantOrderDetail Totals (excluding corrupt order):", res.recordset[0]);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
