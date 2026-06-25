const { poolPromise } = require("../db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    console.log("=== Checking combinations to get Qty=2535.00, Amount=14525.30 ===");

    // Test different options:
    // 1. With/without corrupt order (OrderId = '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D')
    // 2. With different TotalDetailLineAmount filters:
    //    - none
    //    - > 0
    //    - >= 0
    // 3. Status codes filters:
    //    - Paid only (StatusCode = 5)
    //    - All status codes
    
    const excludeCorruptOptions = [true, false];
    const amountFilters = [
      { name: "all", clause: "" },
      { name: "> 0", clause: "AND rd.TotalDetailLineAmount > 0" },
      { name: ">= 0", clause: "AND rd.TotalDetailLineAmount >= 0" }
    ];
    const statusFilters = [
      { name: "all", clause: "" },
      { name: "Paid (StatusCode=5)", clause: "AND ro.StatusCode = 5" }
    ];

    for (let exc of excludeCorruptOptions) {
      for (let af of amountFilters) {
        for (let sf of statusFilters) {
          
          const query = `
            SELECT 
              SUM(rd.Quantity) AS Qty,
              SUM(rd.TotalDetailLineAmount) AS Amount
            FROM (
              SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetail
              UNION ALL
              SELECT OrderId, DishId, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetailCur
            ) rd
            INNER JOIN (
              SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate
              FROM (
                SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoice
                UNION ALL
                SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoiceCur
              ) ri_all
              GROUP BY OrderId
            ) ri ON rd.OrderId = ri.OrderId
            INNER JOIN (
              SELECT OrderId, StatusCode
              FROM (
                SELECT OrderId, StatusCode FROM dbo.RestaurantOrder
                UNION ALL
                SELECT OrderId, StatusCode FROM dbo.RestaurantOrderCur
              ) all_ro
            ) ro ON rd.OrderId = ro.OrderId
            WHERE ri.InvoiceDate >= '${start} 00:00:00'
              AND ri.InvoiceDate <= '${end} 23:59:59'
              ${exc ? "AND rd.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'" : ""}
              ${af.clause}
              ${sf.clause}
          `;

          const res = await pool.request().query(query);
          const row = res.recordset[0];
          const q = Number(row.Qty || 0);
          const a = Number(row.Amount || 0);

          if (q === 2535 || Math.abs(a - 14525.30) < 1.0) {
            console.log(`MATCH found! ExcludeCorrupt=${exc}, AmtFilter=${af.name}, StatusFilter=${sf.name} => Qty: ${q}, Amount: ${a}`);
          }
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
