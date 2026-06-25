const { poolPromise } = require("../db");

async function run() {
  try {
    const pool = await poolPromise;
    const fromDate = '2026-06-22';
    const toDate = '2026-06-23';

    // Sum of items for orders matching the invoices in the date range
    const resDetail = await pool.request().query(`
      SELECT 
        SUM(rd.TotalDetailLineAmount) as SumItemsAmount,
        SUM(rd.Quantity) as SumItemsQty
      FROM (
        SELECT OrderId, TotalDetailLineAmount, Quantity FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, TotalDetailLineAmount, Quantity FROM dbo.RestaurantOrderDetailCur
      ) rd
      INNER JOIN (
        SELECT OrderId
        FROM (
          SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          UNION ALL
          SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri_all
        WHERE InvoiceDate >= '${fromDate}' AND InvoiceDate <= '${toDate} 23:59:59'
        GROUP BY OrderId
      ) ri ON rd.OrderId = ri.OrderId
    `);
    console.log("Sum items of these orders:", resDetail.recordset[0]);

    // Let's see some invoices where the invoice TotalLineItemAmount does not match the sum of its items
    const resDiff = await pool.request().query(`
      SELECT 
        ri.OrderId,
        ri.BillNumber,
        ri.TotalLineItemAmount as InvoiceLineAmount,
        rd.SumItems
      FROM (
        SELECT OrderId, BillNumber, SUM(TotalLineItemAmount) as TotalLineItemAmount
        FROM (
          SELECT OrderId, BillNumber, TotalLineItemAmount FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          UNION ALL
          SELECT OrderId, BillNumber, TotalLineItemAmount FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) t
        GROUP BY OrderId, BillNumber
      ) ri
      INNER JOIN (
        SELECT OrderId, SUM(TotalDetailLineAmount) as SumItems
        FROM (
          SELECT OrderId, TotalDetailLineAmount FROM dbo.RestaurantOrderDetail
          UNION ALL
          SELECT OrderId, TotalDetailLineAmount FROM dbo.RestaurantOrderDetailCur
        ) t2
        GROUP BY OrderId
      ) rd ON ri.OrderId = rd.OrderId
      WHERE ABS(ri.TotalLineItemAmount - rd.SumItems) > 0.01
    `);
    console.log("\nOrders with mismatch between Invoice TotalLineItemAmount and sum of items:");
    console.table(resDiff.recordset.slice(0, 10));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
