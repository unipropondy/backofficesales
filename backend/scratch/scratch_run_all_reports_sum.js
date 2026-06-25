const { poolPromise } = require("../db");

const getReportQuery = (params) => {
  const { orderSales, dayEnd, bySales, byItem, fromDate, toDate, reportType } = params;

  const finalFrom = fromDate;
  const finalTo = toDate;

  // Guest Meal Summary Report
  if (reportType === "GuestMeal") {
    return `
      SELECT 
        SUM(CAST(RO.TotalLineItemAmount AS DECIMAL(10,2))) AS ItemAmount,
        SUM(CAST(RO.TotalAmount AS DECIMAL(10,2))) AS TotalAmount
      FROM dbo.RestaurantOrder RO
      INNER JOIN dbo.Discount D ON RO.DiscountId = D.DiscountId
      INNER JOIN dbo.PaymentDetail PD ON RO.OrderId = PD.OrderId
      INNER JOIN dbo.RestaurantInvoice RI ON PD.RestaurantBillId = RI.RestaurantBillId
      WHERE D.isGuestMeal = 1
        AND RO.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        AND CAST(RI.InvoiceDate AS DATE) >= CAST('${finalFrom}' AS DATE)
        AND CAST(RI.InvoiceDate AS DATE) <= CAST('${finalTo}' AS DATE)
    `;
  }

  // 1. Sales Summary - Using RestaurantInvoice table
  if (bySales === "Summary") {
    return `
      SELECT 
        s.Sales,
        ISNULL(o.Disc, 0) AS Disc,
        ISNULL(o.SVC, 0) AS SVC,
        ISNULL(o.Tax, 0) AS Tax
      FROM (
        SELECT 
          ROUND(SUM(rd.TotalDetailLineAmount), 2) AS Sales
        FROM (
          SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
          FROM dbo.RestaurantOrderDetail
          UNION ALL
          SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
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
        WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00' 
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
          AND rd.TotalDetailLineAmount < 1000000
          AND rd.TotalDetailLineAmount > 0
      ) s
      CROSS JOIN (
        SELECT 
          ROUND(SUM(ISNULL(ro.TotalDiscountAmount, 0)), 2) AS Disc,
          ROUND(SUM(ISNULL(ro.ServiceCharge, 0)), 2) AS SVC,
          ROUND(SUM(ISNULL(ro.TotalTax, 0)), 2) AS Tax
        FROM (
          SELECT OrderId, TotalDiscountAmount, ServiceCharge, TotalTax
          FROM (
            SELECT OrderId, TotalDiscountAmount, ServiceCharge, TotalTax,
                   ROW_NUMBER() OVER(PARTITION BY OrderId ORDER BY (SELECT NULL)) as rn
            FROM (
              SELECT OrderId, TotalDiscountAmount, ServiceCharge, TotalTax FROM dbo.RestaurantOrder WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, TotalDiscountAmount, ServiceCharge, TotalTax FROM dbo.RestaurantOrderCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) all_ro
          ) t_ro
          WHERE rn = 1
        ) ro
        INNER JOIN (
          SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate
          FROM (
            SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            UNION ALL
            SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          ) ri_all
          GROUP BY OrderId
        ) ri ON ro.OrderId = ri.OrderId
        WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00' 
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
      ) o
    `;
  }

  // BusinessType Report
  if (bySales === "BusinessType") {
    return `
      SELECT 
        CAST(s.SubTotal AS DECIMAL(18,2)) AS SubTotal,
        CAST(ISNULL(o.Discount, 0) AS DECIMAL(18,2)) AS Discount,
        CAST(ISNULL(o.ServiceCharge, 0) AS DECIMAL(18,2)) AS ServiceCharge,
        CAST(ISNULL(o.Tax, 0) AS DECIMAL(18,2)) AS Tax,
        CAST(s.SubTotal - ISNULL(o.Discount, 0) + ISNULL(o.ServiceCharge, 0) + ISNULL(o.Tax, 0) AS DECIMAL(18,2)) AS NetTotal
      FROM (
        SELECT 
          SUM(rd.TotalDetailLineAmount) AS SubTotal
        FROM (
          SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
          FROM dbo.RestaurantOrderDetail
          UNION ALL
          SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
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
        WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
          AND rd.TotalDetailLineAmount < 1000000
          AND rd.TotalDetailLineAmount > 0
      ) s
      CROSS JOIN (
        SELECT 
          SUM(ISNULL(ro.TotalDiscountAmount, 0)) AS Discount,
          SUM(ISNULL(ro.ServiceCharge, 0)) AS ServiceCharge,
          SUM(ISNULL(ro.TotalTax, 0)) AS Tax
        FROM (
          SELECT OrderId, TotalDiscountAmount, ServiceCharge, TotalTax
          FROM (
            SELECT OrderId, TotalDiscountAmount, ServiceCharge, TotalTax,
                   ROW_NUMBER() OVER(PARTITION BY OrderId ORDER BY (SELECT NULL)) as rn
            FROM (
              SELECT OrderId, TotalDiscountAmount, ServiceCharge, TotalTax FROM dbo.RestaurantOrder WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
              UNION ALL
              SELECT OrderId, TotalDiscountAmount, ServiceCharge, TotalTax FROM dbo.RestaurantOrderCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ) all_ro
          ) t_ro
          WHERE rn = 1
        ) ro
        INNER JOIN (
          SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate
          FROM (
            SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            UNION ALL
            SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          ) ri_all
          GROUP BY OrderId
        ) ri ON ro.OrderId = ri.OrderId
        WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
      ) o
    `;
  }
  
  // 1.5 Sales Journal (By Sales)
  if (bySales === "Journal") {
    return `
      SELECT 
        CAST(SUM(sh.SubTotal) AS DECIMAL(18,2)) AS SubTotal,
        CAST(ISNULL(SUM(sh.DiscountAmount), 0) AS DECIMAL(18,2)) AS Discount,
        CAST(ISNULL(SUM(sh.ServiceCharge), 0) AS DECIMAL(18,2)) AS ServiceCharge,
        CAST(ISNULL(SUM(sh.TotalTax), 0) AS DECIMAL(18,2)) AS TotalTax
      FROM dbo.SettlementHeader sh
      INNER JOIN dbo.vw_Organization org ON sh.BusinessUnitId = org.BusinessUnitId
      WHERE sh.LastDayEndDate >= '${finalFrom}' 
        AND sh.LastDayEndDate <= '${finalTo} 23:59:59'
        AND sh.isDayEnd = 1
    `;
  }

  // 2. By Item - Month
  if (byItem === "Month") {
    return `
      SELECT 
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
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
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00' 
        AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `;
  }

  // 3. By Item - Qty
  if (byItem === "Qty") {
    return `
      SELECT 
        CAST(SUM(rd.TotalDetailLineAmount) AS DECIMAL(10,2)) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
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
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00' 
        AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `;
  }

  // By Item - Category Sales
  if (byItem === "Category") {
    return `
      SELECT 
        SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS NetSales
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
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
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
        AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `;
  }

  // By Item - Dish Group Sales
  if (byItem === "DishGroup") {
    return `
      SELECT 
        SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS NetSales
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
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
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
        AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `;
  }
  
  // By Item - Dish Sales
  if (byItem === "Dish") {
    return `
      SELECT 
        SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS NetSales
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
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
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
        AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `;
  }

  // 4. Order Sales - Hourly
  if (orderSales === "Hourly") {
    return `
      SELECT 
        SUM(CAST(rd.TotalDetailLineAmount AS DECIMAL(18,2))) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
      ) rd
      INNER JOIN (
        SELECT OrderId, MIN(OrderDateTime) AS OrderDateTime
        FROM (
          SELECT OrderId, OrderDateTime FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          UNION ALL
          SELECT OrderId, OrderDateTime FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri_all
        GROUP BY OrderId
      ) ri ON rd.OrderId = ri.OrderId
      WHERE ri.OrderDateTime >= '${finalFrom}'  
        AND ri.OrderDateTime < '${finalTo} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `;
  }

  // 5. Order Sales - Daywise
  if (orderSales === "Daywise") {
    return `
      SELECT 
        SUM(CAST(rd.Quantity AS DECIMAL(18,2))) AS Qty,
        SUM(CAST(rd.TotalDetailLineAmount AS DECIMAL(18,2))) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
      ) rd
      INNER JOIN (
        SELECT OrderId, MIN(OrderDateTime) AS OrderDateTime
        FROM (
          SELECT OrderId, OrderDateTime FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          UNION ALL
          SELECT OrderId, OrderDateTime FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri_all
        GROUP BY OrderId
      ) ri ON rd.OrderId = ri.OrderId
      WHERE ri.OrderDateTime >= '${finalFrom}'  
        AND ri.OrderDateTime < '${finalTo} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `;
  }

  // 6. Order Sales - Itemwise
  if (orderSales === "Itemwise") {
    return `
      SELECT 
        SUM(rd.Quantity) AS Qty, 
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
      ) rd
      INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      INNER JOIN (
        SELECT OrderId, MIN(OrderDateTime) AS OrderDateTime
        FROM (
          SELECT OrderId, OrderDateTime FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          UNION ALL
          SELECT OrderId, OrderDateTime FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri_all
        GROUP BY OrderId
      ) ri ON rd.OrderId = ri.OrderId
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE 1=1
        AND ri.OrderDateTime >= '${finalFrom}'  
        AND ri.OrderDateTime < '${finalTo} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `;
  }

  // 7. Order Sales - Group
  if (orderSales === "Group") {
    return `
      SELECT 
        SUM(rd.Quantity) AS Qty,
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
      ) rd
      INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      INNER JOIN (
        SELECT OrderId, MIN(OrderDateTime) AS OrderDateTime
        FROM (
          SELECT OrderId, OrderDateTime FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          UNION ALL
          SELECT OrderId, OrderDateTime FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri_all
        GROUP BY OrderId
      ) ri ON rd.OrderId = ri.OrderId
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      WHERE 1=1
        AND ri.OrderDateTime >= '${finalFrom}'  
        AND ri.OrderDateTime < '${finalTo} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `;
  }
  
  if (dayEnd === "TopNItems") {
    return `
      SELECT 
        CAST(SUM(rd.Quantity) AS DECIMAL(18,2)) AS Quantity,
        CAST(SUM(rd.TotalDetailLineAmount) AS DECIMAL(18,2)) AS Amount
      FROM (
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetail
        UNION ALL
        SELECT OrderId, DishId, Quantity, TotalDetailLineAmount
        FROM dbo.RestaurantOrderDetailCur
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
      WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
        AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        AND rd.TotalDetailLineAmount < 1000000
        AND rd.TotalDetailLineAmount > 0
    `;
  }

  return null;
};

