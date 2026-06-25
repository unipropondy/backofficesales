const { poolPromise } = require("../db");

async function run() {
  try {
    const pool = await poolPromise;
    const fromDate = '2026-06-22';
    const toDate = '2026-06-23';

    console.log("=== FILTER BY InvoiceDate ===");
    const resInv = await pool.request().query(`
      SELECT 
        COUNT(DISTINCT OrderId) as UniqueOrders,
        COUNT(*) as TotalInvoices,
        SUM(TotalLineItemAmount) as SumLineAmount,
        SUM(TotalAmount) as SumTotalAmount
      FROM (
        SELECT OrderId, InvoiceDate, TotalLineItemAmount, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, InvoiceDate, TotalLineItemAmount, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) t
      WHERE InvoiceDate >= '${fromDate}' AND InvoiceDate <= '${toDate} 23:59:59'
    `);
    console.log(resInv.recordset[0]);

    console.log("=== FILTER BY OrderDateTime (from invoice) ===");
    const resOrd = await pool.request().query(`
      SELECT 
        COUNT(DISTINCT OrderId) as UniqueOrders,
        COUNT(*) as TotalInvoices,
        SUM(TotalLineItemAmount) as SumLineAmount,
        SUM(TotalAmount) as SumTotalAmount
      FROM (
        SELECT OrderId, OrderDateTime, TotalLineItemAmount, TotalAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, OrderDateTime, TotalLineItemAmount, TotalAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) t
      WHERE OrderDateTime >= '${fromDate}' AND OrderDateTime <= '${toDate} 23:59:59'
    `);
    console.log(resOrd.recordset[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
