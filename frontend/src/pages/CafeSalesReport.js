  import { API_BASE_URL } from "../config/config";
    import React, { useState, useEffect } from "react";
    import "./CafeSalesReport.css";

    const API_BASE = process.env.REACT_APP_API_URL || API_BASE_URL;
    const REPORT_BASE = `${API_BASE}/api/salesreport`;

    const CafeSalesReport = ({
      salesData = [],
      columns: initialColumns = ["Hour", "Amount"],
      sidebarOpen = false
    }) => {
      const today = new Date().toISOString().split("T")[0];
      const [fromDate, setFromDate] = useState(today);
      const [toDate, setToDate] = useState(today);
      const [columns, setColumns] = useState(initialColumns);
      const [orderSales, setOrderSales] = useState("Daywise");
      const [dayEnd, setDayEnd] = useState("");
      const [bySales, setBySales] = useState("");
      const [byItem, setByItem] = useState("");
      const [showChart, setShowChart] = useState(false);
      const [postDate, setPostDate] = useState(false);
      const [category, setCategory] = useState("");
      const [dishGroup, setDishGroup] = useState("");
      const [outputType, setOutputType] = useState("Screen");
      const [viewMode, setViewMode] = useState("");
      const [isSearched, setIsSearched] = useState(false);
      const [selectedCategoryId, setSelectedCategoryId] = useState("");
      const [selectedCategoryName, setSelectedCategoryName] = useState("");
      const [localData, setLocalData] = useState([]);
      const [grandTotal, setGrandTotal] = useState(0);
      const [companyInfo, setCompanyInfo] = useState(null);

      const [categoryList, setCategoryList] = useState([]);
      const [dishGroupList, setDishGroupList] = useState([]);
      const [showCategoryLOV, setShowCategoryLOV] = useState(false);
      const [showDishGroupLOV, setShowDishGroupLOV] = useState(false);

      const fetchCompanyInfo = async () => {
        try {
          const response = await fetch(`${REPORT_BASE}/company-info`);
          const data = await response.json();
          setCompanyInfo(data);
        } catch (error) {
          console.error("Error fetching company info:", error);
        }
      };

      React.useEffect(() => {
        fetchCompanyInfo();
        fetchCategories();
      }, []);

      // ✅ NEW: Auto-clear conflicting selections when byItem changes
      useEffect(() => {
        if (byItem !== "") {
          setOrderSales("");
          setDayEnd("");
          setBySales("");
        }
      }, [byItem]);

      // ✅ NEW: Auto-clear conflicting selections when orderSales changes
      useEffect(() => {
        if (orderSales !== "") {
          setByItem("");
          setBySales("");
        }
      }, [orderSales]);

      // ✅ NEW: Auto-clear conflicting selections when dayEnd changes
      useEffect(() => {
        if (dayEnd !== "") {
          setOrderSales("");
          setByItem("");
          setBySales("");
        }
      }, [dayEnd]);

      // ✅ NEW: Auto-clear when bySales changes
      useEffect(() => {
        if (bySales !== "") {
          setOrderSales("");
          setByItem("");
          setDayEnd("");
        }
      }, [bySales]);

      const fetchCategories = async () => {
        try {
          const response = await fetch(`${REPORT_BASE}/categories`);
          const data = await response.json();
          console.log("Categories API Response:", data);

          if (Array.isArray(data)) {
            setCategoryList(data);
          } else if (data.data && Array.isArray(data.data)) {
            setCategoryList(data.data);
          } else {
            setCategoryList([]);
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
          setCategoryList([]);
        }
      };

      const fetchDishGroups = async (categoryId = null) => {
        console.trace("fetchDishGroups called with:", categoryId);

        try {
          let url = `${REPORT_BASE}/dishgroups`;
          if (categoryId && categoryId !== "" && categoryId !== "undefined") {
            url += `?categoryId=${categoryId}`;
            console.log("Fetching FILTERED dish groups for category:", categoryId);
          } else {
            console.log("Fetching ALL dish groups");
          }
          console.log("URL:", url);

          const response = await fetch(url);
          const data = await response.json();

          if (Array.isArray(data)) {
            setDishGroupList(data);
            console.log("DishGroupList updated, count:", data.length);
          }
        } catch (error) {
          console.error("Error fetching dish groups:", error);
        }
      };

      useEffect(() => {
        console.log("=== dishGroupList CHANGED ===");
        console.log("New dishGroupList:", dishGroupList);
        console.log("Length:", dishGroupList.length);
      }, [dishGroupList]);

      useEffect(() => {
        if (selectedCategoryId) {
          fetchDishGroups(selectedCategoryId);
        }
      }, [selectedCategoryId]);

      const handleDownload = async () => {
        try {
          console.log("=== HANDLE DOWNLOAD CALLED ===");
          console.log("byItem:", byItem);
          console.log("orderSales:", orderSales);
          console.log("dayEnd:", dayEnd);
          console.log("category:", category);
          console.log("dishGroup:", dishGroup);

          let url = "";

          // ✅ Guest Meal Report - ADD THIS FIRST
          if (dayEnd === "GuestMeal") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&reportType=GuestMeal`;
            window.open(url, '_blank');
            return;
          }

          // ✅ GST Report
          if (dayEnd === "GST") {
            url = `${REPORT_BASE}/download-gst-pdf?fromDate=${fromDate}&toDate=${toDate}`;
            window.open(url, '_blank');
            return;
          }

      // ✅ Paymode Report
  if (dayEnd === "Paymode") {
    // Use download-pdf with dayEnd=Paymode (backend will handle pivoted format)
    url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&dayEnd=Paymode`;
    window.open(url, '_blank');
    return;
  }

          // ✅ Terminal Report
          if (dayEnd === "Terminal") {
            url = `${REPORT_BASE}/terminal-html?fromDate=${fromDate}&toDate=${toDate}`;
            window.open(url, '_blank');
            return;
          }

          // ✅ Transaction Report
          if (dayEnd === "Transaction") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&dayEnd=Transaction`;
            window.open(url, '_blank');
            return;
          }

          // ✅ Table Change Report
          if (dayEnd === "TableChange") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&dayEnd=TableChange`;
            window.open(url, '_blank');
            return;
          }
          if (dayEnd === "RefundSummary") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&dayEnd=RefundSummary`;
            window.open(url, '_blank');
            return;
          }
          if (dayEnd === "DiscountSummary") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&dayEnd=DiscountSummary`;
            window.open(url, '_blank');
            return;
          }
          if (dayEnd === "TopNItems") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&dayEnd=TopNItems`;
            window.open(url, '_blank');
            return;
          }


          // ✅ ADD CANCEL ORDER REPORT HERE
          if (dayEnd === "Cancellation") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&dayEnd=Cancellation`;
            window.open(url, '_blank');
            return;
          }


          // ✅ MONTH Report (By Item) - IMPORTANT
          if (byItem === "Month") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&byItem=Month`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
            console.log("Downloading MONTH Report:", url);
            window.open(url, '_blank');
            return;
          }

          // ✅ QTY Report (By Item) - IMPORTANT
          if (byItem === "Qty") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&byItem=Qty`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
            console.log("Downloading QTY Report:", url);
            window.open(url, '_blank');
            return;
          }

          // ✅ Category Sales Report (By Item)
          if (byItem === "Category") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&byItem=Category`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
            console.log("Downloading CATEGORY Sales Report:", url);
            window.open(url, '_blank');
            return;
          }

          // ✅ Dish Group Sales Report (By Item)
          if (byItem === "DishGroup") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&byItem=DishGroup`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
            console.log("Downloading DISH GROUP Sales Report:", url);
            window.open(url, '_blank');
            return;
          }

          // ✅ Dish Sales Report (By Item)
          if (byItem === "Dish") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&byItem=Dish`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
            console.log("Downloading DISH Sales Report:", url);
            window.open(url, '_blank');
            return;
          }

          // ✅ Summary Report (By Sales)
          if (bySales === "Summary") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&bySales=Summary`;
            window.open(url, '_blank');
            return;
          }

          // ✅ Business Type Report
          if (bySales === "BusinessType") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&bySales=BusinessType`;
            window.open(url, '_blank');
            return;
          }

          // ✅ Meal Period Report
          if (bySales === "MealPeriod") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&bySales=MealPeriod`;
            window.open(url, '_blank');
            return;
          }


          // ✅ Sales Analysis Report
          if (bySales === "Analysis") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&bySales=Analysis`;
            window.open(url, '_blank');
            return;
          }

          // ✅ Journal Report (By Sales) - ADD THIS
          if (bySales === "Journal") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&bySales=Journal`;
            window.open(url, '_blank');
            return;
          }

          // ✅ Order Sales Reports
          const selectedOrderSales = orderSales;
          if (selectedOrderSales === "Hourly" || selectedOrderSales === "Daywise" || selectedOrderSales === "Itemwise" || selectedOrderSales === "Group") {
            url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}&orderSales=${selectedOrderSales}`;
            if (selectedOrderSales === "Itemwise") {
              if (category) url += `&category=${encodeURIComponent(category)}`;
              if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
            }
            console.log("Downloading Order Sales Report:", url);
            window.open(url, '_blank');
            return;
          }

          // ✅ Default
          url = `${REPORT_BASE}/download-pdf?fromDate=${fromDate}&toDate=${toDate}`;
          window.open(url, '_blank');

        } catch (err) {
          console.error("Download error:", err);
          alert("Error opening report: " + err.message);
        }
      };

      const handleFind = async () => {
        if (!fromDate || !toDate) {
          alert("Please select both From Date and To Date");
          return;
        }

        const noSelectionMade = !orderSales && !dayEnd && !bySales && !byItem;
        if (noSelectionMade) {
          alert("Please select a report type (Order Sales / Day End / By Sales / By Item)");
          return;
        }

        setIsSearched(true);
        setLocalData([]);

        let url = `${REPORT_BASE}/salesreport?fromDate=${fromDate}&toDate=${toDate}`;

        // ✅ Guest Meal Report - ADD THIS FIRST
        if (dayEnd === "GuestMeal") {
          url += `&reportType=GuestMeal`;
          console.log("✅ Guest Meal Report Selected");
        }
        // ✅ IMPORTANT: Check byItem FIRST (Month & Qty)
        else if (byItem === "Month") {
          url += `&byItem=Month`;
          if (category) url += `&category=${encodeURIComponent(category)}`;
          if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
          console.log("✅ Month Report Selected");
        }
        else if (byItem === "Qty") {
          url += `&byItem=Qty`;
          if (category) url += `&category=${encodeURIComponent(category)}`;
          if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
          console.log("✅ Qty (Month) Report Selected");
        }
        // ✅ Category Sales
        else if (byItem === "Category") {
          url += `&byItem=Category`;
          if (category) url += `&category=${encodeURIComponent(category)}`;
          if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
          console.log("✅ Category Sales Report Selected");
        }

        // ✅ Dish Group Sales
        else if (byItem === "DishGroup") {
          url += `&byItem=DishGroup`;
          if (category) url += `&category=${encodeURIComponent(category)}`;
          if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
          console.log("✅ Dish Group Sales Report Selected");
        }

        // ✅ Dish Sales
      // ✅ Dish Sales
  else if (byItem === "Dish") {
    url += `&byItem=Dish`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
    console.log("✅ Dish Sales Report Selected with category:", category, "dishGroup:", dishGroup);
  }
        // Then bySales
        else if (bySales === "Summary") {
          url += `&bySales=Summary`;
          console.log("✅ Summary Report Selected");
        }
        else if (bySales === "BusinessType") {
          url += `&bySales=BusinessType`;
          console.log("✅ Business Type Report Selected");
        }
        else if (bySales === "MealPeriod") {
          url += `&bySales=MealPeriod`;
          console.log("✅ Meal Period Report Selected");
        }
        else if (bySales === "Analysis") {
          url += `&bySales=Analysis`;
          console.log("✅ Sales Analysis Report Selected");
        }
        else if (bySales === "Journal") {
          url += `&bySales=Journal`;
          console.log("✅ Sales Journal Report Selected");
        }
        // Then dayEnd
        else if (dayEnd === "Paymode") {
          url += `&dayEnd=Paymode`;
          console.log("✅ Paymode Report Selected");
        }
        else if (dayEnd === "Terminal") {
          url += `&dayEnd=Terminal`;
          console.log("✅ Terminal Report Selected");
        }
        else if (dayEnd === "Transaction") {
          url += `&dayEnd=Transaction`;
          console.log("✅ Transaction Report Selected");
        }
        else if (dayEnd === "TableChange") {
          url += `&dayEnd=TableChange`;
          console.log("✅ Table Change Report Selected");
        }
        else if (dayEnd === "RefundSummary") {
          url += `&dayEnd=RefundSummary`;
          console.log("✅ Refund Summary Report Selected");
        }
        else if (dayEnd === "DiscountSummary") {
          url += `&dayEnd=DiscountSummary`;
          console.log("✅ Discount Summary Report Selected");
        }
        else if (dayEnd === "TopNItems") {
          url += `&dayEnd=TopNItems`;
          console.log("✅ Top N Items Report Selected");
        }

        else if (dayEnd === "Cancellation") {
          url += `&dayEnd=Cancellation`;
          console.log("✅ Cancel Order List Report Selected");
        }
        else if (dayEnd === "GST") {
          url = `${REPORT_BASE}/gst-report-data?fromDate=${fromDate}&toDate=${toDate}`;
          console.log("✅ GST Report Selected");
        }
        // Finally orderSales
        else if (orderSales === "Hourly") {
          url += `&orderSales=Hourly`;
          console.log("✅ Hourly Report Selected");
        }
        else if (orderSales === "Daywise") {
          url += `&orderSales=Daywise`;
          console.log("✅ Daywise Report Selected");
        }
        else if (orderSales === "Itemwise") {
          url += `&orderSales=Itemwise`;
          if (category) url += `&category=${encodeURIComponent(category)}`;
          if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
          console.log("✅ Itemwise Report Selected");
        }
        else if (orderSales === "Group") {
          url += `&orderSales=Group`;
          console.log("✅ Group Report Selected");
        }

        console.log("Final URL:", url);

        try {
          const res = await fetch(url);
          const data = await res.json();

          console.log("API Response:", data);

          let rawData = Array.isArray(data.sales) ? data.sales : [];
          let forcedColumns = [];
          let forcedData = [];

          if (rawData.length === 0) {
            setLocalData([]);
            setColumns([]);
            setGrandTotal(0);
            return;
          }

          // ✅ Guest Meal Report - ADD THIS
          if (dayEnd === "GuestMeal") {
            console.log("Processing Guest Meal Report");
            forcedColumns = ['InvoiceDate', 'BillNumber', 'ItemAmount', 'Discount', 'ServiceCharge', 'TotalTax', 'TotalAmount', 'Description'];
            forcedData = rawData.map(row => ({
              InvoiceDate: row.InvoiceDate || '-',
              BillNumber: row.BillNumber || '-',
              ItemAmount: Number(row.ItemAmount || 0).toFixed(2),
              Discount: Number(row.Discount || row.discountAmount || 0).toFixed(2),
              ServiceCharge: Number(row.ServiceCharge || 0).toFixed(2),
              TotalTax: Number(row.TotalTax || 0).toFixed(2),
              TotalAmount: Number(row.TotalAmount || 0).toFixed(2),
              Description: row.Description || '-',
              isTotalRow: row.isTotalRow || false
            }));
          }
          // ✅ QTY/MONTH Report - Check for Year and Month columns
          else if (rawData[0] && rawData[0].hasOwnProperty('Year') && rawData[0].hasOwnProperty('Month')) {
            console.log("✅ Processing Month/Qty Report");
            forcedColumns = ['Year', 'Month', 'Item', 'DishGroupName', 'Amount'];
            forcedData = rawData;
          }

  // ✅ ADD THE CANCEL ORDER HANDLER RIGHT HERE
  else if (dayEnd === "Cancellation") {
    console.log("Processing Cancel Order List Report");
    // Use DISPLAY NAMES as shown in your image
    forcedColumns = ['Order Number', 'Bill Number', 'Sub Total', 'Discount', 'S.Chrg', 'Total Tax', 'Net Total', 'Remarks'];
    forcedData = rawData.map(row => ({
      'Order Number': row.OrderNumber || '-',
      'Bill Number': row.BillNumber || '-',
      'Sub Total': Number(row.TotalLineItemAmount || 0).toFixed(2),
      'Discount': Number(row.TotalDiscountAmount || 0).toFixed(2),
      'S.Chrg': Number(row.ServiceCharge || 0).toFixed(2),
      'Total Tax': Number(row.TotalTax || 0).toFixed(2),
      'Net Total': Number(row.TotalAmount || 0).toFixed(2),
      'Remarks': row.Description || '-'
    }));
  }
    
          // GST REPORT
          else if (dayEnd === "GST") {
            console.log("Processing GST Report");
            forcedColumns = ['Date', 'Total Sales', 'Total Tax'];
            forcedData = rawData.map(row => ({
              Date: row.Date || '',
              'Total Sales': Number(row.TotalSales || 0).toFixed(2),
              'Total Tax': Number(row.TotalTax || 0).toFixed(2)
            }));
          }
          // ✅ MEALPERIOD REPORT DISPLAY MAPPING
          else if (bySales === "MealPeriod") {
            console.log("Processing MealPeriod Report");
            forcedColumns = ['Date', 'MealPeriod', 'Bills', 'Pax', 'Sub Total', 'Discount', 'SVC', 'Tax Total', 'Total Sales'];
            forcedData = rawData.map(row => ({
              Date: row.Date || '-',
              MealPeriod: row.MealPeriod || '-',
              Bills: row.Bills || 0,
              Pax: row.Pax || 0,
              'Sub Total': Number(row['Sub Total'] || 0).toFixed(2),
              Discount: Number(row.Discount || 0).toFixed(2),
              SVC: Number(row.SVC || 0).toFixed(2),
              'Tax Total': Number(row['Tax Total'] || 0).toFixed(2),
              'Total Sales': Number(row['Total Sales'] || 0).toFixed(2)
            }));
          }

          // ✅ BUSINESS TYPE REPORT
          else if (bySales === "BusinessType") {
            console.log("Processing BusinessType Report");
            console.log("RAW DATA FULL =", JSON.stringify(rawData, null, 2));

            forcedColumns = [
              'Date',
              'Type',
              'SubTotal',
              'Discount',
              'ServiceCharge',
              'Tax',
              'NetTotal'
            ];

            forcedData = rawData.map(row => ({
              Date: row.Date || '-',
              Type: row.Type || '-',
              SubTotal: parseFloat(row.SubTotal ?? 0).toFixed(2),
    Discount: parseFloat(row.Discount ?? 0).toFixed(2),
    ServiceCharge: parseFloat(row.ServiceCharge ?? 0).toFixed(2),
    Tax: parseFloat(row.Tax ?? 0).toFixed(2),
    NetTotal: parseFloat(row.NetTotal ?? 0).toFixed(2),
              isTotalRow: row.isTotalRow || false
            }));
          }
          // ✅ SALES ANALYSIS REPORT - Complete with all sections
    else if (bySales === "Analysis") {
      console.log("Processing Sales Analysis Report");
      console.log("Raw Data Sample:", rawData.slice(0, 3));
      
      // Separate data by DataType
      const mainData = rawData.filter(row => row.DataType === 'MAIN');
      const categoryData = rawData.filter(row => row.DataType === 'CATEGORY');
      const averagesData = rawData.filter(row => row.DataType === 'AVERAGES');
      
      const combinedData = [];
      
      // Add Category Sales section
      if (categoryData.length > 0) {
        combinedData.push({ isCategoryHeader: true, Date: 'ITEM SALES' });
        categoryData.forEach(cat => {
          combinedData.push({
            Date: cat.Date,
            'Total Sales': Number(cat['Total Sales'] || 0).toFixed(2),
            isCategoryRow: true
          });
        });
        const catTotal = categoryData.reduce((sum, cat) => sum + (cat['Total Sales'] || 0), 0);
        combinedData.push({
          Date: 'Total',
          'Total Sales': catTotal.toFixed(2),
          isCategoryTotal: true
        });
        combinedData.push({ isSpacer: true });
      }
      
      // Add Main Analysis Data
      if (mainData.length > 0) {
        combinedData.push({ isMainHeader: true, Date: 'DAILY SALES ANALYSIS' });
        mainData.forEach(row => {
          combinedData.push({
            Date: row.Date || '-',
            'No of Bills': row['No of Bills'] || 0,
            'Pax': row.Pax || 0,
            'Total Sales': Number(row['Total Sales'] || 0).toFixed(2),
            'Discount': Number(row.Discount || 0).toFixed(2),
            'Service Charge': Number(row['Service Charge'] || 0).toFixed(2),
            'Tax': Number(row.Tax || 0).toFixed(2),
            'Net Total': Number(row['Net Total'] || 0).toFixed(2),
            'Tips': Number(row.Tips || 0).toFixed(2),
            'Round Off': Number(row['Round Off'] || 0).toFixed(2),
            'FOC': Number(row.FOC || 0).toFixed(2),
            'Cash': Number(row.Cash || 0).toFixed(2),
            'Cards': Number(row.Cards || 0).toFixed(2),
            'Cheque': Number(row.Cheque || 0).toFixed(2),
            'Ledger': Number(row.Ledger || 0).toFixed(2),
            'Nektar': Number(row.Nektar || 0).toFixed(2),
            'Voucher': Number(row.Voucher || 0).toFixed(2),
            'ENT': Number(row.ENT || 0).toFixed(2),
            'Total Collection': Number(row.TotalCollection || 0).toFixed(2)
          });
        });
      }
      
      // Add Averages section
      if (averagesData.length > 0) {
        combinedData.push({ isAveragesHeader: true, Date: 'SALES AVERAGES' });
        const avg = averagesData[0];
        const totalSales = avg['Total Sales'] || 0;
        const totalBills = avg['No of Bills'] || 0;
        const totalPax = avg.Pax || 0;
        const avgPerBill = totalBills > 0 ? totalSales / totalBills : 0;
        const avgPerPax = totalPax > 0 ? totalSales / totalPax : 0;
        
        combinedData.push({ Date: 'Total Cover', 'Value': totalBills });
        combinedData.push({ Date: 'Avg/Cover', 'Value': avgPerBill.toFixed(2) });
        combinedData.push({ Date: 'Total PAX', 'Value': totalPax });
        combinedData.push({ Date: 'Avg/PAX', 'Value': avgPerPax.toFixed(2) });
      }
      
      // Define all columns for display
      forcedColumns = ['Date', 'No of Bills', 'Pax', 'Total Sales', 'Discount', 'Service Charge', 'Tax', 'Net Total', 'Tips', 'Round Off', 'FOC', 'Cash', 'Cards', 'Cheque', 'Ledger', 'Nektar', 'Voucher', 'ENT', 'Total Collection'];
      forcedData = combinedData;
    }

  // ✅ CATEGORY SALES REPORT (With Detail Total, Bill Discount, Grand Total)
  else if (byItem === "Category") {
    console.log("Processing Category Sales Report");
    
    // Calculate totals from category data
    let totalSold = 0;
    let totalItemSales = 0;
    let totalItemDisc = 0;
    let totalFOC = 0;
    let totalNetSales = 0;
    
    const categoryRows = rawData.map(row => {
      const sold = Number(row.Sold || 0);
      const itemSales = Number(row.ItemSales || 0);
      const itemDisc = Number(row.ItemDisc || 0);
      const foc = Number(row.FOC || row.Foc || 0);
      const netSales = Number(row.NetSales || 0);
      
      totalSold += sold;
      totalItemSales += itemSales;
      totalItemDisc += itemDisc;
      totalFOC += foc;
      totalNetSales += netSales;
      
      return {
        CategoryName: row.CategoryName || '-',
        Sold: sold.toFixed(2),
        ItemSales: itemSales.toFixed(2),
        ItemDisc: itemDisc.toFixed(2),
        FOC: foc.toFixed(2),
        NetSales: netSales.toFixed(2),
        isTotalRow: false
      };
    });
    
    // Get Bill Discount from API response (or use totalItemDisc as fallback)
    const billDiscount = data.billDiscount || 0;
    
    // Add Detail Total row
    categoryRows.push({
      CategoryName: 'Detail Total:',
      Sold: totalSold.toFixed(2),
      ItemSales: totalItemSales.toFixed(2),
      ItemDisc: totalItemDisc.toFixed(2),
      FOC: totalFOC.toFixed(2),
      NetSales: totalNetSales.toFixed(2),
      isTotalRow: true
    });
    
    // Add Bill Discount row
    categoryRows.push({
      CategoryName: 'Bill Discount:',
      Sold: '-',
      ItemSales: '-',
      ItemDisc: '-',
      FOC: '-',
      NetSales: Number(billDiscount).toFixed(2),
      isTotalRow: true
    });
    
    // Add ONLY ONE Grand Total row (removed duplicate)
    const grandTotalNetSales = totalNetSales - Number(billDiscount);
    categoryRows.push({
      CategoryName: 'Grand Total:',
      Sold: totalSold.toFixed(2),
      ItemSales: totalItemSales.toFixed(2),
      ItemDisc: totalItemDisc.toFixed(2),
      FOC: totalFOC.toFixed(2),
      NetSales: grandTotalNetSales.toFixed(2),
      isTotalRow: true,
      isGrandTotal: true
    });
    
    forcedColumns = ['CategoryName', 'Sold', 'ItemSales', 'ItemDisc', 'FOC', 'NetSales'];
    forcedData = categoryRows;
  }
        // ✅ DISH GROUP SALES REPORT (With Detail Total, Bill Discount, Grand Total)
  else if (byItem === "DishGroup") {
    console.log("Processing Dish Group Sales Report");
    
    // Calculate totals from dish group data
    let totalSold = 0;
    let totalItemSales = 0;
    let totalItemDisc = 0;
    let totalFOC = 0;
    let totalNetSales = 0;
    
    // Group data by Category first
    const categoryGroups = new Map();
    
    rawData.forEach(row => {
      const categoryName = row.CategoryName || 'Uncategorized';
      if (!categoryGroups.has(categoryName)) {
        categoryGroups.set(categoryName, []);
      }
      categoryGroups.get(categoryName).push(row);
    });
    
    const dishGroupRows = [];
    
    // Process each category
    for (const [categoryName, items] of categoryGroups.entries()) {
      let categorySold = 0;
      let categoryItemSales = 0;
      let categoryItemDisc = 0;
      let categoryFOC = 0;
      let categoryNetSales = 0;
      
      // Add Category header row
      dishGroupRows.push({
        DishGroupname: `CategoryName: ${categoryName}`,
        CategoryName: '',
        Sold: '-',
        ItemSales: '-',
        ItemDisc: '-',
        FOC: '-',
        NetSales: '-',
        isCategoryHeader: true,
        isTotalRow: false
      });
      
      // Add each dish group under this category
      items.forEach(row => {
        const sold = Number(row.Sold || 0);
        const itemSales = Number(row.ItemSales || 0);
        const itemDisc = Number(row.ItemDisc || 0);
        const foc = Number(row.Foc || 0);
        const netSales = Number(row.Revenue || itemSales || 0);
        
        categorySold += sold;
        categoryItemSales += itemSales;
        categoryItemDisc += itemDisc;
        categoryFOC += foc;
        categoryNetSales += netSales;
        
        totalSold += sold;
        totalItemSales += itemSales;
        totalItemDisc += itemDisc;
        totalFOC += foc;
        totalNetSales += netSales;
        
        dishGroupRows.push({
          DishGroupname: row.DishGroupname || row.DishGroupName || '-',
          CategoryName: '',
          Sold: sold.toFixed(2),
          ItemSales: itemSales.toFixed(2),
          ItemDisc: itemDisc.toFixed(2),
          FOC: foc.toFixed(2),
          NetSales: netSales.toFixed(2),
          isTotalRow: false
        });
      });
      
      // Add Category Total row
      dishGroupRows.push({
        DishGroupname: 'Total:',
        CategoryName: '',
        Sold: categorySold.toFixed(2),
        ItemSales: categoryItemSales.toFixed(2),
        ItemDisc: categoryItemDisc.toFixed(2),
        FOC: categoryFOC.toFixed(2),
        NetSales: categoryNetSales.toFixed(2),
        isTotalRow: true,
        isCategoryTotal: true
      });
      
      // Add spacer between categories
      dishGroupRows.push({
        DishGroupname: '',
        CategoryName: '',
        Sold: '',
        ItemSales: '',
        ItemDisc: '',
        FOC: '',
        NetSales: '',
        isSpacer: true
      });
    }
    
    // Get Bill Discount from API response
    const billDiscount = data.billDiscount || 0;
    
    // Add Detail Total row
    dishGroupRows.push({
      DishGroupname: 'Detail Total:',
      CategoryName: '',
      Sold: totalSold.toFixed(2),
      ItemSales: totalItemSales.toFixed(2),
      ItemDisc: totalItemDisc.toFixed(2),
      FOC: totalFOC.toFixed(2),
      NetSales: totalNetSales.toFixed(2),
      isTotalRow: true
    });
    
    // Add Bill Discount row
    dishGroupRows.push({
      DishGroupname: 'Bill Discount:',
      CategoryName: '',
      Sold: '-',
      ItemSales: '-',
      ItemDisc: '-',
      FOC: '-',
      NetSales: Number(billDiscount).toFixed(2),
      isTotalRow: true
    });
    
    // Add Grand Total row
    const grandTotalNetSales = totalNetSales - Number(billDiscount);
    dishGroupRows.push({
      DishGroupname: 'Grand Total:',
      CategoryName: '',
      Sold: totalSold.toFixed(2),
      ItemSales: totalItemSales.toFixed(2),
      ItemDisc: totalItemDisc.toFixed(2),
      FOC: totalFOC.toFixed(2),
      NetSales: grandTotalNetSales.toFixed(2),
      isTotalRow: true,
      isGrandTotal: true
    });
    
    forcedColumns = ['DishGroupname', 'Sold', 'ItemSales', 'ItemDisc', 'FOC', 'NetSales'];
    forcedData = dishGroupRows;
  }

  // ✅ DISH SALES REPORT (With Category, DishGroup, Detail Total, Bill Discount, Grand Total)
  else if (byItem === "Dish") {
    console.log("Processing Dish Sales Report");
    
    // Calculate totals from dish data
    let totalSold = 0;
    let totalItemSales = 0;
    let totalItemDisc = 0;
    let totalFOC = 0;
    let totalNetSales = 0;
    
    // Group data by Category first, then by DishGroup
    const categoryGroups = new Map();
    
    rawData.forEach(row => {
      const categoryName = row.CategoryName || 'Uncategorized';
      if (!categoryGroups.has(categoryName)) {
        categoryGroups.set(categoryName, new Map());
      }
      const dishGroupMap = categoryGroups.get(categoryName);
      const dishGroupName = row.DishGroupname || 'Uncategorized';
      if (!dishGroupMap.has(dishGroupName)) {
        dishGroupMap.set(dishGroupName, []);
      }
      dishGroupMap.get(dishGroupName).push(row);
    });
    
    const dishRows = [];
    
    // Process each category
    for (const [categoryName, dishGroupMap] of categoryGroups.entries()) {
      let categorySold = 0;
      let categoryItemSales = 0;
      let categoryItemDisc = 0;
      let categoryFOC = 0;
      let categoryNetSales = 0;
      
      // Add Category header row
      dishRows.push({
        Dishname: `CategoryName: ${categoryName}`,
        Sold: '-',
        ItemSales: '-',
        ItemDisc: '-',
        FOC: '-',
        NetSales: '-',
        isCategoryHeader: true,
        isTotalRow: false
      });
      
      const dishGroupEntries = Array.from(dishGroupMap.entries());
      const hasMultipleDishGroups = dishGroupEntries.length > 1;
      
      // Process each dish group under this category
      for (let idx = 0; idx < dishGroupEntries.length; idx++) {
        const [dishGroupName, items] = dishGroupEntries[idx];
        let dishGroupSold = 0;
        let dishGroupItemSales = 0;
        let dishGroupItemDisc = 0;
        let dishGroupFOC = 0;
        let dishGroupNetSales = 0;
        
        // Add DishGroup header row
        dishRows.push({
          Dishname: `DishgroupName: ${dishGroupName}`,
          Sold: '-',
          ItemSales: '-',
          ItemDisc: '-',
          FOC: '-',
          NetSales: '-',
          isDishGroupHeader: true,
          isTotalRow: false
        });
        
        // Add each dish under this dish group
        items.forEach(row => {
          const sold = Number(row.Sold || 0);
          const itemSales = Number(row.ItemSales || 0);
          const itemDisc = Number(row.ItemDisc || 0);
          const foc = Number(row.Foc || 0);
          const netSales = Number(row.NetSales || itemSales || 0);
          
          dishGroupSold += sold;
          dishGroupItemSales += itemSales;
          dishGroupItemDisc += itemDisc;
          dishGroupFOC += foc;
          dishGroupNetSales += netSales;
          
          categorySold += sold;
          categoryItemSales += itemSales;
          categoryItemDisc += itemDisc;
          categoryFOC += foc;
          categoryNetSales += netSales;
          
          totalSold += sold;
          totalItemSales += itemSales;
          totalItemDisc += itemDisc;
          totalFOC += foc;
          totalNetSales += netSales;
          
          dishRows.push({
            Dishname: row.Dishname || '-',
            Sold: sold.toFixed(2),
            ItemSales: itemSales.toFixed(2),
            ItemDisc: itemDisc.toFixed(2),
            FOC: foc.toFixed(2),
            NetSales: netSales.toFixed(2),
            isTotalRow: false
          });
        });
        
        // Add DishGroup Total row (only if multiple dish groups or it's the only one)
        // For single dish group, we'll only show Category Total, not DishGroup Total
        if (hasMultipleDishGroups) {
          dishRows.push({
            Dishname: 'Total:',
            Sold: dishGroupSold.toFixed(2),
            ItemSales: dishGroupItemSales.toFixed(2),
            ItemDisc: dishGroupItemDisc.toFixed(2),
            FOC: dishGroupFOC.toFixed(2),
            NetSales: dishGroupNetSales.toFixed(2),
            isTotalRow: true,
            isDishGroupTotal: true
          });
        }
      }
      
      // Add Category Total row (always show)
      dishRows.push({
        Dishname: 'Total:',
        Sold: categorySold.toFixed(2),
        ItemSales: categoryItemSales.toFixed(2),
        ItemDisc: categoryItemDisc.toFixed(2),
        FOC: categoryFOC.toFixed(2),
        NetSales: categoryNetSales.toFixed(2),
        isTotalRow: true,
        isCategoryTotal: true
      });
      
      // Add spacer between categories only if there are more categories
      if (categoryGroups.size > 1) {
        dishRows.push({
          Dishname: '',
          Sold: '',
          ItemSales: '',
          ItemDisc: '',
          FOC: '',
          NetSales: '',
          isSpacer: true
        });
      }
    }
    
    // Remove trailing spacer if exists
    if (dishRows.length > 0 && dishRows[dishRows.length - 1] && dishRows[dishRows.length - 1].isSpacer) {
      dishRows.pop();
    }
    
    // Get Bill Discount from API response
    const billDiscount = data.billDiscount || 0;
    
    // Add Detail Total row
    dishRows.push({
      Dishname: 'Detail Total:',
      Sold: totalSold.toFixed(2),
      ItemSales: totalItemSales.toFixed(2),
      ItemDisc: totalItemDisc.toFixed(2),
      FOC: totalFOC.toFixed(2),
      NetSales: totalNetSales.toFixed(2),
      isTotalRow: true
    });
    
    // Add Bill Discount row
    dishRows.push({
      Dishname: 'Bill Discount:',
      Sold: '-',
      ItemSales: '-',
      ItemDisc: '-',
      FOC: '-',
      NetSales: Number(billDiscount).toFixed(2),
      isTotalRow: true
    });
    
    // Add Grand Total row
    const grandTotalNetSales = totalNetSales - Number(billDiscount);
    dishRows.push({
      Dishname: 'Grand Total:',
      Sold: totalSold.toFixed(2),
      ItemSales: totalItemSales.toFixed(2),
      ItemDisc: totalItemDisc.toFixed(2),
      FOC: totalFOC.toFixed(2),
      NetSales: grandTotalNetSales.toFixed(2),
      isTotalRow: true,
      isGrandTotal: true
    });
    
    forcedColumns = ['Dishname', 'Sold', 'ItemSales', 'ItemDisc', 'FOC', 'NetSales'];
    forcedData = dishRows;
  }

        // ✅ PAYMODE COLLECTION REPORT - PIVOTED SUMMARY FORMAT (Like Crystal Report)
  else if (dayEnd === "Paymode") {
    console.log("Processing Paymode Collection Report - Pivoted Format");
    
    // Check if data is already in pivoted format (has Cash column)
    if (rawData.length > 0 && rawData[0].hasOwnProperty('Cash')) {
      // Data is already pivoted from backend
      forcedColumns = ['Date', 'Cash', 'Cheque', 'Visa', 'Master', 'Amex', 'Diners', 'JCB', 'Nets', 'Total(Cards)', 'Others', 'Nektar'];
      forcedData = rawData.map(row => ({
        Date: row.Date || '-',
        Cash: Number(row.Cash || 0).toFixed(2),
        Cheque: Number(row.Cheque || 0).toFixed(2),
        Visa: Number(row.Visa || 0).toFixed(2),
        Master: Number(row.Master || 0).toFixed(2),
        Amex: Number(row.Amex || 0).toFixed(2),
        Diners: Number(row.Diners || 0).toFixed(2),
        JCB: Number(row.JCB || 0).toFixed(2),
        Nets: Number(row.Nets || 0).toFixed(2),
        'Total(Cards)': Number(row['Total(Cards)'] || 0).toFixed(2),
        Others: Number(row.Others || 0).toFixed(2),
        Nektar: Number(row.Nektar || 0).toFixed(2)
      }));
    } else {
      // Fallback: If data is in old format, aggregate by date and paymode
      console.log("Converting raw data to pivoted format");
      
      // Group by Date and PayMode
      const datePayModeMap = new Map();
      
      rawData.forEach(row => {
        const date = row.Date || '-';
        const payMode = row.PayMode || row.Paymode || 'Unknown';
        const amount = Number(row.Amount || row.SysAmount || 0);
        
        if (!datePayModeMap.has(date)) {
          datePayModeMap.set(date, new Map());
        }
        const payModeMap = datePayModeMap.get(date);
        const currentAmount = payModeMap.get(payMode) || 0;
        payModeMap.set(payMode, currentAmount + amount);
      });
      
      // Convert to array format
      const pivotedData = [];
      for (const [date, payModeMap] of datePayModeMap.entries()) {
        const row = {
          Date: date,
          Cash: 0, Cheque: 0, Visa: 0, Master: 0, Amex: 0,
          Diners: 0, JCB: 0, Nets: 0, Others: 0, Nektar: 0
        };
        
        for (const [payMode, amount] of payModeMap.entries()) {
          const upperPayMode = payMode.toUpperCase();
          if (upperPayMode === 'CASH') row.Cash = amount;
          else if (upperPayMode === 'CHEQUE') row.Cheque = amount;
          else if (upperPayMode === 'VISA') row.Visa = amount;
          else if (upperPayMode === 'MASTERCARD') row.Master = amount;
          else if (upperPayMode === 'AMEX') row.Amex = amount;
          else if (upperPayMode === 'DINERS') row.Diners = amount;
          else if (upperPayMode === 'JCB') row.JCB = amount;
          else if (upperPayMode === 'NETS') row.Nets = amount;
          else if (upperPayMode === 'NEKTAR') row.Nektar = amount;
          else row.Others += amount;
        }
        
        // Calculate Total Cards
        row['Total(Cards)'] = row.Visa + row.Master + row.Amex + row.Diners + row.JCB + row.Nets;
        
        pivotedData.push(row);
      }
      
      forcedColumns = ['Date', 'Cash', 'Cheque', 'Visa', 'Master', 'Amex', 'Diners', 'JCB', 'Nets', 'Total(Cards)', 'Others', 'Nektar'];
      forcedData = pivotedData.map(row => ({
        Date: row.Date,
        Cash: row.Cash.toFixed(2),
        Cheque: row.Cheque.toFixed(2),
        Visa: row.Visa.toFixed(2),
        Master: row.Master.toFixed(2),
        Amex: row.Amex.toFixed(2),
        Diners: row.Diners.toFixed(2),
        JCB: row.JCB.toFixed(2),
        Nets: row.Nets.toFixed(2),
        'Total(Cards)': row['Total(Cards)'].toFixed(2),
        Others: row.Others.toFixed(2),
        Nektar: row.Nektar.toFixed(2)
      }));
    }
    
    console.log("Paymode Data Processed, rows:", forcedData.length);
    console.log("Columns:", forcedColumns);
  }
          // Sales Summary / Paymode report
          else if (data.columns && (data.columns.includes('Sales') || data.columns.includes('Cash'))) {
            forcedColumns = ['Date', 'Sales', 'FOC', 'Disc', 'SVC', 'Tax 7%', 'Tips', 'Rnd', 'ENT', 'Cash', 'Master', 'Visa'];
            forcedData = rawData.map(row => ({
              Date: row.Date || (row.InvoiceDate ? new Date(row.InvoiceDate).toLocaleDateString('en-GB') : ''),
              Sales: Number(row.Sales || row.ItemSales || 0).toFixed(2),
              FOC: Number(row.FOC || 0).toFixed(2),
              Disc: Number(row.Disc || row.Discount || 0).toFixed(2),
              SVC: Number(row.SVC || 0).toFixed(2),
              'Tax 7%': Number(row['Tax 7%'] || row.Tax || 0).toFixed(2),
              Tips: Number(row.Tips || 0).toFixed(2),
              Rnd: Number(row.Rnd || 0).toFixed(2),
              ENT: Number(row.ENT || 0).toFixed(2),
              Cash: Number(row.Cash || 0).toFixed(2),
              Master: Number(row.Master || 0).toFixed(2),
              Visa: Number(row.Visa || 0).toFixed(2)
            }));
          }




          // Hourly report
          else if (data.columns && data.columns.includes('Hour') && data.columns.includes('Amount')) {
            forcedColumns = ['Hour', 'Amount'];
            forcedData = rawData;
          }
          // Daywise report
          else if (data.columns && data.columns.includes('No of Bills')) {
            forcedColumns = ['Date', 'No of Bills', 'Qty', 'Amount'];
            forcedData = rawData;
          }
          else {
            // All other reports
            forcedColumns = data.columns || Object.keys(rawData[0] || {});
            forcedData = rawData;
          }

          console.log("Final Columns:", forcedColumns);
          console.log("Final Data Sample:", forcedData.slice(0, 3));

          setLocalData(forcedData);
          setColumns(forcedColumns);
          setGrandTotal(data.grandTotal || 0);

        } catch (error) {
          console.error("Error fetching data:", error);
          alert("Error fetching report data. Check server connection.");
        }
      };

      const handleClear = () => {
        setOrderSales("");
        setDayEnd("");
        setBySales("");
        setByItem("");
        setShowChart(false);
        setPostDate(false);
        setIsSearched(false);
        setOutputType("Screen");
        setViewMode("");
        setLocalData([]);
        setCategory("");
        setDishGroup("");
        setGrandTotal(0);
      };

      const displayData = localData.length > 0 ? localData : salesData;
      const displayColumns = localData.length > 0 ? columns : initialColumns;
      const hasData = displayData.length > 0;

      return (
        <div className={`sales report-container ${sidebarOpen ? "sidebar-open" : ""}`}>
          <div className="report-header">
            <h2 className="report-title">Sales Report</h2>
          </div>

          <div className="filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label className="tb-label">Order Sales</label>
                <select value={orderSales} onChange={(e) => setOrderSales(e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="Itemwise">Sales - Itemwise (R)</option>
                  <option value="Hourly">Hourly Report</option>
                  <option value="Group">Group Sales (R)</option>
                  <option value="Daywise">Sales - Daywise</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="tb-label">Day End</label>
                <select value={dayEnd} onChange={(e) => setDayEnd(e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="Paymode">Paymode Collection</option>
                  <option value="Terminal">Terminal Sales</option>
                  <option value="Transaction">Transaction</option>
                  <option value="GST">GST Report</option>
                  <option value="GuestMeal">Guest Meal Summary</option>
                  <option value="DiscountSummary">Discount Summary</option>
                  <option value="TopNItems">Top N Items</option>
                  <option value="RefundSummary">Refund Summary</option>
                  <option value="TableChange">Table Change</option>
                  <option value="Cancellation">Cancel Order List</option>

                </select>
              </div>
              <div className="filter-group">
                <label className="tb-label">By Sales</label>
                <select value={bySales} onChange={(e) => setBySales(e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="Journal">Sales Journal</option>
                  <option value="Summary">Sales Summary</option>
                  <option value="BusinessType">SalesByBusinessType</option>
                  <option value="MealPeriod">SalesByMealPeriod</option>
                  <option value="Analysis">Sales Analysis</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="tb-label">By Item</label>
                <select value={byItem} onChange={(e) => {
                  setByItem(e.target.value);
                  setCategory("");
                  setDishGroup("");
                }}>
                  <option value="">-- Select --</option>
                  <option value="Month">Month Sales</option>
                  <option value="Qty">Qty Sales</option>
                  <option value="Category">Category Sales</option>
                  <option value="DishGroup">Dish Group Sales</option>
                  <option value="Dish">Dish Sales</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="tb-label">From Date</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="filter-group">
                <label className="tb-label">To Date</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <div className="filter-group">
                <label className="tb-label">&nbsp;</label>
                <select className="view-mode-select" value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="Summary">Summary</option>
                  <option value="Detail">Detail</option>
                </select>
              </div>
              <div className="filter-actions">
                <button className="find-btn" onClick={handleFind}>Find</button>
                <button className="clear-btn" onClick={handleClear}>Clear</button>
              </div>
            </div>

            {(orderSales === "Itemwise" ||
              byItem === "Month" ||
              byItem === "Qty" ||
              byItem === "Category" ||      // ✅ ADD THIS
              byItem === "DishGroup" ||     // ✅ ADD THIS
              byItem === "Dish") && (       // ✅ ADD THIS

                <div className="filter-row secondary-filters">
                  <div className="filter-group">
                    <label className="tb-label">Category</label>
                    <div className="lov-input-group">
                      <input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Select Category"
                      />
                      <button
                        type="button"
                        className="lov-btn"
                        onClick={() => {
                          fetchCategories();
                          setShowCategoryLOV(true);
                        }}
                      >
                        ...
                      </button>
                    </div>
                  </div>

                  <div className="filter-group">
                    <label className="tb-label">Dish Group</label>
                    <div className="lov-input-group">
                      <input
                        value={dishGroup}
                        onChange={(e) => setDishGroup(e.target.value)}
                        placeholder="Select Dish Group"
                      />
                      <button
                        type="button"
                        className="lov-btn"
                        onClick={() => {
                          if (selectedCategoryId) {
                            fetchDishGroups(selectedCategoryId);
                          } else {
                            fetchDishGroups();
                          }
                          setShowDishGroupLOV(true);
                        }}
                      >
                        ...
                      </button>
                    </div>
                  </div>
                </div>
              )}     </div>

          {isSearched && (
            <div className="report-output-section">
              <div className="professional-report-wrapper">
                {/* Download Button moved INSIDE the wrapper - Top Right */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                  <button onClick={handleDownload} className="download-btn-inside" title="Download PDF">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                </div>
                {hasData ? (
                  <>
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                      <table className="report-table professional-table">
                        <thead>
                          <tr>
                            {displayColumns.map((col, idx) => {
                              const isTextCol = col === 'Date' || col === 'Type' || col === 'Hour' || col === 'Item' || col === 'DishName' || col === 'DishGroupName' || col === 'CategoryName' || col === 'Month' || col === 'Year' || col === 'InvoiceNumber' || col === 'Group' || col === 'GstType' || col === 'Category' || col === 'InvoiceDate' || col === 'BillNumber' || col === 'Description';
                              return (
                                <th key={idx} style={{ textAlign: isTextCol ? 'left' : 'right', padding: '10px 12px', whiteSpace: 'nowrap', fontSize: '13px' }}>                            
                                  {
                                    col === 'ServiceCharge'
                                      ? 'Service Charge'
                                      : col === 'SubTotal'
                                        ? 'Sub Total'
                                        : col === 'NetTotal'
                                          ? 'Net Total'
                                          : col
                                  }
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {displayData.map((item, i) => (
                            <tr key={i} className={item.isTotalRow ? "day-total-row" : ""}>
                              {displayColumns.map((col, idx) => {
                                let value = item[col];
                                // Format Date fields
                                if (col === 'Date' && value) {
                                  const dateObj = new Date(value);
                                  if (!isNaN(dateObj.getTime()) && typeof value === 'object') {
                                    value = dateObj.toLocaleDateString('en-GB');
                                  }
                                }
                                const isTextCol = col === 'Date' || col === 'Type' || col === 'Hour' || col === 'Item' || col === 'DishName' || col === 'DishGroupName' || col === 'CategoryName' || col === 'Month' || col === 'Year' || col === 'InvoiceNumber' || col === 'Group' || col === 'GstType' || col === 'Category' || col === 'InvoiceDate' || col === 'BillNumber' || col === 'Description';
                                const isNumeric = !isTextCol && (typeof value === "number" || (value !== '' && value !== null && !isNaN(Number(value))));
                                return (
  <td key={idx} style={{
    textAlign: isTextCol ? 'left' : 'right',
    padding: '8px 12px',
    whiteSpace: 'nowrap',
    fontWeight: item.isTotalRow ? 'bold' : 'normal',
    fontSize: '12px'
  }}>
                                    {isNumeric ? Number(value).toFixed(2) : (value !== null && value !== undefined && value !== '' ? value : '0.00')}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        {/* Skip automatic Grand Total row for Category and DishGroup reports since we already have Grand Total in the data */}
  {byItem !== "Category" && byItem !== "DishGroup" && byItem !== "Dish" && (
    <tr className="grand-total-row">
      {displayColumns.map((col, idx) => {
        const isTextCol = col === 'Date' || col === 'Type' || col === 'Hour' || col === 'Item' || col === 'DishName' || col === 'DishGroupName' || col === 'CategoryName' || col === 'Month' || col === 'Year' || col === 'InvoiceNumber' || col === 'Group' || col === 'GstType' || col === 'Category' || col === 'InvoiceDate' || col === 'BillNumber' || col === 'Description';
        if (idx === 0) return <td key={idx} style={{ textAlign: 'left', fontWeight: 'bold' }}>Grand Total:</td>;
        if (isTextCol) return <td key={idx} style={{ textAlign: 'left' }}></td>;
        const total = displayData.reduce((sum, row) => sum + (row.isTotalRow ? 0 : (parseFloat(row[col]) || 0)), 0);
        return <td key={idx} style={{ textAlign: 'right', fontWeight: 'bold' }}>{total.toFixed(2)}</td>;
      })}
    </tr>
  )}
                        </tbody>
                      </table>
                    </div>
                    <div className="prof-report-footer">
                      <span className="system-msg">*** System Generated Report ***</span>
                      <span className="powered-msg">Powered by Unipro</span>
                    </div>
                  </>
                ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: '14px', color: '#999', fontWeight: '500' }}>
    📋 No Data Found for the selected criteria
  </div>
                )}
              </div>
            </div>
          )}

          {/* Category LOV Modal */}
          {showCategoryLOV && (
            <div className="lov-modal" onClick={() => setShowCategoryLOV(false)}>
              <div className="lov-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="lov-modal-header">
                  <h3>Select Category</h3>
                  <button onClick={() => setShowCategoryLOV(false)}>×</button>
                </div>
                <div className="lov-modal-body">
                  <div className="lov-item" onClick={async () => {
                    console.log("=== CLEAR CATEGORY ===");
                    setCategory("");
                    setSelectedCategoryId("");
                    setShowCategoryLOV(false);
                    setDishGroup("");
                    await fetchDishGroups();
                  }}>-- Clear Selection --</div>

                  {categoryList.map((item, idx) => (
                    <div key={idx} className="lov-item" onClick={async () => {
                      const catName = item.CategoryName || item;
                      const catId = item.CategoryId || '';
                      console.log("=== CATEGORY SELECTED ===");
                      console.log("Name:", catName);
                      console.log("ID:", catId);

                      setCategory(catName);
                      setSelectedCategoryId(catId);
                      setShowCategoryLOV(false);
                      setDishGroup("");

                      if (catId) {
                        await fetchDishGroups(catId);
                      }
                    }}>
                      {item.CategoryName || item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dish Group LOV Modal */}
          {showDishGroupLOV && (
            <div className="lov-modal" onClick={() => setShowDishGroupLOV(false)}>
              <div className="lov-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="lov-modal-header">
                  <h3>Select Dish Group</h3>
                  <button onClick={() => setShowDishGroupLOV(false)}>×</button>
                </div>
                <div className="lov-modal-body">
                  <div className="lov-item" onClick={() => {
                    setDishGroup("");
                    setShowDishGroupLOV(false);
                  }}>-- Clear Selection --</div>

                  {dishGroupList.length === 0 && (
                    <div className="lov-item" style={{ color: 'red', fontStyle: 'italic' }}>
                      No dish groups found for this category
                    </div>
                  )}

                  {dishGroupList.map((item, idx) => {
                    const dishName = typeof item === 'object' ? (item.DishGroupName || item.DishGroup) : item;
                    console.log("Rendering dish:", dishName);
                    return (
                      <div key={idx} className="lov-item" onClick={() => {
                        console.log("Selected dish:", dishName);
                        setDishGroup(dishName);
                        setShowDishGroupLOV(false);
                      }}>
                        {dishName}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    export default CafeSalesReport;
