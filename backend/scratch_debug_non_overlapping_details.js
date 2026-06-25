const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Query that pulls details from Cur if present, otherwise from Main
    const query = `
      SELECT 
        SUM(rd.Quantity) as TotalQty,
        SUM(rd.TotalDetailLineAmount) as TotalAmount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetailCur
        WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        
        UNION ALL
        
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetail
        WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          AND OrderId NOT IN (SELECT DISTINCT OrderId FROM dbo.RestaurantOrderDetailCur)
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
    `;

    const res = await pool.request().query(query);
    console.log("Non-overlapping details totals (no filters):");
    console.table(res.recordset);

    // Let's also check the target combination:
    const resFiltered = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) as TotalQty,
        SUM(rd.TotalDetailLineAmount) as TotalAmount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetailCur
        WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        
        UNION ALL
        
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount, StatusCode
        FROM dbo.RestaurantOrderDetail
        WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          AND OrderId NOT IN (SELECT DISTINCT OrderId FROM dbo.RestaurantOrderDetailCur)
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
        AND RO.StatusCode = 5 AND RO.TotalAmount <> 0
    `);
    console.log("Non-overlapping details totals (InvoiceStatus=5 and InvoiceTotalAmount<>0):");
    console.table(resFiltered.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
