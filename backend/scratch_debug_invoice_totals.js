const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Query RestaurantInvoice / Cur totals directly
    const res = await pool.request().query(`
      SELECT 
        COUNT(*) as BillCount,
        SUM(TotalLineItemAmount) as SumLineItemAmount,
        SUM(TotalDiscountAmount) as SumDiscountAmount,
        SUM(ServiceCharge) as SumServiceCharge,
        SUM(TotalTax) as SumTotalTax,
        SUM(TotalAmount) as SumTotalAmount
      FROM (
        SELECT OrderId, TotalLineItemAmount, TotalDiscountAmount, ServiceCharge, TotalTax, TotalAmount, InvoiceDate FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, TotalLineItemAmount, TotalDiscountAmount, ServiceCharge, TotalTax, TotalAmount, InvoiceDate FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) ri
      WHERE ri.InvoiceDate >= '${start} 00:00:00' AND ri.InvoiceDate <= '${end} 23:59:59'
    `);
    console.log("RestaurantInvoice / Cur Header Totals:");
    console.table(res.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
