const axios = require("axios");

async function checkDayEndEndpoints() {
  try {
    const fromDate = '2026-06-22';
    const toDate = '2026-06-23';

    const testCases = [
      { name: "DiscountSummary", params: { dayEnd: "DiscountSummary", fromDate, toDate } },
      { name: "RefundSummary", params: { dayEnd: "RefundSummary", fromDate, toDate } },
      { name: "Cancellation", params: { dayEnd: "Cancellation", fromDate, toDate } },
      { name: "CancellationDetail", params: { dayEnd: "CancellationDetail", fromDate, toDate } },
    ];

    console.log("=== VERIFYING DAYEND API RESPONSES FROM LOCAL SERVER ===");
    for (const tc of testCases) {
      const res = await axios.get("http://localhost:5000/api/salesreport/salesreport", { params: tc.params });
      const data = res.data;
      
      let sumAmount = 0;
      let sumQty = 0;

      if (data && data.sales) {
        data.sales.forEach(row => {
          if (row.isTotalRow) return;
          
          if (row.Qty !== undefined) sumQty += Number(row.Qty) || 0;
          if (row.Quantity !== undefined) sumQty += Number(row.Quantity) || 0;

          if (row.Amount !== undefined) sumAmount += Number(row.Amount) || 0;
          if (row.TotalAmount !== undefined) sumAmount += Number(row.TotalAmount) || 0;
          if (row.TotalDetailLineAmount !== undefined) sumAmount += Number(row.TotalDetailLineAmount) || 0;
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

checkDayEndEndpoints();
