const { poolPromise } = require("../db");

async function checkInvoice() {
  try {
    const pool = await poolPromise;
    const fromDate = '2026-06-22';
    const toDate = '2026-06-23';

    console.log("=== RestaurantInvoice Rows ===");
    const resMain = await pool.request().query(`
      SELECT OrderId, BillNumber, InvoiceDate, TotalLineItemAmount, TotalDiscountAmount, ServiceCharge, TotalTax, TotalAmount
      FROM dbo.RestaurantInvoice
      WHERE InvoiceDate >= '${fromDate}' AND InvoiceDate <= '${toDate} 23:59:59'
    `);
    console.table(resMain.recordset);

    console.log("=== RestaurantInvoiceCur Rows ===");
    const resCur = await pool.request().query(`
      SELECT OrderId, BillNumber, InvoiceDate, TotalLineItemAmount, TotalDiscountAmount, ServiceCharge, TotalTax, TotalAmount
      FROM dbo.RestaurantInvoiceCur
      WHERE InvoiceDate >= '${fromDate}' AND InvoiceDate <= '${toDate} 23:59:59'
    `);
    console.table(resCur.recordset);

    console.log("=== Checking duplicate OrderIds in both ===");
    const resDup = await pool.request().query(`
      SELECT OrderId, COUNT(*) as cnt
      FROM (
        SELECT OrderId FROM dbo.RestaurantInvoice WHERE InvoiceDate >= '${fromDate}' AND InvoiceDate <= '${toDate} 23:59:59'
        UNION ALL
        SELECT OrderId FROM dbo.RestaurantInvoiceCur WHERE InvoiceDate >= '${fromDate}' AND InvoiceDate <= '${toDate} 23:59:59'
      ) t
      GROUP BY OrderId
      HAVING COUNT(*) > 1
    `);
    console.log("Duplicates:");
    console.table(resDup.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkInvoice();
