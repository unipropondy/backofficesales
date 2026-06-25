const { poolPromise } = require("../db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    console.log("=== Investigating total sums of detail items ===");

    // 1. Raw sum of all matching items in date range (excluding corrupt order)
    const resRaw = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty,
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
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
    `);
    console.log("Raw items (Amt > or <= 0):", resRaw.recordset[0]);

    // 2. Sum with TotalDetailLineAmount > 0
    const resPos = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty,
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
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
        AND rd.TotalDetailLineAmount > 0
    `);
    console.log("Pos items (Amt > 0):", resPos.recordset[0]);

    // 3. What is the sum of items with TotalDetailLineAmount <= 0?
    const resZero = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty,
        SUM(rd.TotalDetailLineAmount) AS Amount,
        COUNT(*) as cnt
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
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
        AND rd.TotalDetailLineAmount <= 0
    `);
    console.log("Zero/negative items:", resZero.recordset[0]);

    // 4. Let's see all items in this date range that have TotalDetailLineAmount <= 0
    const resZeroList = await pool.request().query(`
      SELECT 
        rd.OrderId,
        rd.Quantity,
        rd.TotalDetailLineAmount,
        dm.Name as DishName
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
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
      WHERE ri.InvoiceDate >= '${start} 00:00:00'
        AND ri.InvoiceDate <= '${end} 23:59:59'
        AND rd.TotalDetailLineAmount <= 0
    `);
    console.table(resZeroList.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
