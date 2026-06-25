const { poolPromise } = require("../db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // List all rows in the date range
    const res = await pool.request().query(`
      SELECT 
        rd.OrderId,
        rd.Quantity,
        rd.TotalDetailLineAmount,
        dm.Name as DishName,
        rd.StatusCode
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) rd
      INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      INNER JOIN (
        SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate
        FROM (
          SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          UNION ALL
          SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri_all
        GROUP BY OrderId
      ) ri ON rd.OrderId = ri.OrderId
      WHERE ri.InvoiceDate >= '${start} 00:00:00' AND ri.InvoiceDate <= '${end} 23:59:59'
    `);

    const rows = res.recordset;
    console.log("Looking for rows matching Qty=3, Amount=13.50, or combinations:");
    
    // Find single rows with Qty=3 and Amount=13.50
    const singleRows = rows.filter(r => Number(r.Quantity) === 3 && Number(r.TotalDetailLineAmount) === 13.50);
    console.log("\nSingle rows matching Qty=3 and Amount=13.50:");
    console.table(singleRows);

    // Find any rows with unit price = 4.50
    const unitPriceRows = rows.filter(r => Number(r.TotalDetailLineAmount) / Number(r.Quantity) === 4.50);
    console.log("\nRows with unit price = 4.50:");
    console.table(unitPriceRows);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
