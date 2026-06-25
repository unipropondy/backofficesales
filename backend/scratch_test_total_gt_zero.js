const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    const res = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty,
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetailCur
      ) rd
      INNER JOIN (
        SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate
        FROM (
          SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          UNION ALL
          SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri_all
        GROUP BY OrderId
      ) ri ON rd.OrderId = ri.OrderId
      WHERE ri.InvoiceDate >= '${start} 00:00:00'
        AND ri.InvoiceDate <= '${end} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `);
    console.log("With TotalDetailLineAmount > 0:", res.recordset[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
