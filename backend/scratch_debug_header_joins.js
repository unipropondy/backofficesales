const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Let's get details joined with header status codes
    const res = await pool.request().query(`
      SELECT 
        d.StatusCode as DetailStatus,
        h.StatusCode as HeaderStatus,
        COUNT(*) as Cnt,
        SUM(d.Quantity) as SumQty,
        SUM(d.TotalDetailLineAmount) as SumAmount
      FROM (
        SELECT StatusCode, Quantity, TotalDetailLineAmount, OrderDateTime, OrderId FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT StatusCode, Quantity, TotalDetailLineAmount, OrderDateTime, OrderId FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) d
      INNER JOIN (
        SELECT StatusCode, OrderId FROM dbo.RestaurantOrder WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT StatusCode, OrderId FROM dbo.RestaurantOrderCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) h ON d.OrderId = h.OrderId
      WHERE CAST(d.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}'
      GROUP BY d.StatusCode, h.StatusCode
      ORDER BY d.StatusCode, h.StatusCode
    `);

    console.log("Details joined with RestaurantOrder (Header) Status:");
    console.table(res.recordset);

    // Let's also check if we join with RestaurantInvoice instead of RestaurantOrder:
    const resInvoice = await pool.request().query(`
      SELECT 
        d.StatusCode as DetailStatus,
        inv.StatusCode as InvoiceStatus,
        COUNT(*) as Cnt,
        SUM(d.Quantity) as SumQty,
        SUM(d.TotalDetailLineAmount) as SumAmount
      FROM (
        SELECT StatusCode, Quantity, TotalDetailLineAmount, OrderDateTime, OrderId FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT StatusCode, Quantity, TotalDetailLineAmount, OrderDateTime, OrderId FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) d
      INNER JOIN (
        SELECT StatusCode, OrderId FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT StatusCode, OrderId FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) inv ON d.OrderId = inv.OrderId
      WHERE CAST(d.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}'
      GROUP BY d.StatusCode, inv.StatusCode
      ORDER BY d.StatusCode, inv.StatusCode
    `);

    console.log("\nDetails joined with RestaurantInvoice (Invoice) Status:");
    console.table(resInvoice.recordset);

    // Let's check how many details don't have matching headers or invoices
    const resOrphans = await pool.request().query(`
      SELECT 
        COUNT(*) as TotalDetails,
        SUM(CASE WHEN h.OrderId IS NULL THEN 1 ELSE 0 END) as MissingHeader,
        SUM(CASE WHEN inv.OrderId IS NULL THEN 1 ELSE 0 END) as MissingInvoice
      FROM (
        SELECT OrderDateTime, OrderId FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderDateTime, OrderId FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) d
      LEFT JOIN (
        SELECT OrderId FROM dbo.RestaurantOrder WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId FROM dbo.RestaurantOrderCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) h ON d.OrderId = h.OrderId
      LEFT JOIN (
        SELECT OrderId FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) inv ON d.OrderId = inv.OrderId
      WHERE CAST(d.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}'
    `);
    console.log("\nOrphan counts:");
    console.table(resOrphans.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
