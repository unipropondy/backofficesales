const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;

    console.log("=== 1. Itemwise Query without date filter (Original JOIN) ===");
    const res1 = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty, 
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantOrderDetail rd
      JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
      WHERE ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log(res1.recordset[0]);

    console.log("=== 2. Combined Main + Cur with Original JOIN (No date filter) ===");
    const res2 = await pool.request().query(`
      SELECT 
        SUM(Quantity) AS Qty, 
        SUM(TotalDetailLineAmount) AS Amount
      FROM (
        SELECT Quantity, TotalDetailLineAmount, OrderId FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT Quantity, TotalDetailLineAmount, OrderId FROM dbo.RestaurantOrderDetailCur
      ) rd
      JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
      WHERE ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log(res2.recordset[0]);

    console.log("=== 3. Monthwise/Qty view sum over all history ===");
    const res3 = await pool.request().query(`
      SELECT 
        SUM(vw.TotalDetailLineAmount) AS Amount
      FROM dbo.Vw_MonthwiseSales vw
      WHERE vw.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log(res3.recordset[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
