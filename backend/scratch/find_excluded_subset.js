const { poolPromise } = require("../db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

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

    const rows = res.recordset.map((r, idx) => ({
      idx,
      orderId: r.OrderId,
      qty: Number(r.Quantity),
      amt: Number(r.TotalDetailLineAmount),
      name: r.DishName,
      status: r.StatusCode
    }));

    console.log(`Searching subsets of ${rows.length} rows for Qty sum = 3 and Amount sum = 13.50...`);

    // We can use a recursive function with memoization, or just find combinations of size 1, 2, 3
    const results = [];

    // Combination of size 1
    for (let r of rows) {
      if (r.qty === 3 && Math.abs(r.amt - 13.50) < 0.01) {
        results.push([r]);
      }
    }

    // Combination of size 2
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const q = rows[i].qty + rows[j].qty;
        const a = rows[i].amt + rows[j].amt;
        if (q === 3 && Math.abs(a - 13.50) < 0.01) {
          results.push([rows[i], rows[j]]);
        }
      }
    }

    // Combination of size 3
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        for (let k = j + 1; k < rows.length; k++) {
          const q = rows[i].qty + rows[j].qty + rows[k].qty;
          const a = rows[i].amt + rows[j].amt + rows[k].amt;
          if (q === 3 && Math.abs(a - 13.50) < 0.01) {
            results.push([rows[i], rows[j], rows[k]]);
          }
        }
      }
    }

    // Combination of size 4
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        for (let k = j + 1; k < rows.length; k++) {
          for (let l = k + 1; l < rows.length; l++) {
            const q = rows[i].qty + rows[j].qty + rows[k].qty + rows[l].qty;
            const a = rows[i].amt + rows[j].amt + rows[k].amt + rows[l].amt;
            if (q === 3 && Math.abs(a - 13.50) < 0.01) {
              results.push([rows[i], rows[j], rows[k], rows[l]]);
            }
          }
        }
      }
    }

    console.log(`Found ${results.length} matching subsets:`);
    results.forEach((res, idx) => {
      console.log(`\nSubset ${idx + 1}:`);
      console.table(res);
    });

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
