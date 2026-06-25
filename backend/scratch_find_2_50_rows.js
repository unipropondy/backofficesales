const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    const query = `
      SELECT 
        rd.OrderId,
        rd.Quantity,
        rd.TotalDetailLineAmount,
        dm.Name as DishName,
        rd.StatusCode as DetailStatus,
        RO.StatusCode as InvoiceStatus,
        RO.TotalAmount as InvoiceTotalAmount,
        dm.IsActive as DishIsActive
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
      LEFT JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      WHERE CAST(RO.InvoiceDate AS DATE) BETWEEN '${start}' AND '${end}'
        AND RO.StatusCode = 5 AND RO.TotalAmount <> 0
        AND rd.Quantity = 1 AND rd.TotalDetailLineAmount = 2.50
    `;

    const res = await pool.request().query(query);
    console.log("Rows with Qty=1 and Amount=2.50:");
    console.table(res.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
