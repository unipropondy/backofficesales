const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Get all details for Mutton Nalli or items with TotalDetailLineAmount / Quantity = 4.50
    const query = `
      SELECT 
        rd.OrderId,
        rd.StatusCode as DetailStatus,
        rd.DishId,
        dm.Name as DishName,
        rd.Quantity,
        rd.TotalDetailLineAmount,
        ri.InvoiceDate
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
      LEFT JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      WHERE ri.InvoiceDate >= '${start} 00:00:00' 
        AND ri.InvoiceDate <= '${end} 23:59:59'
        AND (dm.Name LIKE '%Mutton Nalli%' OR (rd.Quantity > 0 AND rd.TotalDetailLineAmount / rd.Quantity = 4.50))
    `;

    const res = await pool.request().query(query);
    console.log("Details matching 'Mutton Nalli' or price 4.50:");
    console.table(res.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