async function run() {
  try {
    const pool = await poolPromise;
    const fromDate = '2026-06-22';
    const toDate = '2026-06-23';

    const testCases = [
      { name: "Summary (bySales)", params: { bySales: "Summary", fromDate, toDate } },
      { name: "BusinessType (bySales)", params: { bySales: "BusinessType", fromDate, toDate } },
      { name: "Month (byItem)", params: { byItem: "Month", fromDate, toDate } },
      { name: "Qty (byItem)", params: { byItem: "Qty", fromDate, toDate } },
      { name: "Category (byItem)", params: { byItem: "Category", fromDate, toDate } },
      { name: "DishGroup (byItem)", params: { byItem: "DishGroup", fromDate, toDate } },
      { name: "Dish (byItem)", params: { byItem: "Dish", fromDate, toDate } },
      { name: "Hourly (orderSales)", params: { orderSales: "Hourly", fromDate, toDate } },
      { name: "Daywise (orderSales)", params: { orderSales: "Daywise", fromDate, toDate } },
      { name: "Itemwise (orderSales)", params: { orderSales: "Itemwise", fromDate, toDate } },
      { name: "Group (orderSales)", params: { orderSales: "Group", fromDate, toDate } },
      { name: "TopNItems (dayEnd)", params: { dayEnd: "TopNItems", fromDate, toDate } },
    ];

    console.log("=== COMPARING SALES REPORTS FOR DATE RANGE 2026-06-22 to 2026-06-23 ===");
    for (const tc of testCases) {
      const sqlQuery = getReportQuery(tc.params);
      if (!sqlQuery) {
        console.log(`${tc.name}: Query not constructed`);
        continue;
      }
      const res = await pool.request().query(sqlQuery);
      const row = res.recordset[0];
      console.log(`${tc.name.padEnd(25)}:`, JSON.stringify(row));
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
