const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    const query = `
      SELECT 
        SUM(rd.Quantity) as TotalQty,
        SUM(rd.TotalDetailLineAmount) as TotalAmount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
        WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) rd
      INNER JOIN (
        SELECT OrderId, InvoiceDate, StatusCode, TotalAmount
        FROM dbo.vw_RestaurantInvoiceForDishwiseSales
        WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) RO ON RO.OrderId = rd.OrderId
      WHERE RO.StatusCode = 5 AND RO.TotalAmount <> 0
        AND CAST(RO.InvoiceDate AS DATE) BETWEEN '${start}' AND '${end}'
    `;

    const res = await pool.request().query(query);
    console.log("Categorywise logic totals:");
    console.table(res.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
