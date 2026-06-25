const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const fromDate = '2026-06-22';
    const toDate = '2026-06-23';

    console.log("=== Testing rewritten Top N Items query ===");
    const query = `
      SELECT 
        dm.DishCode,
        dm.Name AS DishName,
        CAST(SUM(rd.Quantity) AS DECIMAL(18,2)) AS Quantity,
        CAST(SUM(rd.TotalDetailLineAmount) AS DECIMAL(18,2)) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetailCur
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
    `;
    const res = await pool.request().query(query);
    console.log("Top 5 Items:", res.recordset.slice(0, 5));
    console.log("Total unique rows found:", res.recordset.length);
    
    // Sum Qty and Amount to verify
    const totalQty = res.recordset.reduce((s, r) => s + Number(r.Quantity), 0);
    const totalAmount = res.recordset.reduce((s, r) => s + Number(r.Amount), 0);
    console.log("Grand Totals: Qty =", totalQty, "Amount =", totalAmount);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
