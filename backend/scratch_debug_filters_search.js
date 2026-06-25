const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Fetch all details for the date range along with their header status
    const query = `
      SELECT 
        rd.OrderId,
        rd.StatusCode as DetailStatus,
        rd.Quantity,
        rd.TotalDetailLineAmount,
        ro.StatusCode as HeaderStatus,
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
      LEFT JOIN (
        SELECT OrderId, StatusCode FROM dbo.RestaurantOrder WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, StatusCode FROM dbo.RestaurantOrderCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) ro ON rd.OrderId = ro.OrderId
      WHERE ri.InvoiceDate >= '${start} 00:00:00' 
        AND ri.InvoiceDate <= '${end} 23:59:59'
    `;

    const res = await pool.request().query(query);
    const rows = res.recordset;
    console.log(`Fetched ${rows.length} detail rows.`);

    // We want: Qty = 2535, Amount = 14525.30
    const targetQty = 2535;
    const targetAmt = 14525.30;

    // Let's iterate through possible filter combinations in JS:
    const detailStatuses = [null, 0, 1, 2, 4];
    const headerStatuses = [null, 1, 3];
    const amtFilters = ['all', 'gt0'];

    // We will generate combinations of detail status filters (subsets of detailStatuses)
    // and header status filters (subsets of headerStatuses)
    function getSubsets(arr) {
      return arr.reduce((subsets, value) => subsets.concat(subsets.map(set => [value,...set])), [[]]);
    }

    const detailStatusSubsets = getSubsets([0, 1, 2, 4]);
    const headerStatusSubsets = getSubsets([1, 3]);

    console.log(`Searching through ${detailStatusSubsets.length * headerStatusSubsets.length * 2} combinations...`);

    let found = false;

    for (const dSubset of detailStatusSubsets) {
      if (dSubset.length === 0) continue;
      for (const hSubset of headerStatusSubsets) {
        if (hSubset.length === 0) continue;
        for (const amtFilter of amtFilters) {
          // Filter the rows
          const filtered = rows.filter(r => {
            // detail status
            if (!dSubset.includes(r.DetailStatus)) return false;
            // header status
            if (r.HeaderStatus !== null && !hSubset.includes(r.HeaderStatus)) return false;
            // amount
            if (amtFilter === 'gt0' && Number(r.TotalDetailLineAmount) <= 0) return false;
            return true;
          });

          const totalQty = filtered.reduce((sum, r) => sum + r.Quantity, 0);
          const totalAmt = filtered.reduce((sum, r) => sum + Number(r.TotalDetailLineAmount), 0);

          if (Math.abs(totalQty - targetQty) < 0.01 && Math.abs(totalAmt - targetAmt) < 0.05) {
            console.log(`\n🎉 MATCH FOUND!`);
            console.log(`Detail Statuses included: [${dSubset.join(', ')}]`);
            console.log(`Header Statuses included: [${hSubset.join(', ')}]`);
            console.log(`Amount Filter: ${amtFilter}`);
            console.log(`Resulting Qty: ${totalQty}, Amount: ${totalAmt.toFixed(2)}`);
            found = true;
          }
        }
      }
    }

    if (!found) {
      console.log("\n❌ No exact match found with standard filters. Let's look for closest matches:");
      let closest = [];
      for (const dSubset of detailStatusSubsets) {
        if (dSubset.length === 0) continue;
        for (const hSubset of headerStatusSubsets) {
          if (hSubset.length === 0) continue;
          for (const amtFilter of amtFilters) {
            const filtered = rows.filter(r => {
              if (!dSubset.includes(r.DetailStatus)) return false;
              if (r.HeaderStatus !== null && !hSubset.includes(r.HeaderStatus)) return false;
              if (amtFilter === 'gt0' && Number(r.TotalDetailLineAmount) <= 0) return false;
              return true;
            });
            const totalQty = filtered.reduce((sum, r) => sum + r.Quantity, 0);
            const totalAmt = filtered.reduce((sum, r) => sum + Number(r.TotalDetailLineAmount), 0);
            closest.push({ dSubset, hSubset, amtFilter, qty: totalQty, amt: totalAmt });
          }
        }
      }
      // Sort by absolute distance to target amount and qty
      closest.sort((a, b) => {
        const distA = Math.abs(a.qty - targetQty) + Math.abs(a.amt - targetAmt)/10;
        const distB = Math.abs(b.qty - targetQty) + Math.abs(b.amt - targetAmt)/10;
        return distA - distB;
      });

      console.log("Top 10 closest combinations:");
      closest.slice(0, 10).forEach(c => {
        console.log(`Detail: [${c.dSubset.join(', ')}], Header: [${c.hSubset.join(', ')}], Amt: ${c.amtFilter} => Qty: ${c.qty}, Amount: ${c.amt.toFixed(2)} (diff Qty: ${c.qty - targetQty}, diff Amt: ${(c.amt - targetAmt).toFixed(2)})`);
      });
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
