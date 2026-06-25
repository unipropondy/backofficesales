const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Query using UNION including OrderDetailId to deduplicate exact record matches
    const res = await pool.request().query(`
      SELECT 
        rd.OrderId,
        rd.Quantity,
        rd.TotalDetailLineAmount,
        rd.StatusCode as DetailStatus,
        RO.StatusCode as InvoiceStatus,
        RO.TotalAmount as InvoiceTotalAmount
      FROM (
        SELECT OrderDetailId, OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetail
        WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION
        SELECT OrderDetailId, OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
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
          UNION
          SELECT OrderId, CAST(CreatedOn AS DATE) as InvoiceDate, StatusCode, TotalAmount
          FROM dbo.RestaurantInvoiceCur
          WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) t
        GROUP BY OrderId
      ) RO ON RO.OrderId = rd.OrderId
      WHERE CAST(RO.InvoiceDate AS DATE) BETWEEN '${start}' AND '${end}'
    `);

    const rows = res.recordset;
    console.log(`Fetched ${rows.length} unique rows (using OrderDetailId).`);

    const tests = [
      { dStatus: [0, 1, 2, 4], taf: false, daf: false, isf: false, name: "No filters (UNION with OrderDetailId)" },
      { dStatus: [0, 1, 2, 4], taf: true, daf: false, isf: true, name: "InvoiceStatus=5 and InvoiceTotalAmount<>0 (Categorywise logic)" },
      { dStatus: [0, 1, 4], taf: true, daf: false, isf: true, name: "Exclude DetailStatus=2 (Cancelled), InvoiceStatus=5, InvoiceTotalAmount<>0" },
      { dStatus: [0, 1, 2, 4], taf: true, daf: true, isf: true, name: "DetailAmount>0, InvoiceStatus=5, InvoiceTotalAmount<>0" },
      { dStatus: [0, 1, 4], taf: true, daf: true, isf: true, name: "DetailAmount>0, Exclude DetailStatus=2, InvoiceStatus=5, InvoiceTotalAmount<>0" }
    ];

    tests.forEach(t => {
      let sumQty = 0;
      let sumAmount = 0;

      for (let row of rows) {
        const dMatch = t.dStatus.includes(row.DetailStatus);
        const tafMatch = !t.taf || Number(row.InvoiceTotalAmount) !== 0;
        const dafMatch = !t.daf || Number(row.TotalDetailLineAmount) > 0;
        const isfMatch = !t.isf || row.InvoiceStatus === 5;

        if (dMatch && tafMatch && dafMatch && isfMatch) {
          sumQty += Number(row.Quantity) || 0;
          sumAmount += Number(row.TotalDetailLineAmount) || 0;
        }
      }

      console.log(`\n- ${t.name}:`);
      console.log(`  Qty: ${sumQty.toFixed(2)}, Amount: ${sumAmount.toFixed(2)}`);
    });

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
