const { poolPromise } = require("../db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Retrieve all detail rows with their StatusCode and TotalDetailLineAmount
    const res = await pool.request().query(`
      SELECT 
        rd.OrderId,
        rd.Quantity,
        rd.TotalDetailLineAmount,
        rd.StatusCode
      FROM (
        SELECT OrderId, StatusCode, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, StatusCode, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
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
      WHERE ri.InvoiceDate >= '${start} 00:00:00' AND ri.InvoiceDate <= '${end} 23:59:59'
    `);

    const rows = res.recordset;
    console.log(`Total rows fetched: ${rows.length}`);

    // Status codes present: 0, 1, 2, 4
    // We want to test subsets of {0, 1, 2, 4}
    const statusCodesList = [0, 1, 2, 4];
    
    // Generate all subsets of statusCodesList
    const subsets = [];
    const n = statusCodesList.length;
    for (let i = 0; i < (1 << n); i++) {
      const subset = [];
      for (let j = 0; j < n; j++) {
        if ((i & (1 << j)) > 0) {
          subset.push(statusCodesList[j]);
        }
      }
      subsets.push(subset);
    }

    // Amount filter choices
    const amountFilters = [
      { name: "all", check: (amt) => true },
      { name: "> 0", check: (amt) => amt > 0 },
      { name: ">= 0", check: (amt) => amt >= 0 }
    ];

    console.log(`Testing ${subsets.length * amountFilters.length} combinations...`);

    for (let subset of subsets) {
      if (subset.length === 0) continue;
      for (let af of amountFilters) {
        let sumQty = 0;
        let sumAmount = 0;

        for (let row of rows) {
          if (subset.includes(row.StatusCode) && af.check(row.TotalDetailLineAmount)) {
            sumQty += Number(row.Quantity) || 0;
            sumAmount += Number(row.TotalDetailLineAmount) || 0;
          }
        }

        if (sumQty === 2535 || Math.abs(sumAmount - 14525.30) < 0.1) {
          console.log(`MATCH: Statuses=[${subset.join(",")}], AmtFilter=${af.name} => Qty=${sumQty.toFixed(2)}, Amount=${sumAmount.toFixed(2)}`);
        }
      }
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
