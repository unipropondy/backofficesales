const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Retrieve all detail rows with their StatusCode and Invoice information (deduplicated)
    const res = await pool.request().query(`
      SELECT 
        rd.OrderId,
        rd.Quantity,
        rd.TotalDetailLineAmount,
        rd.StatusCode as DetailStatus,
        RO.StatusCode as InvoiceStatus,
        RO.TotalAmount as InvoiceTotalAmount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetail
        WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetailCur
        WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) rd
      INNER JOIN (
        SELECT 
          OrderId,
          MIN(InvoiceDate) as InvoiceDate,
          MAX(StatusCode) as StatusCode,
          MAX(TotalAmount) as TotalAmount
        FROM (
          SELECT OrderId, InvoiceDate, StatusCode, TotalAmount
          FROM dbo.RestaurantInvoice
          WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          UNION ALL
          SELECT OrderId, CAST(CreatedOn AS DATE) as InvoiceDate, StatusCode, TotalAmount
          FROM dbo.RestaurantInvoiceCur
          WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) t
        GROUP BY OrderId
      ) RO ON RO.OrderId = rd.OrderId
      WHERE CAST(RO.InvoiceDate AS DATE) BETWEEN '${start}' AND '${end}'
    `);

    const rows = res.recordset;
    console.log(`Fetched ${rows.length} rows.`);

    const targetQty = 2535;
    const targetAmt = 14525.30;

    // Subsets of detail statuses
    const subsets = [
      [0, 1, 4],
      [0, 1, 2, 4],
      [1, 4],
      [1, 2, 4]
    ];

    // TotalAmount filters
    const totalAmountFilters = [
      { name: "all", check: (tot) => true },
      { name: "<> 0", check: (tot) => tot !== 0 }
    ];

    // Detail Amount filters
    const detailAmountFilters = [
      { name: "all", check: (amt) => true },
      { name: "> 0", check: (amt) => amt > 0 }
    ];

    // Invoice status filters
    const invoiceStatusFilters = [
      { name: "all", check: (st) => true },
      { name: "= 5", check: (st) => st === 5 }
    ];

    for (let subset of subsets) {
      for (let taf of totalAmountFilters) {
        for (let daf of detailAmountFilters) {
          for (let isf of invoiceStatusFilters) {
            let sumQty = 0;
            let sumAmount = 0;

            for (let row of rows) {
              if (
                subset.includes(row.DetailStatus) &&
                taf.check(Number(row.InvoiceTotalAmount)) &&
                daf.check(Number(row.TotalDetailLineAmount)) &&
                isf.check(row.InvoiceStatus)
              ) {
                sumQty += Number(row.Quantity) || 0;
                sumAmount += Number(row.TotalDetailLineAmount) || 0;
              }
            }

            if (sumQty === targetQty || Math.abs(sumAmount - targetAmt) < 0.1) {
              console.log(`\n🎉 MATCH FOUND:`);
              console.log(`Detail statuses: [${subset.join(',')}]`);
              console.log(`Invoice TotalAmount: ${taf.name}`);
              console.log(`Detail Amount: ${daf.name}`);
              console.log(`Invoice Status: ${isf.name}`);
              console.log(`Qty: ${sumQty}, Amount: ${sumAmount.toFixed(2)}`);
            }
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
