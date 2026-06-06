const express = require("express");
const router = express.Router();
const pdf = require("html-pdf");
const axios = require("axios"); 
const { poolPromise } = require('../db');


// ✅ Get company details from database
const getCompanyDetails = async () => {
  try {
    const pool = await poolPromise;  
    const result = await pool.request().query(`
      SELECT TOP 1 
        Name,
        Address1_Line1,
        Address1_Line2,
        Address1_Line3,
        Address1_City,
        Address1_State,
        Address1_PostalCode,
        Address1_Telephone1,
        Address1_Telephone2
      FROM dbo.Organization
    `);

    if (result.recordset[0]) {
      return result.recordset[0];
    }
    return {};
  } catch (err) {
    console.error("Error fetching company:", err);
    return {};
  }
};

const getLogoBase64 = async () => {
  try {
    const logoUrl = "https://uniprosg.com/wp-content/uploads/2024/09/unipro-logo-green-1.png";
    const response = await axios.get(logoUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const mimeType = response.headers['content-type'] || 'image/png';
    console.log("✅ Logo loaded successfully");
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error("❌ Logo fetch error:", err.message);
    return null;
  }
};

// ✅ Common function to generate totals for any report - SINGLE LINE FORMAT
function generateTotalsHTML(displayColumns, pageData, mappedData, totalPages, page) {
  const textColumns = ['Month', 'Item', 'DishGroupName', 'CategoryName', 'GstType', 'Hour', 'Group', 'TransactionMode', 'Date', 'TerminalCode', 'DishName', 'OrderDateTime', 'TotalDetailLineAmount', 'Year', 'No of Bills', 'Qty'];
  
  const numericColumns = displayColumns.slice(1).filter(col => !textColumns.includes(col));
  
  let pageTotalHtml = '';
  if (numericColumns.length > 0) {
    const pageTotalValues = numericColumns.map(col => {
      const pageTotal = pageData.reduce((sum, row) => sum + (Number(row[col]) || 0), 0);
      return `${pageTotal.toFixed(2)}`;
    }).join("   ");
    
    pageTotalHtml = `
      <div class="page-total-section" style="margin-top: 15px; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e0e0e0;">
        <div style="text-align: right;">
          <strong>Total:</strong> ${pageTotalValues}
        </div>
      </div>
    `;
  }
  
  let grandTotalHtml = '';
  if (numericColumns.length > 0 && page === totalPages - 1) {
    const grandTotalValues = numericColumns.map(col => {
      const grandTotal = mappedData.reduce((sum, row) => sum + (Number(row[col]) || 0), 0);
      return `${grandTotal.toFixed(2)}`;
    }).join("   ");
    
    grandTotalHtml = `
      <div class="grand-total-section" style="margin-top: 20px; padding: 10px 15px; background: #eef2f8; border-top: 2px solid #1a3c5a; border-bottom: 1px solid #1a3c5a;">
        <div style="text-align: right;">
          <strong>GRAND TOTAL:</strong> ${grandTotalValues}
        </div>
      </div>
    `;
  }
  
  return { pageTotalHtml, grandTotalHtml };
}

const getReportQuery = (params) => {
  const { orderSales, dayEnd, bySales, byItem, fromDate, toDate, category, dishGroup, reportType } = params;

  const finalFrom = fromDate;
  const finalTo = toDate;

  const dateFilter = (field) => {
    if (finalFrom && finalTo) {
      return `AND ${field} >= '${finalFrom}' AND ${field} <= '${finalTo} 23:59:59'`;
    }
    return "";
  };

  // ✅ Guest Meal Summary Report
  if (reportType === "GuestMeal") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, RI.InvoiceDate, 103) AS InvoiceDate,
          RI.BillNumber,
          CAST(RO.TotalLineItemAmount AS DECIMAL(10,2)) AS ItemAmount,
          CAST(RO.TotalDiscountAmount AS DECIMAL(10,2)) AS discountAmount,
          CAST(RO.ServiceCharge AS DECIMAL(10,2)) AS ServiceCharge,
          CAST(RO.TotalTax AS DECIMAL(10,2)) AS TotalTax,
          CAST(RO.TotalAmount AS DECIMAL(10,2)) AS TotalAmount,
          ISNULL(D.Description, '') AS Description
        FROM dbo.RestaurantOrder RO
        INNER JOIN dbo.Discount D ON RO.DiscountId = D.DiscountId
        INNER JOIN dbo.PaymentDetail PD ON RO.OrderId = PD.OrderId
        INNER JOIN dbo.RestaurantInvoice RI ON PD.RestaurantBillId = RI.RestaurantBillId
        WHERE D.isGuestMeal = 1
          AND CAST(RI.InvoiceDate AS DATE) >= CAST('${finalFrom}' AS DATE)
          AND CAST(RI.InvoiceDate AS DATE) <= CAST('${finalTo}' AS DATE)
        ORDER BY RI.InvoiceDate, RI.BillNumber
      `
    };
  }

  // ✅ 1. Sales Summary - Using RestaurantInvoice table
  if (bySales === "Summary") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, InvoiceDate, 103) AS Date,
          ROUND(SUM(TotalLineItemAmount), 2) AS Sales,
          0 AS FOC,
          ROUND(SUM(TotalDiscountAmount), 2) AS Disc,
          ROUND(SUM(ServiceCharge), 2) AS SVC,
          ROUND(SUM(TotalTax), 2) AS [Tax 7%],
          0 AS Tips,
          0 AS Rnd,
          0 AS ENT,
          0 AS Cash,
          0 AS Master,
          0 AS Visa
        FROM dbo.RestaurantInvoice
        WHERE InvoiceDate >= '${finalFrom}' 
          AND InvoiceDate <= '${finalTo} 23:59:59'
        GROUP BY CONVERT(VARCHAR, InvoiceDate, 103)
        ORDER BY MIN(InvoiceDate)
      `
    };
  }

  // ✅ BusinessType Report - WITH TIME ON FROM DATE
  if (bySales === "BusinessType") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
          CASE 
            WHEN ro.IsTakeAway = 1 THEN 'Take Away'
            ELSE 'Dine In'
          END AS Type,
          CAST(ISNULL(SUM(CAST(ro.TotalLineItemAmount AS DECIMAL(18,2))), 0) AS DECIMAL(18,2)) AS SubTotal,
          CAST(ISNULL(SUM(CAST(ro.TotalDiscountAmount AS DECIMAL(18,2))), 0) AS DECIMAL(18,2)) AS Discount,
          CAST(ISNULL(SUM(CAST(ro.ServiceCharge AS DECIMAL(18,2))), 0) AS DECIMAL(18,2)) AS ServiceCharge,
          CAST(ISNULL(SUM(CAST(ro.TotalTax AS DECIMAL(18,2))), 0) AS DECIMAL(18,2)) AS Tax,
          CAST(ISNULL(SUM(CAST(ro.TotalAmount AS DECIMAL(18,2))), 0) AS DECIMAL(18,2)) AS NetTotal
        FROM dbo.RestaurantOrder ro
        INNER JOIN dbo.RestaurantInvoice ri ON ro.OrderId = ri.OrderId
        WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        GROUP BY 
          CONVERT(VARCHAR, ri.InvoiceDate, 103),
          ro.IsTakeAway
        ORDER BY MIN(ri.InvoiceDate)
      `
    };
  }
  
  // ✅ 1.5 Sales Journal (By Sales)
  if (bySales === "Journal") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, sh.LastDayEndDate, 103) AS Date,
          CAST(sh.SubTotal AS DECIMAL(18,2)) AS SubTotal,
          CAST(ISNULL(sh.DiscountAmount, 0) AS DECIMAL(18,2)) AS Discount,
          CAST(ISNULL(sh.ServiceCharge, 0) AS DECIMAL(18,2)) AS [Service Charge],
          CAST(ISNULL(sh.TotalTax, 0) AS DECIMAL(18,2)) AS [Total Tax],
          CAST(ISNULL(sh.Tips, 0) AS DECIMAL(18,2)) AS Tips,
          sh.TotalPax,
          org.GstType,
          CAST(ISNULL(sh.RoundedBy, 0) AS DECIMAL(18,2)) AS [Round Off]
        FROM dbo.SettlementHeader sh
        INNER JOIN dbo.vw_Organization org ON sh.BusinessUnitId = org.BusinessUnitId
        WHERE sh.LastDayEndDate >= '${finalFrom}' 
          AND sh.LastDayEndDate <= '${finalTo} 23:59:59'
          AND sh.isDayEnd = 1
        ORDER BY sh.LastDayEndDate
      `
    };
  }

  // ✅ 2. By Item - Month
  if (byItem === "Month") {
    let monthQuery = `
      SELECT 
        vw.TotalDetailLineAmount, 
        vw.OrderDateTime, 
        vw.DishName,
        dgm.DishGroupName,
        cm.CategoryName
      FROM dbo.Vw_MonthwiseSales vw
      LEFT JOIN dbo.DishMaster dm ON vw.DishName = dm.Name
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE vw.OrderDateTime >= '${finalFrom}' 
        AND vw.OrderDateTime <= '${finalTo} 23:59:59'
    `;

    if (category && category !== "") {
      monthQuery += ` AND cm.CategoryName = '${category}'`;
    }

    if (dishGroup && dishGroup !== "") {
      monthQuery += ` AND dgm.DishGroupName = '${dishGroup}'`;
    }

    return { query: monthQuery };
  }

  // ✅ 3. By Item - Qty
  if (byItem === "Qty") {
    let qtyQuery = `
      SELECT 
        DATEPART(YEAR, vw.OrderDateTime) AS Year,
        DATENAME(MONTH, vw.OrderDateTime) AS Month,
        vw.DishName AS Item,
        dgm.DishGroupName,
        CAST(SUM(vw.TotalDetailLineAmount) AS DECIMAL(10,2)) AS Amount
      FROM dbo.Vw_MonthwiseSales vw
      LEFT JOIN dbo.DishMaster dm ON vw.DishName = dm.Name
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE vw.OrderDateTime >= '${finalFrom}' 
        AND vw.OrderDateTime <= '${finalTo} 23:59:59'
    `;

    if (category && category !== "") {
      qtyQuery += ` AND cm.CategoryName = '${category}'`;
    }

    if (dishGroup && dishGroup !== "") {
      qtyQuery += ` AND dgm.DishGroupName = '${dishGroup}'`;
    }

    qtyQuery += `
      GROUP BY 
        DATEPART(YEAR, vw.OrderDateTime),
        DATENAME(MONTH, vw.OrderDateTime),
        vw.DishName,
        dgm.DishGroupName
      ORDER BY 
        DATEPART(YEAR, vw.OrderDateTime),
        MIN(vw.OrderDateTime),
        Amount DESC
    `;

    return { query: qtyQuery };
  }

  // ✅ By Item - Category Sales (FIXED without buggy view)
  if (byItem === "Category") {
    let query = `
      SELECT 
        ISNULL(CAST(cm.CategoryId AS VARCHAR(50)), '') AS CategoryId,
        ISNULL(cm.CategoryName, 'Uncategorized') AS CategoryName,
        SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales,
        0 AS ItemDisc,
        0 AS Foc,
        0 AS Revenue70,
        0 AS Revenue30,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS Revenue
      FROM dbo.RestaurantInvoice ri
      INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
      LEFT JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
        AND ri.InvoiceDate <= '${finalTo} 23:59:59'
    `;
    
    if (category && category !== "") {
      query += ` AND cm.CategoryName = '${category}'`;
    }
    
    if (dishGroup && dishGroup !== "") {
      query += ` AND dgm.DishGroupName = '${dishGroup}'`;
    }
    
    query += ` GROUP BY cm.CategoryId, cm.CategoryName ORDER BY cm.CategoryName`;
    
    return { query: query };
  }

  // ✅ By Item - Dish Group Sales (FIXED without buggy view)
  if (byItem === "DishGroup") {
    let query = `
      SELECT 
        ISNULL(CAST(dgm.DishGroupId AS VARCHAR(50)), '') AS DishGroupId,
        ISNULL(dgm.DishGroupName, 'Uncategorized') AS DishGroupname,
        ISNULL(CAST(cm.CategoryId AS VARCHAR(50)), '') AS CategoryId,
        ISNULL(cm.CategoryName, 'Uncategorized') AS CategoryName,
        SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales,
        0 AS ItemDisc,
        0 AS Foc,
        0 AS Revenue70,
        0 AS Revenue30,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS Revenue
      FROM dbo.RestaurantInvoice ri
      INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
      LEFT JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
        AND ri.InvoiceDate <= '${finalTo} 23:59:59'
    `;
    
    if (category && category !== "") {
      query += ` AND cm.CategoryName = '${category}'`;
    }
    
    if (dishGroup && dishGroup !== "") {
      query += ` AND dgm.DishGroupName = '${dishGroup}'`;
    }
    
    query += ` GROUP BY dgm.DishGroupId, dgm.DishGroupName, cm.CategoryId, cm.CategoryName ORDER BY cm.CategoryId, dgm.DishGroupId`;
    
    return { query: query };
  }
  
  // ✅ By Item - Dish Sales (FIXED with Category and DishGroup filters)
  if (byItem === "Dish") {
    let query = `
      SELECT 
        ISNULL(cm.CategoryName, 'Uncategorized') AS CategoryName,
        ISNULL(dgm.DishGroupName, 'Uncategorized') AS DishGroupname,
        ISNULL(dm.Name, 'Unknown') AS Dishname,
        SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS ItemSales,
        0 AS ItemDisc,
        0 AS Foc,
        0 AS Revenue70,
        0 AS Revenue30,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS Revenue
      FROM dbo.RestaurantInvoice ri
      INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
      INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
        AND ri.InvoiceDate <= '${finalTo} 23:59:59'
    `;
    
    if (category && category !== "") {
      query += ` AND cm.CategoryName = '${category}'`;
    }
    
    if (dishGroup && dishGroup !== "") {
      query += ` AND dgm.DishGroupName = '${dishGroup}'`;
    }
    
    query += ` 
      GROUP BY cm.CategoryName, dgm.DishGroupName, dm.Name
      ORDER BY cm.CategoryName, dgm.DishGroupName, dm.Name
    `;
    
    return { query: query };
  }

  // ✅ 4. Order Sales - Hourly
  if (orderSales === "Hourly") {
    return {
      query: `
        SELECT 
          CONCAT(
            FORMAT(DATEPART(HOUR, ri.OrderDateTime), '00'), ':00 - ',
            FORMAT(DATEPART(HOUR, ri.OrderDateTime) + 1, '00'), ':00'
          ) AS Hour,
          SUM(CAST(rd.TotalDetailLineAmount AS DECIMAL(18,2))) AS Amount
        FROM dbo.RestaurantInvoice ri
        INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
        WHERE 1=1
          AND ri.OrderDateTime >= '${finalFrom}'  
          AND ri.OrderDateTime < '${finalTo} 23:59:59'
        GROUP BY DATEPART(HOUR, ri.OrderDateTime)
        ORDER BY DATEPART(HOUR, ri.OrderDateTime)
      `
    };
  }

  // ✅ 5. Order Sales - Daywise
  if (orderSales === "Daywise") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, ri.OrderDateTime, 103) AS Date,
          COUNT(DISTINCT ri.OrderId) AS [No of Bills],
          SUM(CAST(rd.Quantity AS DECIMAL(18,2))) AS Qty,
          SUM(CAST(rd.TotalDetailLineAmount AS DECIMAL(18,2))) AS Amount
        FROM dbo.RestaurantInvoice ri
        JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
        WHERE 1=1
          AND ri.OrderDateTime >= '${finalFrom}'  
          AND ri.OrderDateTime < '${finalTo} 23:59:59'
        GROUP BY CONVERT(VARCHAR, ri.OrderDateTime, 103)
        ORDER BY MIN(ri.OrderDateTime)
      `
    };
  }

  // ✅ 6. Order Sales - Itemwise
  if (orderSales === "Itemwise") {
    return {
      query: `
        SELECT 
          dm.Name AS Item, 
          SUM(rd.Quantity) AS Qty, 
          SUM(rd.TotalDetailLineAmount) AS Amount
        FROM dbo.RestaurantOrderDetail rd
        JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
        JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
        LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
        LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
        WHERE 1=1
          AND ri.OrderDateTime >= '${finalFrom}'  
          AND ri.OrderDateTime < '${finalTo} 23:59:59'
          ${category ? `AND cm.CategoryName = '${category}'` : ''}
          ${dishGroup ? `AND dgm.DishGroupName = '${dishGroup}'` : ''}
        GROUP BY dm.Name
        ORDER BY Amount DESC
      `
    };
  }

  // ✅ 7. Order Sales - Group
  if (orderSales === "Group") {
    return {
      query: `
        SELECT 
          ISNULL(dgm.DishGroupName, 'Uncategorized') AS [Group],
          SUM(rd.Quantity) AS Qty,
          SUM(rd.TotalDetailLineAmount) AS Amount
        FROM dbo.RestaurantOrderDetail rd
        JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
        JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
        LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
        WHERE 1=1
          ${dateFilter('ri.OrderDateTime')}
        GROUP BY dgm.DishGroupName
        ORDER BY Amount DESC
      `
    };
  }
  
  if (dayEnd === "TopNItems") {
    return {
      query: `
        SELECT 
          DishCode,
          DishName,
          CAST(Quantity AS DECIMAL(18,2)) AS Quantity,
          CAST(TotalDetailLineAmount AS DECIMAL(18,2)) AS Amount
        FROM dbo.vw_NItemSalesReport
        ORDER BY Quantity DESC, DishCode DESC
      `
    };
  }
  
  if (dayEnd === "DiscountSummary") {
    return {
      query: `
        SELECT 
          RI.BillNumber AS InvoiceNo,
          CAST(RO.TotalLineItemAmount AS DECIMAL(18,2)) AS SubTotal,
          CAST(RO.TotalDiscountAmount AS DECIMAL(18,2)) AS Discount,
          CAST(RO.ServiceCharge AS DECIMAL(18,2)) AS ServiceCharge,
          CAST(RO.TotalTax AS DECIMAL(18,2)) AS TotalTax,
          CAST(RO.TotalAmount AS DECIMAL(18,2)) AS TotalAmount,
          D.Description,
          CONVERT(VARCHAR, RI.InvoiceDate, 103) AS InvoiceDate,
          D.DiscountId
        FROM dbo.RestaurantOrder RO
        LEFT JOIN dbo.Discount D ON RO.DiscountId = D.DiscountId
        INNER JOIN dbo.RestaurantInvoice RI ON RO.OrderId = RI.OrderId
        WHERE CAST(RI.InvoiceDate AS DATE)
          BETWEEN CAST('${finalFrom}' AS DATE)
          AND CAST('${finalTo}' AS DATE)
        ORDER BY CAST(RI.InvoiceDate AS DATE), D.Description, RI.BillNumber
      `
    };
  }

  if (dayEnd === "RefundSummary") {
    return {
      query: `
        SELECT 
          RI.BillNumber,
          DM.DishCode,
          DM.Name AS DishName,
          CAST(ROD.Quantity AS DECIMAL(18,2)) AS Quantity,
          CAST(ROD.TotalDetailLineAmount AS DECIMAL(18,2)) AS Amount,
          RI.TotalAmount,
          RI.TotalDiscountAmount,
          RI.ServiceCharge,
          RI.Tips,
          ROD.PricePerUnit,
          ROD.Tax,
          RI.OrderId,
          RI.InvoiceDate
        FROM dbo.RestaurantOrderDetail ROD
        INNER JOIN dbo.RestaurantInvoice RI ON ROD.OrderId = RI.OrderId
        INNER JOIN dbo.DishMaster DM ON ROD.DishId = DM.DishId
        WHERE CAST(RI.InvoiceDate AS DATE)
          BETWEEN CAST('${finalFrom}' AS DATE)
          AND CAST('${finalTo}' AS DATE)
        ORDER BY RI.OrderId
      `
    };
  }

  if (dayEnd === "TableChange") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, OrderDateTime, 103) AS OrderDate,
          OrderNumber,
          SourceTable,
          Tableno AS NewTable,
          TotalAmount,
          ModifyUser,
          StatusCodeName
        FROM dbo.vw_RestaurantOrder
        WHERE CAST(OrderDateTime AS DATE)
          BETWEEN CAST('${finalFrom}' AS DATE)
          AND CAST('${finalTo}' AS DATE)
        ORDER BY CAST(OrderDateTime AS DATE), OrderNumber
      `
    };
  }
  
  // ✅ 8. Day End - Paymode Collection (Summary with Detail)
  if (dayEnd === "Paymode") {
    return {
      query: `
        SELECT 
          'SUMMARY' AS ReportType,
          CONVERT(VARCHAR, sh.LastDayEndDate, 103) AS Date,
          sts.PayMode AS PayMode,
          '' AS BillNumber,
          '' AS ReferenceNumber,
          0 AS Tips,
          0 AS PayAmount,
          0 AS ReturnAmt,
          SUM(sts.SysAmount) AS Amount
        FROM dbo.SettlementHeader sh
        INNER JOIN dbo.SettlementTotalSales sts ON sh.SettlementID = sts.SettlementID
        WHERE sh.LastDayEndDate >= '${finalFrom}' 
          AND sh.LastDayEndDate <= '${finalTo} 23:59:59'
          AND sh.isDayEnd = 1
        GROUP BY sh.LastDayEndDate, sts.PayMode
        
        UNION ALL
        
        SELECT 
          'SUMMARY' AS ReportType,
          'No Data' AS Date,
          'No Settlement Found' AS PayMode,
          '' AS BillNumber,
          '' AS ReferenceNumber,
          0 AS Tips,
          0 AS PayAmount,
          0 AS ReturnAmt,
          0 AS Amount
        WHERE NOT EXISTS (
          SELECT 1 FROM dbo.SettlementHeader sh
          WHERE sh.LastDayEndDate >= '${finalFrom}' 
            AND sh.LastDayEndDate <= '${finalTo} 23:59:59'
            AND sh.isDayEnd = 1
        )
        
        UNION ALL
        
        SELECT 
          'DETAIL' AS ReportType,
          CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
          pm.PayMode AS PayMode,
          ri.BillNumber AS BillNumber,
          pd.ReferenceNumber AS ReferenceNumber,
          ISNULL(pd.tips, 0) AS Tips,
          ISNULL(pd.PayAmount, 0) AS PayAmount,
          ISNULL(pd.ReturnAmt, 0) AS ReturnAmt,
          ISNULL(pd.Amount, 0) AS Amount
        FROM dbo.RestaurantInvoice ri
        INNER JOIN dbo.PaymentDetail pd ON ri.RestaurantBillId = pd.RestaurantBillId
        INNER JOIN dbo.Paymode pm ON pd.Paymode = pm.Position
        WHERE ri.InvoiceDate >= '${finalFrom}' 
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        ORDER BY Date, ReportType DESC, PayMode, BillNumber
      `
    };
  }
  
  if (dayEnd === "Terminal") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
          ri.TerminalCode,
          ROUND(SUM(ri.TotalAmount), 2) AS Amount
        FROM dbo.RestaurantInvoice ri
        WHERE ri.InvoiceDate >= '${finalFrom}' 
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        GROUP BY CONVERT(VARCHAR, ri.InvoiceDate, 103), ri.TerminalCode
        ORDER BY MIN(ri.InvoiceDate), ri.TerminalCode
      `
    };
  }

  // ✅ 9. Day End - Sales Journal (SettlementHeader)
  if (dayEnd === "Journal") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, sh.LastDayEndDate, 103) AS Date,
          CAST(sh.SubTotal AS DECIMAL(10,2)) AS SubTotal,
          CAST(ISNULL(sh.DiscountAmount, 0) AS DECIMAL(10,2)) AS Discount,
          CAST(ISNULL(sh.ServiceCharge, 0) AS DECIMAL(10,2)) AS [Service Charge],
          CAST(ISNULL(sh.TotalTax, 0) AS DECIMAL(10,2)) AS [Total Tax],
          CAST(ISNULL(sh.Tips, 0) AS DECIMAL(10,2)) AS Tips,
          sh.TotalPax,
          org.GstType,
          CAST(ISNULL(sh.RoundedBy, 0) AS DECIMAL(10,2)) AS [Round Off]
        FROM dbo.SettlementHeader sh
        INNER JOIN dbo.vw_Organization org ON sh.BusinessUnitId = org.BusinessUnitId
        WHERE sh.LastDayEndDate >= '${finalFrom}' 
          AND sh.LastDayEndDate <= '${finalTo} 23:59:59'
          AND sh.isDayEnd = 1
        ORDER BY sh.LastDayEndDate
      `
    };
  }

  // ✅ 10. Day End - Sales Journal Summary (Crystal Report Style)
  if (dayEnd === "JournalSummary") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, sh.LastDayEndDate, 103) AS Date,
          CAST(SUM(sh.SubTotal) AS DECIMAL(10,2)) AS [Sub Total],
          CAST(SUM(ISNULL(sh.DiscountAmount, 0)) AS DECIMAL(10,2)) AS Discount,
          CAST(SUM(ISNULL(sh.ServiceCharge, 0)) AS DECIMAL(10,2)) AS [Service Charge],
          CAST(SUM(sh.SubTotal) - SUM(ISNULL(sh.DiscountAmount, 0)) + SUM(ISNULL(sh.ServiceCharge, 0)) AS DECIMAL(10,2)) AS [Gross Total],
          CAST(SUM(ISNULL(sh.TotalTax, 0)) AS DECIMAL(10,2)) AS [Total Tax],
          CAST(SUM(ISNULL(sh.RoundedBy, 0)) AS DECIMAL(10,2)) AS [Round],
          CAST(SUM(sh.SubTotal) - SUM(ISNULL(sh.DiscountAmount, 0)) + SUM(ISNULL(sh.ServiceCharge, 0)) + SUM(ISNULL(sh.TotalTax, 0)) + SUM(ISNULL(sh.RoundedBy, 0)) AS DECIMAL(10,2)) AS [Net Total]
        FROM dbo.SettlementHeader sh
        WHERE sh.LastDayEndDate >= '${finalFrom}' 
          AND sh.LastDayEndDate <= '${finalTo} 23:59:59'
        GROUP BY CONVERT(VARCHAR, sh.LastDayEndDate, 103)
        ORDER BY MIN(sh.LastDayEndDate)
      `
    };
  }

  // ✅ 11. Day End - Transaction Report
  if (dayEnd === "Transaction") {
    return {
      query: `
        SELECT 
          TransactionMode,
          CAST(SUM(Amount) AS DECIMAL(10,2)) AS Amount
        FROM dbo.TransactionMaster
        WHERE isSettlement = 1
          AND TransactionDate >= '${finalFrom}' 
          AND TransactionDate <= '${finalTo} 23:59:59'
        GROUP BY TransactionMode
        
        UNION ALL
        
        SELECT 
          'No Transactions Found' AS TransactionMode,
          0 AS Amount
        WHERE NOT EXISTS (
          SELECT 1 FROM dbo.TransactionMaster
          WHERE isSettlement = 1
            AND TransactionDate >= '${finalFrom}' 
            AND TransactionDate <= '${finalTo} 23:59:59'
        )
      `
    };
  }

  // ✅ Cancel Order - Summary Report (All Possible Cancel/Void Status Codes)
  if (dayEnd === "Cancellation") {
    return {
      query: `
        SELECT 
          RO.OrderNumber,
          CONVERT(VARCHAR, RO.OrderDateTime, 103) AS OrderDateTime,
          CAST(RO.TotalLineItemAmount AS DECIMAL(18,2)) AS TotalLineItemAmount,
          CAST(RO.TotalTax AS DECIMAL(18,2)) AS TotalTax,
          org.GstType,
          CAST(RO.TotalDiscountAmount AS DECIMAL(18,2)) AS TotalDiscountAmount,
          CAST(RO.ServiceCharge AS DECIMAL(18,2)) AS ServiceCharge,
          CAST(RO.TotalAmount AS DECIMAL(18,2)) AS TotalAmount,
          RO.StatusCode,
          CAST(RO.RoundedBy AS DECIMAL(18,2)) AS RoundedBy,
          RI.BillNumber,
          ISNULL(RO.Description, '') AS Description
        FROM dbo.RestaurantOrder RO
        LEFT JOIN dbo.RestaurantInvoice RI ON RO.OrderId = RI.OrderId
        INNER JOIN dbo.vw_Organization org ON RO.BusinessUnitId = org.BusinessUnitId
        WHERE RO.StatusCode IN (0, 2, 3, 6, 7)
          AND RO.OrderDateTime >= '${finalFrom} 00:00:00'
          AND RO.OrderDateTime <= '${finalTo} 23:59:59'
        ORDER BY RO.OrderNumber, RO.OrderDateTime
      `
    };
  }

  // ✅ Cancel Order - Detail Report (All Possible Cancel/Void Status Codes)
  if (dayEnd === "CancellationDetail") {
    return {
      query: `
        SELECT 
          ROD.Quantity,
          ROD.PricePerUnit,
          DM.Name AS DishName,
          RO.StatusCode,
          RI.BillNumber,
          CAST(ROD.TotalDetailLineAmount AS DECIMAL(18,2)) AS TotalDetailLineAmount,
          CAST(RO.TotalAmount AS DECIMAL(18,2)) AS TotalAmount,
          RO.OrderNumber,
          CAST(RO.TotalDiscountAmount AS DECIMAL(18,2)) AS TotalDiscountAmount,
          CAST(RO.TotalTax AS DECIMAL(18,2)) AS TotalTax,
          CAST(RO.ServiceCharge AS DECIMAL(18,2)) AS ServiceCharge,
          ISNULL(ROD.Remarks, '') AS Remarks,
          ROD.SeqNo,
          CONVERT(VARCHAR, ROD.OrderDateTime, 103) AS OrderDateTime,
          CONVERT(VARCHAR, RO.OrderDateTime, 103) AS OrderHeaderDateTime
        FROM dbo.RestaurantOrder RO
        INNER JOIN dbo.RestaurantOrderDetail ROD ON RO.OrderId = ROD.OrderId
        LEFT JOIN dbo.RestaurantInvoice RI ON RO.OrderId = RI.OrderId
        INNER JOIN dbo.DishMaster DM ON ROD.DishId = DM.DishId
        WHERE RO.StatusCode IN (0, 2, 3, 6, 7)
          AND RO.OrderDateTime >= '${finalFrom} 00:00:00'
          AND RO.OrderDateTime <= '${finalTo} 23:59:59'
        ORDER BY RO.OrderNumber, RI.BillNumber, ROD.SeqNo
      `
    };
  }

  // ✅ Sales By Meal Period Report - WITH BAD DATA FILTER
  if (bySales === "MealPeriod") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
          CASE 
            WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 6 AND 10 THEN 'BreakFast'
            WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 11 AND 16 THEN 'Lunch'
            WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 17 AND 22 THEN 'Dinner'
            ELSE 'Supper'
          END AS MealPeriod,
          COUNT(DISTINCT ri.OrderId) AS Bills,
          SUM(ISNULL(ro.Persons, 0)) AS Pax,
          SUM(CAST(ri.TotalLineItemAmount AS DECIMAL(25,2))) AS [Sub Total],
          SUM(CAST(ISNULL(ri.TotalDiscountAmount,0) AS DECIMAL(25,2))) AS Discount,
          SUM(CAST(ISNULL(ro.ServiceCharge,0) AS DECIMAL(25,2))) AS SVC,
          SUM(CAST(ISNULL(ri.TotalTax,0) AS DECIMAL(25,2))) AS [Tax Total],
          SUM(CAST(ri.TotalLineItemAmount - ISNULL(ri.TotalDiscountAmount,0) + ISNULL(ro.ServiceCharge,0) + ISNULL(ri.TotalTax,0) + ISNULL(ri.RoundedBy,0) AS DECIMAL(25,2))) AS [Total Sales]
        FROM dbo.RestaurantOrder ro
        INNER JOIN dbo.RestaurantInvoice ri ON ro.OrderId = ri.OrderId
        WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
          AND ri.TotalLineItemAmount < 1000000
          AND ri.TotalLineItemAmount > 0
        GROUP BY 
          CONVERT(VARCHAR, ri.InvoiceDate, 103),
          CASE 
            WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 6 AND 10 THEN 'BreakFast'
            WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 11 AND 16 THEN 'Lunch'
            WHEN DATEPART(HOUR, ri.InvoiceDate) BETWEEN 17 AND 22 THEN 'Dinner'
            ELSE 'Supper'
          END
        ORDER BY MIN(ri.InvoiceDate), MealPeriod
      `
    };
  }

  // ✅ Sales Analysis Report - COMPLETE with all summary details
  if (bySales === "Analysis") {
    return {
      query: `
        SELECT 
          'MAIN' AS DataType,
          CONVERT(VARCHAR, ri.InvoiceDate, 103) AS Date,
          COUNT(DISTINCT ri.OrderId) AS [No of Bills],
          SUM(ISNULL(ro.Persons, 0)) AS Pax,
          SUM(CAST(ri.TotalLineItemAmount AS DECIMAL(25,2))) AS [Total Sales],
          SUM(CAST(ISNULL(ri.TotalDiscountAmount,0) AS DECIMAL(25,2))) AS Discount,
          SUM(CAST(ISNULL(ro.ServiceCharge,0) AS DECIMAL(25,2))) AS [Service Charge],
          SUM(CAST(ISNULL(ri.TotalTax,0) AS DECIMAL(25,2))) AS Tax,
          SUM(CAST(ri.TotalAmount AS DECIMAL(25,2))) AS [Net Total],
          SUM(CAST(ISNULL(ri.Tips,0) AS DECIMAL(25,2))) AS Tips,
          SUM(CAST(ISNULL(ri.RoundedBy,0) AS DECIMAL(25,2))) AS [Round Off],
          SUM(CASE WHEN d.isGuestMeal = 1 THEN ri.TotalAmount ELSE 0 END) AS FOC,
          SUM(CASE WHEN pm.PayMode = 'CASH' THEN pd.Amount ELSE 0 END) AS Cash,
          SUM(CASE WHEN pm.PayMode IN ('VISA', 'MASTERCARD', 'AMEX', 'DINERS', 'JCB') THEN pd.Amount ELSE 0 END) AS Cards,
          SUM(CASE WHEN pm.PayMode = 'CHEQUE' THEN pd.Amount ELSE 0 END) AS Cheque,
          SUM(CASE WHEN pm.PayMode = 'LEDGER' THEN pd.Amount ELSE 0 END) AS Ledger,
          SUM(CASE WHEN pm.PayMode = 'NEKTAR' THEN pd.Amount ELSE 0 END) AS Nektar,
          SUM(CASE WHEN pm.PayMode = 'VOUCHER' THEN pd.Amount ELSE 0 END) AS Voucher,
          SUM(CASE WHEN pm.PayMode = 'ENTERTAINMENT' THEN pd.Amount ELSE 0 END) AS ENT,
          SUM(pd.Amount) AS TotalCollection
        FROM dbo.RestaurantInvoice ri
        LEFT JOIN dbo.RestaurantOrder ro ON ri.OrderId = ro.OrderId
        LEFT JOIN dbo.Discount d ON ro.DiscountId = d.DiscountId
        LEFT JOIN dbo.PaymentDetail pd ON ri.RestaurantBillId = pd.RestaurantBillId
        LEFT JOIN dbo.Paymode pm ON pd.Paymode = pm.Position
        WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        GROUP BY CONVERT(VARCHAR, ri.InvoiceDate, 103)
        
        UNION ALL
        
        SELECT 
          'CATEGORY' AS DataType,
          ISNULL(dgm.DishGroupName, 'Others') AS Date,
          COUNT(DISTINCT ri.OrderId) AS [No of Bills],
          0 AS Pax,
          SUM(rd.TotalDetailLineAmount) AS [Total Sales],
          0 AS Discount,
          0 AS [Service Charge],
          0 AS Tax,
          0 AS [Net Total],
          0 AS Tips,
          0 AS [Round Off],
          0 AS FOC,
          0 AS Cash,
          0 AS Cards,
          0 AS Cheque,
          0 AS Ledger,
          0 AS Nektar,
          0 AS Voucher,
          0 AS ENT,
          0 AS TotalCollection
        FROM dbo.RestaurantOrderDetail rd
        INNER JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
        LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
        INNER JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
        WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        GROUP BY dgm.DishGroupName
        
        UNION ALL
        
        SELECT 
          'AVERAGES' AS DataType,
          'TOTALS' AS Date,
          COUNT(DISTINCT ri.OrderId) AS [No of Bills],
          SUM(ISNULL(ro.Persons, 0)) AS Pax,
          SUM(CAST(ri.TotalLineItemAmount AS DECIMAL(25,2))) AS [Total Sales],
          SUM(CAST(ISNULL(ri.TotalDiscountAmount,0) AS DECIMAL(25,2))) AS Discount,
          SUM(CAST(ISNULL(ro.ServiceCharge,0) AS DECIMAL(25,2))) AS [Service Charge],
          SUM(CAST(ISNULL(ri.TotalTax,0) AS DECIMAL(25,2))) AS Tax,
          SUM(CAST(ri.TotalAmount AS DECIMAL(25,2))) AS [Net Total],
          SUM(CAST(ISNULL(ri.Tips,0) AS DECIMAL(25,2))) AS Tips,
          SUM(CAST(ISNULL(ri.RoundedBy,0) AS DECIMAL(25,2))) AS [Round Off],
          0 AS FOC,
          0 AS Cash,
          0 AS Cards,
          0 AS Cheque,
          0 AS Ledger,
          0 AS Nektar,
          0 AS Voucher,
          0 AS ENT,
          0 AS TotalCollection
        FROM dbo.RestaurantInvoice ri
        LEFT JOIN dbo.RestaurantOrder ro ON ri.OrderId = ro.OrderId
        WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00'
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        ORDER BY DataType, Date
      `
    };
  }

  // ✅ Default - Daywise report
  return {
    query: `
      SELECT 
        CONVERT(VARCHAR, ri.OrderDateTime, 103) AS Date,
        COUNT(DISTINCT ri.OrderId) AS [No of Bills],
        CAST(SUM(rd.Quantity) AS DECIMAL(10,2)) AS Qty,
        CAST(SUM(rd.TotalDetailLineAmount) AS DECIMAL(10,2)) AS Amount
      FROM dbo.RestaurantInvoice ri
      JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
      WHERE 1=1
        ${dateFilter('ri.OrderDateTime')}
      GROUP BY CONVERT(VARCHAR, ri.OrderDateTime, 103)
      ORDER BY MIN(ri.OrderDateTime)
    `
  };
};

