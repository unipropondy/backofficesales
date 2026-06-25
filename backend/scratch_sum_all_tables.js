const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;

    console.log("=== RestaurantOrderDetail (Main) ===");
    const res1 = await pool.request().query(`
      SELECT SUM(Quantity) as Qty, SUM(TotalDetailLineAmount) as Amount
      FROM dbo.RestaurantOrderDetail
      WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log(res1.recordset[0]);

    console.log("=== RestaurantOrderDetailCur (Current) ===");
    const res2 = await pool.request().query(`
      SELECT SUM(Quantity) as Qty, SUM(TotalDetailLineAmount) as Amount
      FROM dbo.RestaurantOrderDetailCur
      WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log(res2.recordset[0]);

    console.log("=== Combined (Main + Cur) ===");
    const res3 = await pool.request().query(`
      SELECT SUM(Qty) as Qty, SUM(Amount) as Amount
      FROM (
        SELECT Quantity as Qty, TotalDetailLineAmount as Amount FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT Quantity as Qty, TotalDetailLineAmount as Amount FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) t
    `);
    console.log(res3.recordset[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
