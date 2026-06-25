const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const testOrderId = '6898CDAE-34DA-44D2-8DD7-0528F8848438';
    
    console.log("Invoices for OrderId:", testOrderId);
    const res = await pool.request().query(`
      SELECT RestaurantBillId, OrderId, BillNumber, TotalAmount, InvoiceDate, StatusCode
      FROM dbo.RestaurantInvoice
      WHERE OrderId = '${testOrderId}'
    `);
    console.table(res.recordset);
    
    console.log("Order Details for OrderId:", testOrderId);
    const resDetails = await pool.request().query(`
      SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, OrderDateTime
      FROM dbo.RestaurantOrderDetail
      WHERE OrderId = '${testOrderId}'
    `);
    console.table(resDetails.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
