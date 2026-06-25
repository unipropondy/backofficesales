const { poolPromise } = require("./db");

async function run() {
  try {
    const pool = await poolPromise;
    console.log("Checking for huge values in RestaurantOrderDetail...");
    const res1 = await pool.request().query(`
      SELECT TOP 10 OrderId, DishId, Quantity, TotalDetailLineAmount, OrderDateTime
      FROM dbo.RestaurantOrderDetail
      WHERE TotalDetailLineAmount > 1000000 OR TotalDetailLineAmount < -1000000
    `);
    console.log("RestaurantOrderDetail high values:", res1.recordset);

    console.log("Checking for huge values in RestaurantInvoice...");
    const res2 = await pool.request().query(`
      SELECT TOP 10 OrderId, RestaurantBillId, TotalLineItemAmount, TotalAmount, InvoiceDate
      FROM dbo.RestaurantInvoice
      WHERE TotalLineItemAmount > 1000000 OR TotalAmount > 1000000
    `);
    console.log("RestaurantInvoice high values:", res2.recordset);

    console.log("Checking for huge values in PaymentDetail...");
    const res4 = await pool.request().query(`
      SELECT TOP 10 *
      FROM dbo.PaymentDetail
      WHERE Amount > 1000000 OR Amount < -1000000
    `);
    console.log("PaymentDetail high values:", res4.recordset);

    console.log("Checking for huge values in SettlementHeader...");
    const res6 = await pool.request().query(`
      SELECT TOP 10 *
      FROM dbo.SettlementHeader
      WHERE SubTotal > 1000000 OR TotalTax > 1000000
    `);
    console.log("SettlementHeader high values:", res6.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
