const axios = require("axios");

async function check() {
  try {
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

    console.log("=== VERIFYING API RESPONSES FROM LOCAL SERVER ===");
    for (const tc of testCases) {
      const res = await axios.get("http://localhost:5000/api/salesreport/salesreport", { params: tc.params });
      const data = res.data;
      
      let sumAmount = 0;
      let sumQty = 0;

      if (data && data.sales) {
        data.sales.forEach(row => {
          if (row.isTotalRow) return;
          
          // sum quantities
          if (row.Qty !== undefined) sumQty += Number(row.Qty) || 0;
          if (row.Quantity !== undefined) sumQty += Number(row.Quantity) || 0;
          if (row.Sold !== undefined) sumQty += Number(row.Sold) || 0;
          if (row.SoldQty !== undefined) sumQty += Number(row.SoldQty) || 0;

          // sum amounts
          if (row.Amount !== undefined) sumAmount += Number(row.Amount) || 0;
          if (row.ItemSales !== undefined) sumAmount += Number(row.ItemSales) || 0;
          if (row.NetSales !== undefined) sumAmount += Number(row.NetSales) || 0;
          if (row.Sales !== undefined) sumAmount += Number(row.Sales) || 0;
          if (row.SubTotal !== undefined) sumAmount += Number(row.SubTotal) || 0;
        });
      }

      console.log(`${tc.name.padEnd(25)}: Status=${res.status}, rows=${data.sales?.length || 0}, Qty=${sumQty.toFixed(2)}, Amount=${sumAmount.toFixed(2)}`);
    }

    process.exit(0);
  } catch (e) {
    console.error("Verification failed:", e.message);
    process.exit(1);
  }
}

check();