// ✅ GST REPORT API - Get JSON data
router.get("/gst-report-data", async (req, res) => {
  try {
    const pool = await poolPromise; 
    let { fromDate, toDate } = req.query;

    console.log("=== GST REPORT CALLED ===");
    console.log("From Date:", fromDate);
    console.log("To Date:", toDate);

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "fromDate and toDate are required" });
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    endDate.setDate(endDate.getDate() + 1);
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    const query = `
      SELECT 
        CONVERT(VARCHAR, InvoiceDate, 103) AS Date,
        ROUND(SUM(TotalLineItemAmount), 2) AS TotalSales,
        ROUND(SUM(TotalTax), 2) AS TotalTax
      FROM dbo.RestaurantInvoice
      WHERE CAST(InvoiceDate AS DATE) >= CAST('${formattedStartDate}' AS DATE)
        AND CAST(InvoiceDate AS DATE) < CAST('${formattedEndDate}' AS DATE)
      GROUP BY CONVERT(VARCHAR, InvoiceDate, 103)
      ORDER BY MIN(InvoiceDate)
    `;

    console.log("Query:", query);

    const result = await pool.request().query(query);
    const rawData = result.recordset || [];

    console.log("Data found:", rawData.length);

    const grandTotalSales = rawData.reduce((sum, row) => sum + (row.TotalSales || 0), 0);
    const grandTotalTax = rawData.reduce((sum, row) => sum + (row.TotalTax || 0), 0);

    res.json({
      sales: rawData,
      columns: ['Date', 'Total Sales', 'Total Tax'],
      grandTotal: grandTotalSales
    });

  } catch (err) {
    console.error("GST Report Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GST PDF DOWNLOAD
router.get("/download-gst-pdf", async (req, res) => {
  try {
    const pool = await poolPromise;
    const company = await getCompanyDetails();
    const logoBase64 = await getLogoBase64();
    
    // ✅ CUSTOM COMPLEX PDF FOR SALES SUMMARY
    if (req.query.bySales === "Summary") {
      const { fromDate, toDate } = req.query;
      const finalFrom = fromDate || '';
      const finalTo = toDate || '';
      
      const companyName = company.Name || "UNIPRO SOFTWARES SG PTE LTD";
      const addressParts = [];
      if (company.Address1_Line1) addressParts.push(company.Address1_Line1);
      if (company.Address1_Line2) addressParts.push(company.Address1_Line2);
      if (company.Address1_City) addressParts.push(company.Address1_City);
      if (company.Address1_State) addressParts.push(company.Address1_State);
      let fullAddress = addressParts.join(", ");
      if (company.Address1_PostalCode) {
        fullAddress = fullAddress ? `${fullAddress} ${company.Address1_PostalCode}` : company.Address1_PostalCode;
      }
      
      // 1. Category Sales
      const catRes = await pool.request().query(`
        SELECT ISNULL(dgm.DishGroupName, 'Others') AS CategoryName, SUM(rd.TotalDetailLineAmount) AS Amount
        FROM dbo.RestaurantOrderDetail rd
        JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
        LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
        JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
        WHERE ri.InvoiceDate >= '${finalFrom} 00:00:00' AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        GROUP BY dgm.DishGroupName
      `);
      const categories = catRes.recordset || [];
      const catTotal = categories.reduce((s, r) => s + (r.Amount || 0), 0);
      
      // 2. Payments / Paymode Sales
      const payRes = await pool.request().query(`
        SELECT 
          SUM(ItemSales) AS ItemSales,
          SUM(FOC) AS FOC,
          SUM(Discount) AS Discount,
          SUM(SVC) AS SVC,
          SUM(Tax) AS Tax,
          SUM(Tips) AS Tips,
          SUM(Rnd) AS RndAdjmt,
          SUM(ENT) AS ENT,
          SUM(Cash) AS Cash,
          SUM(Visa) AS Visa,
          SUM(Master) AS Master,
          SUM(Amex) AS Amex,
          SUM(Diners) AS Diners,
          SUM(JCB) AS JCB,
          SUM(Nets) AS Nets,
          SUM(Others) AS Others,
          SUM([Total(Cards)]) AS TotalCards,
          SUM(CHEQUE) AS Cheque,
          SUM(Ledger) AS Ledger,
          SUM(Cashless) AS Cashless,
          SUM(Voucher) AS Voucher,
          SUM(NEKTAR) AS Nektar,
          SUM(Totcollect) AS Totcollect
        FROM vw_Paymodesales
        WHERE InvoiceDate >= '${finalFrom} 00:00:00' AND InvoiceDate <= '${finalTo} 23:59:59'
      `);
      const p = payRes.recordset[0] || {};
      
      // 3. Averages & FOC
      const avgRes = await pool.request().query(`
        SELECT 
          COUNT(DISTINCT OrderId) AS TotalCover,
          SUM(ISNULL(Persons, 0)) AS TotalPAX
        FROM dbo.RestaurantOrder
        WHERE OrderDateTime >= '${finalFrom} 00:00:00' AND OrderDateTime < '${finalTo} 23:59:59'
      `);
      const a = avgRes.recordset[0] || {};
      
      const totalCover = a.TotalCover || 0;
      const totalPax = a.TotalPAX || 0;
      const totalSales = p.ItemSales || 0;
      const avgCover = totalCover > 0 ? (totalSales / totalCover) : 0;
      const avgPax = totalPax > 0 ? (totalSales / totalPax) : 0;
      const netSales = (p.ItemSales || 0) + (p.RndAdjmt || 0);

      const formatCurrency = (val) => {
        if (!val) return "0.00";
        return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      const html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Sales Summary</title>
        <style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; font-size: 11px; padding: 15px; }
  .header { font-weight: bold; margin-bottom: 15px; text-align: center; }
  .header .company { font-size: 14px; }
  .header .title { font-size: 12px; margin-top: 8px; }
  .divider { border-top: 1px dashed #000; margin: 10px 0; }
  .grid-container { display: table; width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 8px 0; }
  .grid-col { display: table-cell; vertical-align: top; padding: 5px; }
  .grid-title { font-weight: bold; margin-bottom: 8px; font-size: 11px; }
  .data-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10px; }
  .data-row.bold { font-weight: bold; }
  .data-row.border-top { border-top: 1px dashed #000; padding-top: 4px; }
  .data-row.border-bottom { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 6px; }
  .box-container { border: 1px solid #000; padding: 6px; margin-bottom: 10px; }
</style>
      </head>
      <body>
        <div class="header">
          <div class="company">${companyName}</div>
          <div>${fullAddress}</div>
          <div class="title">Sales Summary</div>
          <div>As on ${finalFrom} to ${finalTo}</div>
        </div>
        <div class="divider"></div>
        
        <div class="grid-container" style="margin-bottom: 15px;">
          <div class="grid-col" style="border-right: 1px solid #000;">
            <div class="grid-title">Item Sales</div>
            <div style="min-height: 150px;">
              ${categories.map(c => `<div class="data-row"><span>${c.CategoryName}</span><span>${formatCurrency(c.Amount)}</span></div>`).join('')}
            </div>
            <div class="data-row bold border-top" style="justify-content: flex-end;">
              <span>${formatCurrency(catTotal)}</span>
            </div>
          </div>
          
          <div class="grid-col" style="border-right: 1px solid #000;">
            <div class="grid-title">Item Sales</div>
            <div class="data-row"><span>ItemSales</span><span>${formatCurrency(p.ItemSales)}</span></div>
            <div class="data-row"><span>ItemDisc</span><span>${formatCurrency(p.Discount)}</span></div>
            <div class="data-row"><span>BillDisc</span><span>$0.00</span></div>
            <div class="data-row"><span>RndAdjmt</span><span>${p.RndAdjmt < 0 ? '-' : ''}${formatCurrency(Math.abs(p.RndAdjmt))}</span></div>
            <div class="data-row bold border-top border-bottom"><span>Sales</span><span>${formatCurrency(netSales)}</span></div>
            <div class="data-row"><span>SVC 10%</span><span>${formatCurrency(p.SVC)}</span></div>
            <div class="data-row"><span>GST</span><span>${formatCurrency(p.Tax)}</span></div>
            <div class="data-row"><span>Tips</span><span>${formatCurrency(p.Tips)}</span></div>
          </div>
          
          <div class="grid-col">
            <div class="grid-title border-bottom">Sales Collections(Cards)</div>
            <div class="data-row bold"><span>Total</span><span>${formatCurrency(p.TotalCards)}</span></div>
            <div style="margin-top:20px;"></div>
            <div class="grid-title border-bottom">Sales Collection (All)</div>
            <div class="data-row"><span>CARD</span><span>${formatCurrency(p.TotalCards)}</span></div>
            <div class="data-row"><span>CASH</span><span>${formatCurrency(p.Cash)}</span></div>
            <div class="data-row"><span>CHEQUE</span><span>${formatCurrency(p.Cheque)}</span></div>
            <div class="data-row"><span>LEDGER</span><span>${formatCurrency(p.Ledger)}</span></div>
            <div class="data-row"><span>NEKTAR</span><span>${formatCurrency(p.Nektar)}</span></div>
            <div class="data-row"><span>VOUCHER</span><span>${formatCurrency(p.Voucher)}</span></div>
            <div class="data-row"><span>ENT</span><span>${formatCurrency(p.ENT)}</span></div>
            <div class="data-row bold border-top border-bottom"><span>Total</span><span>${formatCurrency(p.Totcollect)}</span></div>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="grid-container">
          <div class="grid-col" style="border-right: 1px solid #000;">
            <div class="grid-title">FOC</div>
            <div style="min-height: 50px;"></div>
            <div class="data-row bold border-top"><span>Grand Total:</span><span>${formatCurrency(p.FOC)}</span></div>
          </div>
          
          <div class="grid-col" style="border-right: 1px solid #000;">
            <div class="grid-title">Sales Avg</div>
            <div class="data-row"><span>Total Cover</span><span>${totalCover}</span></div>
            <div class="data-row bold" style="margin-bottom: 10px;"><span>Avg/Cover</span><span>${formatCurrency(avgCover)}</span></div>
            <div class="data-row"><span>Total PAX</span><span>${totalPax}</span></div>
            <div class="data-row bold"><span>Avg/PAX</span><span>${formatCurrency(avgPax)}</span></div>
          </div>
          
          <div class="grid-col">
            <div class="grid-title border-bottom">Cheque/Ledger/Voucher/Credit/NEKTAR</div>
            <div class="data-row"><span>Cheque</span><span>${formatCurrency(p.Cheque)}</span></div>
            <div class="data-row bold border-top border-bottom"><span>Total</span><span>${formatCurrency(p.Cheque)}</span></div>
            <div class="data-row" style="margin-top:10px;"><span>Ledger</span><span>${formatCurrency(p.Ledger)}</span></div>
            <div class="data-row bold border-top border-bottom"><span>Total</span><span>${formatCurrency(p.Ledger)}</span></div>
            <div class="data-row" style="margin-top:10px;"><span>NEKTAR</span><span>${formatCurrency(p.Nektar)}</span></div>
            <div class="data-row bold border-top border-bottom"><span>Total</span><span>${formatCurrency(p.Nektar)}</span></div>
            <div class="data-row" style="margin-top:10px;"><span>Voucher</span><span>${formatCurrency(p.Voucher)}</span></div>
            <div class="data-row bold border-top border-bottom"><span>Total</span><span>${formatCurrency(p.Voucher)}</span></div>
          </div>
        </div>
        
        <div class="divider"></div>
      </body>
      </html>`;

      const pdfOptions = { format: 'A4', orientation: 'portrait', border: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }, zoomFactor: "0.85" };
      
      pdf.create(html, pdfOptions).toStream((err, stream) => {
        if (err) return res.status(500).send(err.message);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_summary.pdf"');
        stream.pipe(res);
      });
      return;
    }

    let { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).send("fromDate and toDate are required");
    }

    const toDateObj = new Date(toDate);
    const nextDay = new Date(toDateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    const toDateNextDay = nextDay.toISOString().split('T')[0];

    const query = `
      SELECT 
        CONVERT(VARCHAR, InvoiceDate, 103) AS Date,
        ROUND(SUM(TotalLineItemAmount), 2) AS TotalSales,
        ROUND(SUM(TotalTax), 2) AS TotalTax
      FROM dbo.RestaurantInvoice
      WHERE InvoiceDate >= '${fromDate}'
        AND InvoiceDate < '${toDateNextDay}'
      GROUP BY CONVERT(VARCHAR, InvoiceDate, 103)
      ORDER BY MIN(InvoiceDate)
    `;

    const result = await pool.request().query(query);
    const rawData = result.recordset || [];

    if (rawData.length === 0) {
      return res.status(404).send("No data found for the selected criteria");
    }

    const currentDate = new Date().toLocaleDateString('en-GB');
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const currentDateTime = `${currentDate}, ${currentTime}`;

    const grandTotalSales = rawData.reduce((sum, row) => sum + (row.TotalSales || 0), 0);
    const grandTotalTax = rawData.reduce((sum, row) => sum + (row.TotalTax || 0), 0);

    const addressParts = [];
    if (company.Address1_Line1) addressParts.push(company.Address1_Line1);
    if (company.Address1_Line2) addressParts.push(company.Address1_Line2);
    if (company.Address1_City) addressParts.push(company.Address1_City);
    if (company.Address1_State) addressParts.push(company.Address1_State);
    let fullAddress = addressParts.join(", ");
    if (company.Address1_PostalCode) {
      fullAddress = fullAddress ? `${fullAddress} ${company.Address1_PostalCode}` : company.Address1_PostalCode;
    }

    const companyName = company.Name || "AL-HAZIMA RESTAURANT PTE LTD";
    const defaultAddress = "No 4, Cheong Chin Nam Road, SINGAPORE 599729";

    const formatCurrency = (value) => {
      if (value === undefined || value === null) return '0.00';
      return value.toLocaleString('en-SG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>GST Report</title>
      <<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Cambria', 'Times New Roman', serif; font-size: 11px; color: #333; background: white; padding: 15px; }
  .header-table { width: 100%; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #1a3c5a; }
  .header-table td { border: none; padding: 0; }
  .logo-cell { width: 100px; text-align: left; vertical-align: middle; }
  .logo-cell img { max-height: 50px; max-width: 80px; object-fit: contain; }
  .company-cell { text-align: center; vertical-align: middle; }
  .company-name { font-size: 14px; font-weight: 800; color: #1a3c5a; text-transform: uppercase; }
  .company-address { font-size: 10px; color: #555; margin-top: 4px; }
  .spacer-cell { width: 100px; }
  .report-title { text-align: center; font-size: 14px; font-weight: 800; color: #1a3c5a; margin: 10px 0 5px; text-transform: uppercase; }
  .report-subtitle { text-align: center; font-size: 10px; color: #555; margin-bottom: 15px; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }
  .data-table th { background-color: #1a3c5a; color: white; padding: 8px 10px; text-align: center; border: 1px solid #2a4c6a; font-weight: 600; }
  .data-table td { border: 1px solid #e0e0e0; padding: 6px 10px; }
  .data-table td:first-child { text-align: left; }
  .data-table td:not(:first-child) { text-align: right; }
  .data-table tr:nth-child(even) { background-color: #f9f9f9; }
  .grand-total-row td { background-color: #eef2f8; font-weight: 700; border-top: 2px solid #1a3c5a; }
</style>
    </head>
    <body>
      <table class="header-table">
        <tr><td class="logo-cell">${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo">` : ''}</td>
        <td class="company-cell"><div class="company-name">${companyName}</div><div class="company-address">${fullAddress || defaultAddress}</div></td>
        <td class="spacer-cell"></td>
      </table>
      <div class="report-title">GST REPORT</div>
      <div class="report-subtitle">As on ${fromDate} to ${toDate}</div>
      
      <table class="data-table">
        <thead>
          <tr><th>DATE</th><th>TOTAL SALES (S$)</th><th>TOTAL TAX (S$)</th></tr>
        </thead>
        <tbody>
          ${rawData.map(row => `
            <tr>
              <td>${row.Date || '-'}</td>
              <td>${formatCurrency(row.TotalSales)}</td>
              <td>${formatCurrency(row.TotalTax)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr class="grand-total-row">
            <td style="text-align: right;"><strong>TOTAL</strong></td>
            <td style="text-align: right;"><strong>${formatCurrency(grandTotalSales)}</strong></td>
            <td style="text-align: right;"><strong>${formatCurrency(grandTotalTax)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>`;

    const pdfOptions = {
      format: 'A4',
      orientation: 'portrait',
      zoomFactor: "0.85",
      border: {
        top: '0.8cm',
        right: '0.5cm',
        bottom: '1.2cm',
        left: '0.5cm'
      },
      footer: {
  height: "12mm",
  contents: {
    default: `
      <div style="border-top: 1px solid #eee; padding-top: 5px; font-family: 'Cambria', 'Times New Roman', serif;">
        <div style="text-align: center; font-size: 9px; color: #888; margin-bottom: 3px;">*** System Generated Report ***</div>
        <div style="text-align: center; font-size: 9px; color: #aaa;">Powered by Unipro</div>
      </div>
    `
  }
},
      timeout: 300000,
      printBackground: true
    };
    
    pdf.create(html, pdfOptions).toStream((err, stream) => {
      if (err) return res.status(500).send(err.message);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="gst_report.pdf"');
      stream.pipe(res);
    });
  } catch (err) {
    console.error("GST PDF Error:", err);
    res.status(500).send(err.message);
  }
});

// ✅ API for table data
router.get("/salesreport", async (req, res) => {
  try {
    let { fromDate, toDate } = req.query;

    if (fromDate && toDate && fromDate > toDate) {
      [fromDate, toDate] = [toDate, fromDate];
    }

    const pool = await poolPromise;
    const config = getReportQuery({
      orderSales: req.query.orderSales,
      dayEnd: req.query.dayEnd,
      bySales: req.query.bySales,
      byItem: req.query.byItem,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      category: req.query.category,
      dishGroup: req.query.dishGroup,
      reportType: req.query.reportType
    });
    const result = await pool.request().query(config.query);

    if (req.query.bySales === "BusinessType") {
      console.log("=== BusinessType Raw Data Sample ===");
      console.log("First row:", result.recordset[0]);
      console.log("SubTotal value:", result.recordset[0]?.SubTotal);
      console.log("ServiceCharge value:", result.recordset[0]?.ServiceCharge);
      console.log("NetTotal value:", result.recordset[0]?.NetTotal);
      console.log("Data type of SubTotal:", typeof result.recordset[0]?.SubTotal);
    }

    // ✅ FIXED: Process BusinessType report to insert Day Total rows
    if (req.query.bySales === "BusinessType" && result.recordset && result.recordset.length > 0) {
      const processed = [];
      let currentDate = null;
      let daySubTotal = 0;
      let dayDiscount = 0;
      let dayServiceCharge = 0;
      let dayTax = 0;
      let dayNetTotal = 0;

      result.recordset.forEach((row) => {
        const rowDate = row.Date;
        const subTotal = parseFloat(row.SubTotal) || 0;
        const discount = parseFloat(row.Discount) || 0;
        const svc = parseFloat(row.ServiceCharge) || 0;
        const tax = parseFloat(row.Tax) || 0;
        const netTotal = parseFloat(row.NetTotal) || 0;

        if (currentDate !== rowDate) {
          if (currentDate !== null) {
            processed.push({
              Date: currentDate,
              Type: "Day Total",
              SubTotal: daySubTotal,
              Discount: dayDiscount,
              ServiceCharge: dayServiceCharge,
              Tax: dayTax,
              NetTotal: dayNetTotal,
              isTotalRow: true
            });
          }
          currentDate = rowDate;
          daySubTotal = 0;
          dayDiscount = 0;
          dayServiceCharge = 0;
          dayTax = 0;
          dayNetTotal = 0;
        }

        processed.push({
          ...row,
          isTotalRow: false
        });

        daySubTotal += subTotal;
        dayDiscount += discount;
        dayServiceCharge += svc;
        dayTax += tax;
        dayNetTotal += netTotal;
      });

      if (currentDate !== null) {
        processed.push({
          Date: currentDate,
          Type: "Day Total",
          SubTotal: daySubTotal,
          Discount: dayDiscount,
          ServiceCharge: dayServiceCharge,
          Tax: dayTax,
          NetTotal: dayNetTotal,
          isTotalRow: true
        });
      }
      result.recordset = processed;
    }

    // Process Guest Meal report to insert Day Total rows
    if (req.query.reportType === "GuestMeal" && result.recordset && result.recordset.length > 0) {
      const processed = [];
      let currentDate = null;
      let dayItemAmount = 0;
      let dayDiscount = 0;
      let dayServiceCharge = 0;
      let dayTotalTax = 0;
      let dayTotalAmount = 0;

      result.recordset.forEach((row) => {
        const rowDate = row.InvoiceDate;
        const itemAmount = parseFloat(row.ItemAmount) || 0;
        const discount = parseFloat(row.discountAmount) || 0;
        const svc = parseFloat(row.ServiceCharge) || 0;
        const tax = parseFloat(row.TotalTax) || 0;
        const totalAmount = parseFloat(row.TotalAmount) || 0;

        if (currentDate !== rowDate) {
          if (currentDate !== null) {
            processed.push({
              InvoiceDate: currentDate,
              BillNumber: "Day Total",
              ItemAmount: dayItemAmount,
              Discount: dayDiscount,
              ServiceCharge: dayServiceCharge,
              TotalTax: dayTotalTax,
              TotalAmount: dayTotalAmount,
              Description: "",
              isTotalRow: true
            });
          }
          currentDate = rowDate;
          dayItemAmount = 0;
          dayDiscount = 0;
          dayServiceCharge = 0;
          dayTotalTax = 0;
          dayTotalAmount = 0;
        }

        processed.push({
          ...row,
          isTotalRow: false
        });

        dayItemAmount += itemAmount;
        dayDiscount += discount;
        dayServiceCharge += svc;
        dayTotalTax += tax;
        dayTotalAmount += totalAmount;
      });

      if (currentDate !== null) {
        processed.push({
          InvoiceDate: currentDate,
          BillNumber: "Day Total",
          ItemAmount: dayItemAmount,
          Discount: dayDiscount,
          ServiceCharge: dayServiceCharge,
          TotalTax: dayTotalTax,
          TotalAmount: dayTotalAmount,
          Description: "",
          isTotalRow: true
        });
      }
      result.recordset = processed;
    }

    let grandTotal = null;
    if (req.query.orderSales === "Hourly") {
      grandTotal = result.recordset.reduce((sum, row) => sum + (row.Amount || 0), 0);
    }
    if (req.query.bySales === "Journal") {
      grandTotal = result.recordset.reduce((sum, row) => sum + (row.SubTotal || 0), 0);
    }
    if (req.query.dayEnd === "Journal") {
      grandTotal = result.recordset.reduce((sum, row) => sum + (row.SubTotal || 0), 0);
    }
    if (req.query.dayEnd === "JournalSummary") {
      grandTotal = result.recordset.reduce((sum, row) => sum + (row['Net Total'] || 0), 0);
    }
    if (req.query.dayEnd === "Transaction") {
      grandTotal = result.recordset.reduce((sum, row) => sum + (row.Amount || 0), 0);
    }
    if (req.query.reportType === "GuestMeal") {
      grandTotal = result.recordset.reduce((sum, row) => {
        if (row.isTotalRow) return sum;
        return sum + (row.TotalAmount || 0);
      }, 0);
    }

    const columns = result.recordset.length > 0 
      ? Object.keys(result.recordset[0]).filter(col => col !== 'isTotalRow') 
      : [];

    return res.json({
      sales: result.recordset,
      columns: columns,
      grandTotal: grandTotal
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ API for company info
router.get("/company-info", async (req, res) => {
  try {
    const company = await getCompanyDetails();
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API for Categories
router.get("/categories", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        CategoryId,
        CategoryName
      FROM dbo.CategoryMaster 
      WHERE CategoryName IS NOT NULL AND CategoryName != ''
        AND isActive = 1
      ORDER BY SortCode, CategoryName
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Categories error:", err);
    res.status(500).json([]);
  }
});

// ✅ API for Dish Groups - FIXED (using actual table)
router.get("/dishgroups", async (req, res) => {
  try {
    const { categoryId } = req.query;
    const pool = await poolPromise;

    let query = `
      SELECT DISTINCT 
        dgm.DishGroupId,
        dgm.DishGroupName
      FROM dbo.DishGroupMaster dgm
      WHERE dgm.DishGroupName IS NOT NULL 
        AND dgm.DishGroupName != ''
        AND dgm.isActive = 1
    `;

    if (categoryId && categoryId !== "" && categoryId !== "undefined" && categoryId !== "null") {
      query += ` AND dgm.CategoryId = '${categoryId}'`;
    }

    query += ` ORDER BY dgm.DishGroupName`;

    const result = await pool.request().query(query);
    res.json(result.recordset.map(r => r.DishGroupName));

  } catch (err) {
    console.error("DishGroups error:", err);
    res.status(500).json([]);
  }
});

// ✅ API: Category LOV with all details
router.get("/category-lov", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        CategoryId,
        CategoryCode,
        CategoryName,
        ShortName,
        BackColor,
        ForeColor,
        isKitchenPrint,
        isDiscountAllowed,
        isServiceCharge,
        isActive
      FROM dbo.CategoryMaster
      WHERE isActive = 1
      ORDER BY SortCode, CategoryName
    `);
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    console.error("Category LOV error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ API: DishGroup LOV with all details
router.get("/dishgroup-lov", async (req, res) => {
  try {
    const { categoryId } = req.query;
    const pool = await poolPromise;

    let query = `
      SELECT 
        dgm.DishGroupId,
        dgm.DishGroupCode,
        dgm.DishGroupName,
        dgm.ShortName,
        dgm.SortCode,
        dgm.KitchenSortCode,
        dgm.BackColor,
        dgm.ForeColor,
        dgm.isActive,
        cm.CategoryId,
        cm.CategoryName
      FROM dbo.DishGroupMaster dgm
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE dgm.isActive = 1
    `;

    if (categoryId && categoryId !== "") {
      query += ` AND dgm.CategoryId = '${categoryId}'`;
    }

    query += ` ORDER BY dgm.KitchenSortCode, dgm.DishGroupName`;

    const result = await pool.request().query(query);
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    console.error("DishGroup LOV error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ DIRECT PDF DOWNLOAD using html-pdf
router.get("/download-pdf", async (req, res) => {
  try {
    console.log("=== DOWNLOAD PDF CALLED ===");
    console.log("byItem:", req.query.byItem);
    console.log("orderSales:", req.query.orderSales);
    console.log("dayEnd:", req.query.dayEnd);
    console.log("bySales:", req.query.bySales);
    console.log("reportType:", req.query.reportType);
    
    const pool = await poolPromise;
    const config = getReportQuery(req.query);
    const company = await getCompanyDetails();
    const logoBase64 = await getLogoBase64();
    const result = await pool.request().query(config.query);
    const rawData = result.recordset || [];

    if (rawData.length === 0) {
      return res.status(404).send("No data found for the selected criteria");
    }

    const fromDate = req.query.fromDate || "";
    const toDate = req.query.toDate || "";
    const currentDate = new Date().toLocaleDateString('en-GB');
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const currentDateTime = `${currentDate}, ${currentTime}`;

    let reportTitle = "SALES REPORT";
    let displayColumns = [];
    let mappedData = [];

    // ✅ Guest Meal Report Handler
    if (req.query.reportType === "GuestMeal") {
      reportTitle = "GUEST MEAL SUMMARY REPORT";
      displayColumns = ['InvoiceDate', 'BillNumber', 'ItemAmount', 'Discount', 'ServiceCharge', 'TotalTax', 'TotalAmount', 'Description'];
      
      const processedData = [];
      let currentDateVal = null;
      let dayItemAmount = 0;
      let dayDiscount = 0;
      let dayServiceCharge = 0;
      let dayTotalTax = 0;
      let dayTotalAmount = 0;
      
      rawData.forEach((row) => {
        const rowDate = row.InvoiceDate;
        
        if (currentDateVal !== rowDate && currentDateVal !== null) {
          processedData.push({
            InvoiceDate: currentDateVal,
            BillNumber: "Day Total",
            ItemAmount: dayItemAmount,
            Discount: dayDiscount,
            ServiceCharge: dayServiceCharge,
            TotalTax: dayTotalTax,
            TotalAmount: dayTotalAmount,
            Description: "",
            isTotalRow: true
          });
          dayItemAmount = 0;
          dayDiscount = 0;
          dayServiceCharge = 0;
          dayTotalTax = 0;
          dayTotalAmount = 0;
        }
        
        currentDateVal = rowDate;
        
        processedData.push({
          InvoiceDate: row.InvoiceDate,
          BillNumber: row.BillNumber,
          ItemAmount: Number(row.ItemAmount) || 0,
          Discount: Number(row.discountAmount) || 0,
          ServiceCharge: Number(row.ServiceCharge) || 0,
          TotalTax: Number(row.TotalTax) || 0,
          TotalAmount: Number(row.TotalAmount) || 0,
          Description: row.Description || '',
          isTotalRow: false
        });
        
        dayItemAmount += Number(row.ItemAmount) || 0;
        dayDiscount += Number(row.discountAmount) || 0;
        dayServiceCharge += Number(row.ServiceCharge) || 0;
        dayTotalTax += Number(row.TotalTax) || 0;
        dayTotalAmount += Number(row.TotalAmount) || 0;
      });
      
      if (currentDateVal !== null) {
        processedData.push({
          InvoiceDate: currentDateVal,
          BillNumber: "Day Total",
          ItemAmount: dayItemAmount,
          Discount: dayDiscount,
          ServiceCharge: dayServiceCharge,
          TotalTax: dayTotalTax,
          TotalAmount: dayTotalAmount,
          Description: "",
          isTotalRow: true
        });
      }
      
      mappedData = processedData;
    }
    else if (req.query.dayEnd === "RefundSummary") {
      reportTitle = "REFUND SUMMARY REPORT";
      displayColumns = ['BillNumber', 'DishCode', 'DishName', 'Quantity', 'Amount'];
      mappedData = rawData.map(row => ({
        BillNumber: row.BillNumber,
        DishCode: row.DishCode,
        DishName: row.DishName,
        Quantity: Number(row.Quantity || 0).toFixed(2),
        Amount: Number(row.Amount || 0).toFixed(2),
        TotalAmount: row.TotalAmount,
        TotalDiscountAmount: row.TotalDiscountAmount,
        ServiceCharge: row.ServiceCharge,
        Tips: row.Tips,
        Tax: row.Tax,
        OrderId: row.OrderId
      }));
    }
    else if (req.query.dayEnd === "DiscountSummary") {
      reportTitle = "DISCOUNT SALES SUMMARY REPORT";
      displayColumns = ['InvoiceDate', 'InvoiceNo', 'SubTotal', 'Discount', 'ServiceCharge', 'TotalTax', 'TotalAmount'];
      mappedData = rawData.map(row => ({
        InvoiceDate: row.InvoiceDate || '',
        InvoiceNo: row.InvoiceNo || '',
        SubTotal: Number(row.SubTotal || 0),
        Discount: Number(row.Discount || 0),
        ServiceCharge: Number(row.ServiceCharge || 0),
        TotalTax: Number(row.TotalTax || 0),
        TotalAmount: Number(row.TotalAmount || 0),
      }));
    }
    else if (req.query.dayEnd === "TopNItems") {
      reportTitle = "TOP N ITEMS REPORT (ORDER BY QUANTITY)";
      displayColumns = ['DishCode', 'DishName', 'Quantity', 'Amount'];
      mappedData = rawData.map(row => ({
        DishCode: row.DishCode || '',
        DishName: row.DishName || '',
        Quantity: Number(row.Quantity || 0).toFixed(2),
        Amount: Number(row.Amount || 0).toFixed(2)
      }));
    }
    else if (req.query.orderSales === "Hourly") {
      reportTitle = "HOURLY SALES REPORT";
      displayColumns = ['Hour', 'Amount'];
      mappedData = rawData.map(row => ({ Hour: row.Hour, Amount: row.Amount }));
    }
    else if (req.query.orderSales === "Daywise") {
      reportTitle = "DAYWISE SALES REPORT";
      displayColumns = ['Date', 'No of Bills', 'Qty', 'Amount'];
      mappedData = rawData;
    }
    else if (req.query.orderSales === "Itemwise") {
      reportTitle = "ITEMWISE SALES REPORT";
      displayColumns = ['Item', 'Qty', 'Amount'];
      mappedData = rawData;
    }
    else if (req.query.orderSales === "Group") {
      reportTitle = "GROUP WISE SALES REPORT";
      displayColumns = ['Group', 'Qty', 'Amount'];
      mappedData = rawData;
    }
    else if (req.query.byItem === "Month") {
      reportTitle = "MONTH WISE SALES REPORT";
      displayColumns = ['Date', 'DishName', 'Amount', 'DishGroup', 'Category'];
      
      const formatDate = (dateValue) => {
        if (!dateValue) return '-';
        try {
          const d = new Date(dateValue);
          if (isNaN(d.getTime())) return dateValue;
          return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        } catch(e) {
          return dateValue;
        }
      };
      
      mappedData = rawData.map(row => ({
        Date: formatDate(row.OrderDateTime),
        DishName: row.DishName || '-',
        Amount: Number(row.TotalDetailLineAmount) || 0,
        DishGroup: row.DishGroupName || '-',
        Category: row.CategoryName || '-'
      }));
    }
    else if (req.query.byItem === "Qty") {
      reportTitle = "QUANTITY WISE SALES REPORT";
      displayColumns = ['Year', 'Month', 'Item', 'DishGroup', 'Amount'];
      mappedData = rawData.map(row => ({
        Year: row.Year || '-',
        Month: row.Month || '-',
        Item: row.Item || '-',
        DishGroup: row.DishGroupName || '-',
        Amount: Number(row.Amount) || 0
      }));
    }
    else if (req.query.byItem === "Category") {
      reportTitle = "CATEGORY SALES REPORT";
      displayColumns = ['CategoryName', 'Sold', 'ItemSales', 'ItemDisc', 'Foc', 'Revenue70', 'Revenue30', 'Revenue'];
      mappedData = rawData.map(row => ({
        CategoryName: row.CategoryName || '-',
        Sold: Number(row.Sold || 0),
        ItemSales: Number(row.ItemSales || 0),
        ItemDisc: Number(row.ItemDisc || 0),
        Foc: Number(row.Foc || 0),
        Revenue70: Number(row.Revenue70 || 0),
        Revenue30: Number(row.Revenue30 || 0),
        Revenue: Number(row.Revenue || 0)
      }));
    }
    else if (req.query.bySales === "Summary") {
      reportTitle = "SALES SUMMARY REPORT";
      displayColumns = ['Date', 'Sales', 'FOC', 'Disc', 'SVC', 'Tax 7%', 'Tips', 'Rnd', 'ENT', 'Cash', 'Master', 'Visa'];
      mappedData = rawData;
    }
    else if (req.query.bySales === "Analysis") {
      reportTitle = "SALES ANALYSIS REPORT";
      
      const mainData = rawData.filter(row => row.DataType === 'MAIN');
      const categoryData = rawData.filter(row => row.DataType === 'CATEGORY');
      const averagesData = rawData.filter(row => row.DataType === 'AVERAGES');
      
      const combinedData = [];
      
      if (categoryData.length > 0) {
        categoryData.forEach(cat => {
          combinedData.push({
            DataType: 'CATEGORY',
            Date: cat.Date,
            'Total Sales': Number(cat['Total Sales'] || 0)
          });
        });
        const catTotal = categoryData.reduce((sum, cat) => sum + (cat['Total Sales'] || 0), 0);
        combinedData.push({
          DataType: 'CATEGORY_TOTAL',
          Date: 'Total',
          'Total Sales': catTotal
        });
        combinedData.push({ DataType: 'SPACER' });
      }
      
      mainData.forEach(row => {
        combinedData.push({
          DataType: 'MAIN',
          Date: row.Date || '-',
          'No of Bills': row['No of Bills'] || 0,
          'Pax': row.Pax || 0,
          'Total Sales': Number(row['Total Sales'] || 0),
          'Discount': Number(row.Discount || 0),
          'Service Charge': Number(row['Service Charge'] || 0),
          'Tax': Number(row.Tax || 0),
          'Net Total': Number(row['Net Total'] || 0),
          'Tips': Number(row.Tips || 0),
          'Round Off': Number(row['Round Off'] || 0),
          'FOC': Number(row.FOC || 0),
          'Cash': Number(row.Cash || 0),
          'Cards': Number(row.Cards || 0),
          'Cheque': Number(row.Cheque || 0),
          'Ledger': Number(row.Ledger || 0),
          'Nektar': Number(row.Nektar || 0),
          'Voucher': Number(row.Voucher || 0),
          'ENT': Number(row.ENT || 0),
          'Total Collection': Number(row.TotalCollection || 0)
        });
      });
      
      if (averagesData.length > 0) {
        const avg = averagesData[0];
        const totalSales = avg['Total Sales'] || 0;
        const totalBills = avg['No of Bills'] || 0;
        const totalPax = avg.Pax || 0;
        const avgPerBill = totalBills > 0 ? totalSales / totalBills : 0;
        const avgPerPax = totalPax > 0 ? totalSales / totalPax : 0;
        
        combinedData.push({ DataType: 'AVERAGES_HEADER', Date: 'SALES AVERAGES' });
        combinedData.push({ DataType: 'AVERAGES', Date: 'Total Cover', 'Value': totalBills });
        combinedData.push({ DataType: 'AVERAGES', Date: 'Avg/Cover', 'Value': avgPerBill });
        combinedData.push({ DataType: 'AVERAGES', Date: 'Total PAX', 'Value': totalPax });
        combinedData.push({ DataType: 'AVERAGES', Date: 'Avg/PAX', 'Value': avgPerPax });
      }
      
      displayColumns = [
        'Date', 'No of Bills', 'Pax', 'Total Sales', 'Discount', 'Service Charge', 
        'Tax', 'Net Total', 'Tips', 'Round Off', 'FOC', 'Cash', 'Cards', 'Cheque', 
        'Ledger', 'Nektar', 'Voucher', 'ENT', 'Total Collection'
      ];
      mappedData = combinedData;
      
      console.log("Analysis Display Columns Count:", displayColumns.length);
    }
    else if (req.query.bySales === "BusinessType") {
      reportTitle = "Sales By Businesstype Report";
      displayColumns = ['Date', 'Type', 'SubTotal', 'Discount', 'ServiceCharge', 'Tax', 'NetTotal'];
      
      const processedData = [];
      let currentDateVal = null;
      let daySubTotal = 0;
      let dayDiscount = 0;
      let dayServiceCharge = 0;
      let dayTax = 0;
      let dayNetTotal = 0;
      
      rawData.forEach((row, index) => {
        const subTotal = typeof row.SubTotal === 'number' ? row.SubTotal : (parseFloat(row.SubTotal) || 0);
        const discount = typeof row.Discount === 'number' ? row.Discount : (parseFloat(row.Discount) || 0);
        const svc = typeof row.ServiceCharge === 'number' ? row.ServiceCharge : (parseFloat(row.ServiceCharge) || 0);
        const tax = typeof row.Tax === 'number' ? row.Tax : (parseFloat(row.Tax) || 0);
        const netTotal = typeof row.NetTotal === 'number' ? row.NetTotal : (parseFloat(row.NetTotal) || 0);
        
        const rowDate = row.Date;
        
        if (currentDateVal !== rowDate) {
          if (currentDateVal !== null) {
            processedData.push({
              Date: currentDateVal,
              Type: "Day Total",
              SubTotal: daySubTotal,
              Discount: dayDiscount,
              ServiceCharge: dayServiceCharge,
              Tax: dayTax,
              NetTotal: dayNetTotal,
              isTotalRow: true
            });
          }
          currentDateVal = rowDate;
          daySubTotal = 0;
          dayDiscount = 0;
          dayServiceCharge = 0;
          dayTax = 0;
          dayNetTotal = 0;
        }
        
        processedData.push({
          Date: row.Date,
          Type: row.Type,
          SubTotal: subTotal,
          Discount: discount,
          ServiceCharge: svc,
          Tax: tax,
          NetTotal: netTotal,
          isTotalRow: false
        });
        
        daySubTotal += subTotal;
        dayDiscount += discount;
        dayServiceCharge += svc;
        dayTax += tax;
        dayNetTotal += netTotal;
      });
      
      if (currentDateVal !== null) {
        processedData.push({
          Date: currentDateVal,
          Type: "Day Total",
          SubTotal: daySubTotal,
          Discount: dayDiscount,
          ServiceCharge: dayServiceCharge,
          Tax: dayTax,
          NetTotal: dayNetTotal,
          isTotalRow: true
        });
      }
      
      mappedData = processedData;
    }
    else if (req.query.bySales === "Journal") {
      reportTitle = "SALES JOURNAL REPORT";
      displayColumns = ['Date', 'SubTotal', 'Discount', 'Service Charge', 'Total Tax', 'Tips', 'TotalPax', 'GstType', 'Round Off'];
      mappedData = rawData;
    }
    else if (req.query.dayEnd === "TableChange") {
      reportTitle = "TABLE CHANGE REPORT";
      displayColumns = ['OrderDate', 'OrderNumber', 'SourceTable', 'NewTable', 'TotalAmount', 'ModifyUser', 'StatusCodeName'];
      mappedData = rawData;
    }
    else if (req.query.byItem === "DishGroup") {
      reportTitle = "DISH GROUP SALES REPORT";
      displayColumns = ['DishGroupname', 'CategoryName', 'Sold', 'ItemSales', 'ItemDisc', 'Foc', 'Revenue70', 'Revenue30', 'Revenue'];
      mappedData = rawData.map(row => ({
        DishGroupname: row.DishGroupname || row.DishGroupName || '-',
        CategoryName: row.CategoryName || '-',
        Sold: Number(row.Sold || 0),
        ItemSales: Number(row.ItemSales || 0),
        ItemDisc: Number(row.ItemDisc || 0),
        Foc: Number(row.Foc || 0),
        Revenue70: Number(row.Revenue70 || 0),
        Revenue30: Number(row.Revenue30 || 0),
        Revenue: Number(row.Revenue || 0)
      }));
    }
    else if (req.query.dayEnd === "Paymode") {
      reportTitle = "PAYMODE COLLECTION REPORT";

      const summaryRows = rawData.filter(r => r.ReportType === 'SUMMARY');
      const detailRows = rawData.filter(r => r.ReportType === 'DETAIL');
      const selectedViewMode = (req.query.viewMode || '').toLowerCase();

      displayColumns = ['Date', 'ReportType', 'PayMode', 'BillNumber', 'ReferenceNumber', 'Amount', 'Tips', 'PayAmount', 'ReturnAmt'];

      const paymodeRows = [];

      if (selectedViewMode !== 'detail') {
        summaryRows.forEach(row => paymodeRows.push({
          Date: row.Date || '',
          ReportType: 'SUMMARY',
          PayMode: row.PayMode || '',
          BillNumber: '',
          ReferenceNumber: '',
          Amount: Number(row.Amount || 0),
          Tips: Number(row.Tips || 0),
          PayAmount: Number(row.PayAmount || 0),
          ReturnAmt: Number(row.ReturnAmt || 0)
        }));
      }

      if (selectedViewMode !== 'summary') {
        detailRows.forEach(row => paymodeRows.push({
          Date: row.Date || '',
          ReportType: 'DETAIL',
          PayMode: row.PayMode || '',
          BillNumber: row.BillNumber || '',
          ReferenceNumber: row.ReferenceNumber || '',
          Amount: Number(row.Amount || 0),
          Tips: Number(row.Tips || 0),
          PayAmount: Number(row.PayAmount || 0),
          ReturnAmt: Number(row.ReturnAmt || 0)
        }));
      }

      mappedData = paymodeRows;
    }
    else if (req.query.dayEnd === "Terminal") {
      reportTitle = "TERMINAL SALES REPORT";
      
      const processedData = [];
      let currentDateVal = null;
      let dayTotal = 0;
      
      rawData.forEach((row) => {
        const rowDate = row.Date;
        const amount = parseFloat(row.Amount) || 0;
        
        if (currentDateVal !== rowDate) {
          if (currentDateVal !== null) {
            processedData.push({
              Date: " DAY TOTAL ",
              TerminalCode: "",
              Amount: dayTotal,
              isTotalRow: true
            });
          }
          currentDateVal = rowDate;
          dayTotal = 0;
        }
        
        processedData.push({
          Date: rowDate,
          TerminalCode: row.TerminalCode,
          Amount: amount,
          isTotalRow: false
        });
        
        dayTotal += amount;
      });
      
      if (currentDateVal !== null) {
        processedData.push({
          Date: " DAY TOTAL ",
          TerminalCode: "",
          Amount: dayTotal,
          isTotalRow: true
        });
      }
      
      displayColumns = ['Date', 'TerminalCode', 'Amount'];
      mappedData = processedData;
    }
    else if (req.query.dayEnd === "Transaction") {
      reportTitle = "TRANSACTION REPORT";
      displayColumns = ['TransactionMode', 'Amount'];
      mappedData = rawData.map(row => ({
        TransactionMode: row.TransactionMode,
        Amount: Number(row.Amount || 0)
      }));
    }
    else {
      displayColumns = Object.keys(rawData[0]);
      mappedData = rawData;
    }

    const addressParts = [];
    if (company.Address1_Line1) addressParts.push(company.Address1_Line1);
    if (company.Address1_Line2) addressParts.push(company.Address1_Line2);
    if (company.Address1_City) addressParts.push(company.Address1_City);
    if (company.Address1_State) addressParts.push(company.Address1_State);
    let fullAddress = addressParts.join(", ");
    if (company.Address1_PostalCode) {
      fullAddress = fullAddress ? `${fullAddress} - ${company.Address1_PostalCode}` : company.Address1_PostalCode;
    }

    const companyName = company.Name || "AL-HAZIMA RESTAURANT PTE LTD";
    const companyPhone = company.Address1_Telephone1 || "65130000";
    const defaultAddress = "No 4, Cheong Chin Nam Road, SINGAPORE - 599729";

    const textColumns = ['Month', 'Item', 'DishGroupName', 'CategoryName', 'GstType', 'Hour', 'Group', 'TransactionMode', 'Date', 'TerminalCode', 'DishName', 'OrderDateTime', 'TotalDetailLineAmount', 'Year', 'No of Bills', 'Qty', 'InvoiceDate', 'BillNumber', 'Description', 'Type'];
    const numericColumns = displayColumns.filter(col => !textColumns.includes(col));
    
    const grandTotals = [];
    for (let i = 0; i < numericColumns.length; i++) {
      const col = numericColumns[i];
      let sum = 0;
      for (let j = 0; j < mappedData.length; j++) {
        if (mappedData[j].isTotalRow) continue;
        const val = mappedData[j][col];
        if (typeof val === 'number') {
          sum += val;
        } else if (val && !isNaN(Number(val))) {
          sum += Number(val);
        }
      }
      grandTotals.push(sum.toFixed(2));
    }

    let tableRows = '';
    if (req.query.reportType === "GuestMeal") {
      mappedData.forEach(row => {
        if (row.isTotalRow) {
          tableRows += `
            <tr style="font-weight: bold; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; background-color: #f5f5f5;">
              <td style="text-align: left; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.InvoiceDate || '-'}</td>
              <td style="text-align: left; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>Day Total</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>${row.ItemAmount.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>${row.Discount.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>${row.ServiceCharge.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>${row.TotalTax.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>${row.TotalAmount.toFixed(2)}</strong></td>
              <td style="text-align: left; padding: 3px 5px; border: 1px solid #e0e0e0;">-</strong></td>
            </tr>
          `;
        } else {
          tableRows += `
            <tr>
              <td style="text-align: left; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.InvoiceDate || '-'}</td>
              <td style="text-align: left; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.BillNumber || '-'}</td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.ItemAmount.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.Discount.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.ServiceCharge.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.TotalTax.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.TotalAmount.toFixed(2)}</strong></td>
              <td style="text-align: left; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.Description || '-'}</td>
            </tr>
          `;
        }
      });
    } else if (req.query.bySales === "BusinessType") {
      let currentDateVal = null;
      mappedData.forEach(row => {
        if (row.isTotalRow) {
          tableRows += `
            <tr style="font-weight: bold; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; background-color: #ffffff;">
              <td style="text-align: left; padding: 3px 5px; border: 1px solid #e0e0e0;">&nbsp;</strong></td>
              <td style="text-align: left; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>Day Total</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>${row.SubTotal.toFixed(2)}</strong></strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>${row.Discount.toFixed(2)}</strong></strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>${row.ServiceCharge.toFixed(2)}</strong></strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>${row.Tax.toFixed(2)}</strong></strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;"><strong>${row.NetTotal.toFixed(2)}</strong></strong></td>
            </tr>
          `;
        } else {
          if (currentDateVal !== row.Date) {
            currentDateVal = row.Date;
            tableRows += `
              <tr style="background-color: #ffffff; font-weight: bold;">
               <td colspan="7" style="text-align: left; padding: 8px 12px; border: 1px solid #e0e0e0; font-size: 12px;">                <strong>Date: ${row.Date}</strong>
                </td>
              </tr>
            `;
          }
          tableRows += `
            <tr>
              <td style="text-align: left; padding: 3px 5px; border: 1px solid #e0e0e0;">&nbsp;</strong></td>
              <td style="text-align: left; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.Type || '-'}</td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.SubTotal.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.Discount.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.ServiceCharge.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.Tax.toFixed(2)}</strong></td>
              <td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0;">${row.NetTotal.toFixed(2)}</strong></td>
            </tr>
          `;
        }
      });
    } else if (req.query.bySales === "Analysis") {
      const totalColumns = displayColumns.length;
      const colWidths = [7, 4.5, 3.5, 5.5, 5, 5, 4.5, 5.5, 4, 4, 4, 5.5, 5.5, 5, 5, 5, 5, 4, 7.5];

      mappedData.forEach(row => {
        if (row.isItemRow) {
          const cells = displayColumns.map((col, i) => {
            const width = colWidths[i] || (100 / totalColumns);
            if (i === 0) return `<td style="text-align: left; padding: 2px 1px; border: 1px solid #e0e0e0; width: ${width}%;">${row.Date || '-'}</td>`;
            if (col === 'Total Sales') return `<td style="text-align: right; padding: 2px 1px; border: 1px solid #e0e0e0; width: ${width}%;">${(row['Total Sales'] || 0).toFixed(2)}</strong></td>`;
            return `<td style="text-align: right; padding: 2px 1px; border: 1px solid #e0e0e0; width: ${width}%;">-</strong></td>`;
          }).join('');
          tableRows += `<tr>${cells}</tr>`;
        } else if (row.isItemTotal) {
          const cells = displayColumns.map((col, i) => {
            const width = colWidths[i] || (100 / totalColumns);
            if (i === 0) return `<td style="text-align: left; padding: 2px 1px; border: 1px solid #e0e0e0; width: ${width}%;"><strong>${row.Date}</strong></strong></td>`;
            if (col === 'Total Sales') return `<td style="text-align: right; padding: 2px 1px; border: 1px solid #e0e0e0; width: ${width}%;"><strong>${(row['Total Sales'] || 0).toFixed(2)}</strong></strong></td>`;
            return `<td style="text-align: right; padding: 2px 1px; border: 1px solid #e0e0e0; width: ${width}%;">-</strong></td>`;
          }).join('');
          tableRows += `<tr style="font-weight: bold; background-color: #eef2f8;">${cells}</tr>`;
        } else if (row.isAveragesHeader) {
          tableRows += `<tr style="background-color: #1a3c5a;"><td colspan="${totalColumns}" style="text-align: center; color: white; font-weight: bold; padding: 4px;">${row.Date}</td></tr>`;
        } else if (row.isSpacer) {
          tableRows += `<tr><td colspan="${totalColumns}" style="padding: 2px;"></strong></td></tr>`;
        } else {
          tableRows += `<tr>`;
          for (let i = 0; i < displayColumns.length; i++) {
            const col = displayColumns[i];
            let val = row[col];
            const isNumber = typeof val === 'number';
            const alignment = i === 0 ? 'left' : 'right';
            const width = colWidths[i] || (100 / totalColumns);
            let displayVal = '-';
            if (isNumber) {
              displayVal = val.toFixed(2);
            } else if (val !== undefined && val !== null && val !== '') {
              displayVal = val;
            }
            tableRows += `<td style="text-align: ${alignment}; padding: 2px 1px; border: 1px solid #e0e0e0; width: ${width}%;">${displayVal}</strong></td>`;
          }
          tableRows += `</tr>`;
        }
      });
    } else {
      mappedData.forEach(row => {
        tableRows += `
          <tr>
            ${displayColumns.map((col, idx) => {
              let val = row[col];
              const isNumber = typeof val === 'number';
              const alignment = idx === 0 ? 'left' : 'right';
              return `<td style="text-align: ${alignment}; padding: 3px 5px; border: 1px solid #e0e0e0;">${isNumber ? val.toFixed(2) : (val || '-')}</strong></td>`;
            }).join("")}
          </tr>
        `;
      });
    }

    const isAnalysisReport = req.query.bySales === 'Analysis';
    let html = '';

    if (isAnalysisReport) {
      const allCols19 = displayColumns;
      const headerAbbr = {
        'No of Bills': 'Bills',
        'Total Sales': 'Tot Sales',
        'Service Charge': 'Svc Chg',
        'Net Total': 'Net Tot',
        'Round Off': 'Rnd Off',
        'Total Collection': 'Tot Coll'
      };
      
      const colW19 = [8, 4.5, 3.5, 5.5, 5, 5, 4.5, 5.5, 4, 4, 4, 5.5, 5.5, 5, 5, 5, 5, 4, 7];
      let singleTableRows = '';
      let lastDataType = '';
      
      mappedData.forEach(row => {
        if (row.DataType === 'CATEGORY' && lastDataType !== 'CATEGORY') {
          singleTableRows += `<tr style="background:#1a3c5a;">
            <td colspan="19" style="text-align:center;color:white;font-weight:bold;padding:6px;font-size:9px;">
              🍽️ ITEM SALES
            </td>
          </tr>`;
          lastDataType = 'CATEGORY';
        }
        
        if (row.DataType === 'MAIN' && lastDataType !== 'MAIN') {
          singleTableRows += `<tr style="background:#1a3c5a;">
            <td colspan="19" style="text-align:center;color:white;font-weight:bold;padding:6px;font-size:9px;">
              📊 DAILY SALES ANALYSIS
            </td>
          </tr>`;
          lastDataType = 'MAIN';
        }
        
        if (row.DataType === 'AVERAGES_HEADER') {
          singleTableRows += `<tr style="background:#2a5a8a;">
            <td colspan="19" style="text-align:center;color:white;font-weight:bold;padding:5px;font-size:8px;">
              📈 ${row.Date}
            </td>
          </tr>`;
          lastDataType = 'AVERAGES';
        }
        else if (row.DataType === 'SPACER') {
          singleTableRows += `<tr><td colspan="19" style="padding:3px;border:none;"></strong></td></tr>`;
        }
        else if (row.DataType === 'CATEGORY') {
          const cells19 = allCols19.map((col, i) => {
            const w = colW19[i];
            if (i === 0) return `<td style="text-align:left;padding:3px 2px;border:1px solid #ddd;width:${w}%;">${row.Date || '-'}</td>`;
            if (col === 'Total Sales') return `<td style="text-align:right;padding:3px 2px;border:1px solid #ddd;width:${w}%;">${(row['Total Sales'] || 0).toFixed(2)}</strong></td>`;
            return `<td style="text-align:right;padding:3px 2px;border:1px solid #ddd;width:${w}%;">-</strong></td>`;
          }).join('');
          singleTableRows += `<tr style="background:#f9f9f9;">${cells19}</tr>`;
        }
        else if (row.DataType === 'CATEGORY_TOTAL') {
          const cells19 = allCols19.map((col, i) => {
            const w = colW19[i];
            if (i === 0) return `<td style="text-align:left;padding:3px 2px;border:1px solid #ddd;width:${w}%;font-weight:bold;background:#eef2f8;"><strong>${row.Date}</strong></strong></td>`;
            if (col === 'Total Sales') return `<td style="text-align:right;padding:3px 2px;border:1px solid #ddd;width:${w}%;font-weight:bold;background:#eef2f8;"><strong>${(row['Total Sales'] || 0).toFixed(2)}</strong></strong></td>`;
            return `<td style="text-align:right;padding:3px 2px;border:1px solid #ddd;width:${w}%;background:#eef2f8;">-</strong></td>`;
          }).join('');
          singleTableRows += `<tr style="font-weight:bold;background:#eef2f8;">${cells19}<tr>`;
        }
        else if (row.DataType === 'AVERAGES') {
          const cells19 = allCols19.map((col, i) => {
            const w = colW19[i];
            if (i === 0) return `<td style="text-align:left;padding:3px 2px;border:1px solid #ddd;width:${w}%;background:#f5f5f5;">${row.Date}</td>`;
            if (col === 'Total Sales' && row.Value !== undefined) return `<td style="text-align:right;padding:3px 2px;border:1px solid #ddd;width:${w}%;background:#f5f5f5;">${typeof row.Value === 'number' ? row.Value.toFixed(2) : row.Value}</strong></td>`;
            if (col === 'No of Bills' && row.Value !== undefined) return `<td style="text-align:right;padding:3px 2px;border:1px solid #ddd;width:${w}%;background:#f5f5f5;">${typeof row.Value === 'number' ? row.Value.toFixed(2) : row.Value}</strong></td>`;
            return `<td style="text-align:right;padding:3px 2px;border:1px solid #ddd;width:${w}%;background:#f5f5f5;">-</strong></td>`;
          }).join('');
          singleTableRows += `<tr style="background:#f5f5f5;">${cells19}</tr>`;
        }
        else if (row.DataType === 'MAIN') {
          const cells19 = allCols19.map((col, i) => {
            const w = colW19[i];
            const align = i === 0 ? 'left' : 'right';
            let val = row[col];
            let display = '-';
            if (typeof val === 'number') display = val.toFixed(2);
            else if (val !== undefined && val !== null && val !== '') display = val;
            return `<td style="text-align:${align};padding:3px 2px;border:1px solid #ddd;width:${w}%;">${display}</strong></td>`;
          }).join('');
          singleTableRows += `<tr>${cells19}</tr>`;
        }
      });
      
      const numericColsAnalysis = allCols19.filter(col => 
        !['Date', 'No of Bills', 'Pax', 'Tips', 'Round Off', 'FOC'].includes(col)
      );
      const grandTotalsAnalysis = numericColsAnalysis.map(col => {
        const sum = mappedData.filter(r => r.DataType === 'MAIN').reduce((acc, row) => acc + (Number(row[col]) || 0), 0);
        return sum.toFixed(2);
      });
      
      let gtRowCells = `<td style="text-align:left;font-weight:bold;padding:5px 3px;border:1px solid #ccc;background:#eef2f8;"><strong>GRAND TOTAL</strong></strong></td>`;
      for (let i = 1; i < allCols19.length; i++) {
        const colName = allCols19[i];
        const idx = numericColsAnalysis.indexOf(colName);
        if (idx !== -1) {
          gtRowCells += `<td style="text-align:right;font-weight:bold;padding:5px 3px;border:1px solid #ccc;background:#eef2f8;">${grandTotalsAnalysis[idx] || '0.00'}</strong></td>`;
        } else {
          gtRowCells += `<td style="text-align:right;padding:5px 3px;border:1px solid #ccc;background:#eef2f8;">&nbsp;</strong></td>`;
        }
      }
      
      html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Cambria', 'Times New Roman', serif; font-size: 11px; color: #333; background: white; padding: 15px; }
  .header-table { width: 100%; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #1a3c5a; }
  .header-table td { border: none; padding: 0; }
  .logo-cell { width: 100px; text-align: left; vertical-align: middle; }
  .logo-cell img { max-height: 50px; max-width: 80px; object-fit: contain; }
  .company-cell { text-align: center; vertical-align: middle; }
  .company-name { font-size: 14px; font-weight: 800; color: #1a3c5a; text-transform: uppercase; }
  .company-address { font-size: 10px; color: #555; margin-top: 4px; }
  .company-phone { font-size: 10px; color: #666; margin-top: 2px; }
  .spacer-cell { width: 100px; }
  .report-title { text-align: center; font-size: 14px; font-weight: 800; color: #1a3c5a; margin: 10px 0 5px; text-transform: uppercase; }
  .report-subtitle { text-align: center; font-size: 10px; color: #555; margin-bottom: 15px; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }
  .data-table th { background-color: #1a3c5a; color: white; padding: 8px 10px; text-align: center; border: 1px solid #2a4c6a; font-weight: 600; }
  .data-table td { border: 1px solid #e0e0e0; padding: 6px 10px; }
  .data-table tr:nth-child(even) { background-color: #f9f9f9; }
  .total-row td { background-color: #eef2f8; font-weight: 700; border-top: 2px solid #1a3c5a; }
  @media print {
    body { padding: 0; margin: 0; }
    .data-table th { background-color: #1a3c5a !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .data-table tr:nth-child(even) { background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .total-row td { background-color: #eef2f8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
 </head>
      <body>
        <div class="header-wrap">
          <div class="logo-box">${logoBase64 ? `<img src="${logoBase64}" alt="Logo">` : '<div style="width:60px"></div>'}</div>
          <div class="company-center">
            <div class="company-name">${companyName}</div>
            <div class="company-sub">${fullAddress || defaultAddress}</div>
            <div class="company-sub">Phone: ${companyPhone}</div>
          </div>
          <div style="width:60px;"></div>
        </div>
        <div class="report-title">${reportTitle}</div>
        <div class="report-period">Period: ${fromDate} to ${toDate} &nbsp;|&nbsp; Printed: ${currentDateTime}</div>

        <table class="data-table">
          <colgroup>
            ${colW19.map(w => `<col style="width:${w}%">`).join('')}
          </colgroup>
          <thead>
            <tr>
              ${allCols19.map(col => `<th>${headerAbbr[col] || col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${singleTableRows}
            <tr class="total-row">${gtRowCells}</tr>
          </tbody>
        </table>
      </body>
      </html>`;
    } else {
      html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cambria', 'Times New Roman', serif; font-size: 9px; color: #333; background: white; padding: 12px; width: 100%; }
          .header-table { width: 100%; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 2px solid #1a3c5a; }
          .header-table td { border: none; padding: 0; }
          .logo-cell { width: 80px; text-align: left; vertical-align: middle; }
          .logo-cell img { max-height: 45px; max-width: 65px; object-fit: contain; }
          .company-cell { text-align: center; vertical-align: middle; }
          .company-name { font-size: 13px; font-weight: 800; color: #1a3c5a; text-transform: uppercase; }
          .company-address { font-size: 8px; color: #555; margin-top: 2px; }
          .company-phone { font-size: 8px; color: #666; margin-top: 1px; }
          .spacer-cell { width: 80px; }
          .report-title { text-align: center; font-size: 12px; font-weight: 800; color: #1a3c5a; margin: 4px 0 2px; text-transform: uppercase; }
          .report-subtitle { text-align: center; font-size: 8px; color: #555; margin-bottom: 10px; }
          .data-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 5px; table-layout: fixed; }
          .data-table th { 
            background-color: #1a3c5a; 
            color: white; 
            padding: 5px 4px; 
            text-align: center; 
            border: 1px solid #2a4c6a; 
            font-weight: 600;
            word-wrap: break-word;
            white-space: normal;
            line-height: 1.2;
          }
          .data-table td { 
            border: 1px solid #e0e0e0; 
            padding: 4px 4px; 
            word-wrap: break-word;
            white-space: normal;
            overflow: hidden;
            line-height: 1.2;
          }
          .data-table tr:nth-child(even) { background-color: #f9f9f9; }
          .total-row td { 
            background-color: #eef2f8; 
            font-weight: 700; 
            border-top: 2px solid #1a3c5a; 
          }
          @media print {
            body { padding: 0; margin: 0; }
            .data-table th { background-color: #1a3c5a !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .data-table tr:nth-child(even) { background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .total-row td { background-color: #eef2f8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr><td class="logo-cell">${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo">` : ''}</td>
          <td class="company-cell"><div class="company-name">${companyName}</div><div class="company-address">${fullAddress || defaultAddress}</div><div class="company-phone">Phone: ${companyPhone}</div></td>
          <td class="spacer-cell">${logoBase64 ? '' : ''}</td>
        </table>
        <div class="report-title">${reportTitle}</div>
        <div class="report-subtitle">Period: ${fromDate} to ${toDate} | Printed: ${currentDateTime}</div>
        
        <table class="data-table">
          <thead>
            <tr>${displayColumns.map(col => {
              const abbr = {
                'No of Bills': 'No of Bills',
                'Total Sales': 'Total Sales',
                'Service Charge': 'Svc Chg',
                'Net Total': 'Net Total',
                'Round Off': 'Rnd Off',
                'Total Collection': 'Tot Coll',
                'ServiceCharge': 'Svc Chg'
              };
              return `<th>${(col === 'ServiceCharge' ? 'Service Charge' : col)}</th>`;
            }).join('')}</tr>
          </thead>
          <tbody>
            ${tableRows}
            ${(() => {
              const label = (req.query.bySales === "BusinessType" || req.query.reportType === "GuestMeal") ? "Grand Total" : "TOTAL";
              let totalCells = `<td style="text-align: right; font-weight: bold; padding: 8px 12px; border: 1px solid #e0e0e0; background-color: #eef2f8;"><strong>${label}</strong></td>`;   for (let i = 1; i < displayColumns.length; i++) {
                const colName = displayColumns[i];
                const isNumeric = numericColumns.includes(colName);
                if (isNumeric) {
                  const idx = numericColumns.indexOf(colName);
                  const totalValue = grandTotals[idx] || '0.00';
                  totalCells += `<td style="text-align: right; font-weight: bold; padding: 3px 5px; border: 1px solid #e0e0e0; background-color: #eef2f8;">${totalValue}</strong></td>`;
                } else {
                  totalCells += `<td style="text-align: right; padding: 3px 5px; border: 1px solid #e0e0e0; background-color: #eef2f8;">&nbsp;</strong></td>`;
                }
              }
              return `<tr class="total-row">${totalCells}</tr>`;
            })()}
          </tbody>
        </table>
      </body>
      </html>`;
    }
    
    const pdfOptions = {
      format: 'A4',
      orientation: 'portrait',
      zoomFactor: "0.85",
      border: isAnalysisReport
        ? { top: '4mm', right: '2mm', bottom: '4mm', left: '2mm' }
        : { top: '0.4cm', right: '0.4cm', bottom: '0.8cm', left: '0.4cm' },
      footer: {
        height: "6mm",
        contents: {
          default: `
            <div style="border-top: 1px solid #eee; padding-top: 2px; font-family: 'Cambria', 'Times New Roman', serif;">
              <div style="text-align: center; font-size: 6px; color: #888; margin-bottom: 1px;">*** System Generated Report ***</div>
              <div style="text-align: center; font-size: 6px; color: #aaa;">Powered by Unipro</div>
            </div>
          `
        }
      },
      printBackground: true
    };

    pdf.create(html, pdfOptions).toStream((err, stream) => {
      if (err) {
        console.error("PDF Generation Error:", err);
        return res.status(500).send(err.message);
      }
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
      stream.pipe(res);
    });

  } catch (err) {
    console.error("PDF Generation ERROR:", err);
    res.status(500).send(err.message);
  }
});

// Keep old endpoints for compatibility
router.get("/sales-pdf", async (req, res) => {
  res.redirect(`/api/salesreport/download-pdf?${new URLSearchParams(req.query).toString()}`);
});

router.get("/paymode-html", async (req, res) => {
  res.redirect(`/api/salesreport/download-pdf?${new URLSearchParams(req.query).toString()}&dayEnd=Paymode`);
});

router.get("/terminal-html", async (req, res) => {
  res.redirect(`/api/salesreport/download-pdf?${new URLSearchParams(req.query).toString()}&dayEnd=Terminal`);
});

module.exports = router;