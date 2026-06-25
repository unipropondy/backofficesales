const { poolPromise } = require("../db");

async function checkSplit() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query(`
      SELECT OrderId, BillNumber, TotalLineItemAmount, TotalDiscountAmount, ServiceCharge, TotalTax, TotalAmount
      FROM dbo.RestaurantInvoiceCur
      WHERE OrderId = 'EA40B984-6FF5-49D2-BB37-AE12C07B1540'
    `);
    console.table(res.recordset);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkSplit();
