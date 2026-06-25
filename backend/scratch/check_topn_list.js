const { poolPromise } = require("../db");

async function run() {
  try {
    const pool = await poolPromise;
    const fromDate = '2026-06-22';
    const toDate = '2026-06-23';

    const res = await pool.request().query(`
      SELECT 
        dm.DishCode,
        dm.Name AS DishName,
        CAST(SUM(rd.Quantity) AS DECIMAL(18,2)) AS Quantity,
        CAST(SUM(rd.TotalDetailLineAmount) AS DECIMAL(18,2)) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetailCur
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
      WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
        AND ri.InvoiceDate <= '${toDate} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
      GROUP BY dm.DishCode, dm.Name
      ORDER BY Quantity DESC, dm.DishCode DESC
    `);

    console.table(res.recordset.slice(-10)); // Show the last 10 rows (including Mutton Chukka if it is there)
    
    // Also show the sum of all rows returned
    const sumQty = res.recordset.reduce((sum, row) => sum + Number(row.Quantity), 0);
    const sumAmount = res.recordset.reduce((sum, row) => sum + Number(row.Amount), 0);
    console.log(`Total Qty: ${sumQty.toFixed(2)}, Total Amount: ${sumAmount.toFixed(2)}`);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
