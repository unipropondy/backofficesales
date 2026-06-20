import { API_BASE_URL } from "../config/config";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DayEndReport.css';

const DayEndReport = ({ sidebarOpen }) => {
    const singaporeToday = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Singapore'
    });
    const [fromDate, setFromDate] = useState(singaporeToday);
    const [toDate, setToDate] = useState(singaporeToday);
    const [reportData, setReportData] = useState(null);
    const [orgInfo, setOrgInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [availableDates, setAvailableDates] = useState([]);

    useEffect(() => {
        const fetchAvailableDates = async () => {
            try {
                const response = await axios.get(API_BASE_URL + '/api/dayendreport/dates');
                if (response.data.success) {
                    setAvailableDates(response.data.dates);
                    if (response.data.dates && response.data.dates.length > 0) {
                        const latestDate = response.data.dates[0].OrderDate?.split('T')[0] || singaporeToday;
                        setFromDate(latestDate);
                        setToDate(latestDate);
                    }
                }
            } catch (error) {
                console.log("Could not fetch available dates");
            }
        };
        fetchAvailableDates();
    }, []);

    const formatDate = (d) => {
        if (!d) return "";
        const p = d.split("-");
        return `${p[2]}-${p[1]}-${p[0]}`;
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_BASE_URL + '/api/dayendreport', {
                params: { fromDate: fromDate, toDate: toDate }
            });

            console.log("API Response:", response.data);

            if (response.data.success) {
                const backendData = response.data;

                const formattedData = {
                    cashier: backendData.reportData?.cashier || "System",
                    receiptCount: backendData.reportData?.receiptCount || 0,
                    refNo: backendData.reportData?.refNo || "",
                    salesDetail: {
                        totalSales: backendData.reportData?.salesDetail?.totalSales || 0,
                        roundOff: backendData.reportData?.salesDetail?.roundOff || 0,
                        netTotal: backendData.reportData?.salesDetail?.netTotal || 0
                    },
                    paymodeDetail: backendData.reportData?.paymodeDetail || {},
                    settlementDetail: backendData.reportData?.settlementDetail || {},
                    analysis: backendData.reportData?.analysis || {},
                    voidDetail: backendData.reportData?.voidDetail || {}
                };

                setReportData(formattedData);
                setOrgInfo(backendData.orgInfo);
                setShowResults(true);
            } else {
                alert("No data found");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to fetch report data");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!reportData) {
            alert("Please generate a report first");
            return;
        }

        const now = new Date();

        const printDate = now.toLocaleDateString('en-GB', {
            timeZone: 'Asia/Singapore'
        });

        const printTime = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Singapore',
            hour12: true
        });
        const dateRangeText = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
        const dateRangeFormatted = fromDate === toDate ? formatDate(fromDate) : `${formatDate(fromDate)} to ${formatDate(toDate)}`;

        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Day End Report - ${dateRangeFormatted}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                body { 
                    font-family: 'Cambria', 'Times New Roman', serif; 
                    background: #f0f2f5; 
                    margin: 0; 
                    padding: 20px; 
                    display: flex; 
                    justify-content: center; 
                }
                .a4-page {
                    background: white;
                    width: 210mm;
                    min-height: 297mm;
                    padding: 15mm 20mm 5mm 20mm;
                    box-sizing: border-box;
                    box-shadow: 0 0 15px rgba(0,0,0,0.1);
                    color: #333;
                    border: 1px solid #d1d8dd;
                    display: flex;
                    flex-direction: column;
                }
                .report-body {
                    flex-grow: 1;
                }
                @media screen {
                    .print-spacer { display: none; }
                }
                @media print {
                    @page { margin: 0; }
                    body { 
                        background: white; 
                        padding: 0; 
                        margin: 0; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                    }
                    .a4-page { 
                        box-shadow: none; 
                        width: 100% !important; 
                        margin: 0; 
                        padding: 0 20mm !important;
                        border: none; 
                        display: block !important;
                    }
                    .print-bottom-wrapper {
                        position: static !important;
                        page-break-inside: avoid;
                        padding: 10px 0 !important;
                        margin-top: 300px !important;
                    }
                    th, td { padding: 4px 6px !important; font-size: 10px; }
                    .header-container { margin-bottom: 10px; padding-bottom: 10px; }
                    .report-title { margin: 5px 0; font-size: 14px; }
                    .report-info { margin-bottom: 10px; padding: 5px; font-size: 11px; }
                    .signature { margin-top: 20px; page-break-inside: avoid; }
                    tr { page-break-inside: avoid; break-inside: avoid; }
                    table { page-break-inside: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                }
                .header-container { 
                    position: relative; 
                    text-align: center; 
                    border-bottom: 1px solid #34495e; 
                    padding-bottom: 15px; 
                    margin-bottom: 20px; 
                    min-height: 60px; 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: center; 
                }
                .logo { 
                    position: absolute; 
                    left: 0; 
                    top: 50%; 
                    transform: translateY(-50%); 
                    max-width: 100px; 
                    max-height: 50px; 
                }
                .company-name { 
                    font-size: 18px; 
                    font-weight: bold; 
                    color: #2c3e50; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .company-address { 
                    font-size: 11px; 
                    color: #7f8c8d; 
                    margin-top: 4px; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .report-title { 
                    text-align: center; 
                    font-size: 14px; 
                    font-weight: bold; 
                    margin: 20px 0; 
                    color: #34495e; 
                    text-transform: uppercase; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .report-info {
                    text-align: center;
                    margin-bottom: 25px;
                    font-size: 12px;
                    border: 1px solid #e0e0e0;
                    padding: 8px;
                    background: #f8f9fa;
                    color: #333;
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0; 
                    font-size: 11px; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                th, td { 
                    padding: 10px 12px; 
                    border: 1px solid #e0e0e0; 
                    text-align: left; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                th { 
                    background: #34495e; 
                    color: #ffffff; 
                    font-weight: bold; 
                    text-transform: uppercase;
                    text-align: center;
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .section-head td {
                    background-color: #eaeff2 !important;
                    font-weight: bold;
                    color: #34495e;
                }
                .total-row td {
                    background-color: #f8f9fa !important;
                    font-weight: bold;
                    color: #333;
                }
                .footer { 
                    margin-top: 40px;
                    font-size: 10px; 
                    color: #95a5a6; 
                    padding-top: 15px; 
                    display: flex; 
                    justify-content: space-between; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .signature {
                    margin-top: 60px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: #333;
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .amount-col {
                    text-align: right;
                }
                th.amount-col {
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="a4-page">
                <div class="report-body">
                    <div class="header-container">
                        <img src="https://uniprosg.com/wp-content/uploads/2024/09/unipro-logo-green-1.png" alt="Unipro Logo" class="logo" />
                        <div class="company-name">${orgInfo?.Name || "UNIPRO SOFTWARES SG PTE LTD"}</div>
                        <div class="company-address">
                            ${orgInfo?.Address1_Line1 || "45 KALLANG PUDDING ROAD"}, ${orgInfo?.Address1_City || "SINGAPORE"} ${orgInfo?.Address1_PostalCode || "349317"}<br/>
                            Phone: ${orgInfo?.Address1_Telephone1 || "65130000"}
                        </div>
                    </div>
                    
                    <div class="report-title">DAY END REPORT</div>
                    
                    <div class="report-info">
                        <strong>Date:</strong> ${dateRangeFormatted} &nbsp;&nbsp;|&nbsp;&nbsp;
                        <strong>Cashier:</strong> ${reportData.cashier || "System"} &nbsp;&nbsp;|&nbsp;&nbsp;
                        <strong>RefNo:</strong> ${reportData.refNo || "1"}
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>PARTICULARS</th>
                                <th class="amount-col">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Sales Detail Section -->
                            <tr class="section-head">
                                <td colspan="2">Sales Detail</td>
                            </tr>
                            <tr>
                                <td>Total Sales</td>
                                <td class="amount-col">${(reportData.salesDetail?.totalSales || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Round Off</td>
                                <td class="amount-col">${(reportData.salesDetail?.roundOff || 0).toFixed(2)}</td>
                            </tr>
                            <tr class="total-row">
                                <td>Total</td>
                                <td class="amount-col">${(reportData.salesDetail?.netTotal || 0).toFixed(2)}</td>
                            </tr>
                            
                            <!-- Paymode Detail Section -->
                            <tr class="section-head">
                                <td colspan="2">Paymode Detail</td>
                            </tr>
                            <tr>
                            <td>
                                <table style="width: 100%; border: none !important; margin: 0 !important; padding: 0 !important; background: transparent !important;">
                                    <tr>
                                        <td style="border: none !important; padding: 0 !important; text-align: left !important; background: transparent !important; color: inherit !important; font-weight: inherit !important;">CASH</td>
                                        <td style="border: none !important; padding: 0 !important; text-align: right !important; background: transparent !important; color: inherit !important; font-weight: inherit !important;">${reportData.receiptCount || 0}</td>
                                    </tr>
                                </table>
                            </td>
                            <td class="amount-col">${Object.values(reportData.paymodeDetail || {})[0]?.toFixed(2) || 0}</td>
                        </tr>
                            <tr class="total-row">
                                <td>Total</td>
                                <td class="amount-col">${Object.values(reportData.paymodeDetail || {}).reduce((a, b) => a + b, 0).toFixed(2)}</td>
                            </tr>
                            
                            <!-- Settlement Detail Section -->
                            <tr class="section-head">
                                <td colspan="2">Settlement Detail</td>
                            </tr>
                            <tr>
                                <td>Cash Total</td>
                                <td class="amount-col">${(reportData.settlementDetail?.cashTotal || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Other Total</td>
                                <td class="amount-col">${(reportData.settlementDetail?.otherTotal || 0).toFixed(2)}</td>
                            </tr>
                            
                            <!-- Analysis Section -->
                            <tr class="section-head">
                                <td colspan="2">Analysis</td>
                            </tr>
                            <tr>
                                <td>Sales Amount</td>
                                <td class="amount-col">${(reportData.analysis?.salesAmount || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>No of Bills</td>
                                <td class="amount-col">${reportData.analysis?.noOfBills || 0}</td>
                            </tr>
                            <tr>
                                <td>Avg/Bill</td>
                                <td class="amount-col">${(reportData.analysis?.avgPerBill || 0).toFixed(2)}</td>
                            </tr>
                            
                            <!-- Void Detail Section -->
                            <tr class="section-head">
                                <td colspan="2">Void Detail</td>
                            </tr>
                            <tr>
                                <td>Void Item Qty</td>
                                <td class="amount-col">${reportData.voidDetail?.voidItemQty || 0}</td>
                            </tr>
                            <tr>
                                <td>Void Item Amount</td>
                                <td class="amount-col">${(reportData.voidDetail?.voidItemAmount || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="print-bottom-wrapper" style="margin-top: 300px; padding: 10px 20px; page-break-inside: avoid;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; font-family: 'Cambria', 'Times New Roman', serif;">
                        
                        <!-- Left Side -->
                        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 30px;">
                            <div style="border-top: 1px solid #333; width: 180px; padding-top: 5px; text-align: center; font-size: 11px; color: #333;">
                                Cashier Signature
                            </div>
                            <span style="color: #95a5a6; font-size: 10px;">Printed On: ${printDate} ${printTime}</span>
                        </div>

                        <!-- Right Side -->
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 30px;">
                            <div style="border-top: 1px solid #333; width: 180px; padding-top: 5px; text-align: center; font-size: 11px; color: #333;">
                                Authorized Signature
                            </div>
                            <span style="color: #95a5a6; font-size: 10px;">Powered by UNIPRO</span>
                        </div>

                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `DayEndReport_${dateRangeText}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`dayend-report ${sidebarOpen ? "sidebar-open" : ""}`}>
            <div className="dayend-header-title">Day End Report</div>

            <div className="dayend-filter-container">
                <div className="dayend-filter-row">

                    <div className="dayend-filter-item">
                        <label>DAYEND DATE</label>
                        <input
                            type="date"
                            className="dayend-date-picker"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setToDate(e.target.value);
                            }}
                        />
                    </div>

                    <div className="dayend-generate-row">
                        <button
                            className="dayend-btn-generate"
                            onClick={handleGenerate}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Generate"}
                        </button>

                        {reportData && (
                            <button
                                className="dayend-download-btn"
                                onClick={handleDownload}
                            >
                                <span style={{ marginRight: "8px" }}>⬇️</span>
                                Report
                            </button>
                        )}
                    </div>

                </div>
            </div>



            <div className="dayend-table-container">
                {loading ? (
                    <div className="dayend-empty">Loading...</div>
                ) : showResults && reportData ? (
                    <div className="dayend-table-wrapper">
                        <table className="dayend-table">
                            <thead>
                                <tr>
                                    <th>Particulars</th>
                                    <th className="dayend-th-center">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Sales Detail Section */}
                                <tr className="dayend-section-header">
                                    <td colSpan="2">Sales Detail</td>
                                </tr>
                                <tr>
                                    <td>Total Sales</td>
                                    <td className="dayend-text-center">{(reportData.salesDetail?.totalSales || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Round Off</td>
                                    <td className="dayend-text-center">{(reportData.salesDetail?.roundOff || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="dayend-total-row">
                                    <td><strong>Total</strong></td>
                                    <td className="dayend-text-center"><strong>{(reportData.salesDetail?.netTotal || 0).toFixed(2)}</strong></td>
                                </tr>

                                {/* Paymode Detail Section */}
                                <tr className="dayend-section-header">
                                    <td colSpan="2">Paymode Detail</td>
                                </tr>
                                {Object.entries(reportData.paymodeDetail || {}).map(([key, value]) => (
                                    <tr key={key}>
                                        <td className="dayend-particulars-cell">
                                            <span>{key}</span>
                                            <span className="dayend-particulars-right">{reportData.receiptCount || 0}</span>
                                        </td>
                                        <td className="dayend-text-center">{(value || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr className="dayend-total-row">
                                    <td><strong>Total</strong></td>
                                    <td className="dayend-text-center"><strong>{Object.values(reportData.paymodeDetail || {}).reduce((a, b) => a + b, 0).toFixed(2)}</strong></td>
                                </tr>

                                {/* Settlement Detail Section */}
                                <tr className="dayend-section-header">
                                    <td colSpan="2">Settlement Detail</td>
                                </tr>
                                <tr>
                                    <td>Cash Total</td>
                                    <td className="dayend-text-center">{(reportData.settlementDetail?.cashTotal || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Other Total</td>
                                    <td className="dayend-text-center">{(reportData.settlementDetail?.otherTotal || 0).toFixed(2)}</td>
                                </tr>

                                {/* Analysis Section */}
                                <tr className="dayend-section-header">
                                    <td colSpan="2">Analysis</td>
                                </tr>
                                <tr>
                                    <td>Sales Amount</td>
                                    <td className="dayend-text-center">{(reportData.analysis?.salesAmount || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>No of Bills</td>
                                    <td className="dayend-text-center">{reportData.analysis?.noOfBills || 0}</td>
                                </tr>
                                <tr>
                                    <td>Avg/Bill</td>
                                    <td className="dayend-text-center">{(reportData.analysis?.avgPerBill || 0).toFixed(2)}</td>
                                </tr>

                                {/* Void Detail Section */}
                                <tr className="dayend-section-header">
                                    <td colSpan="2">Void Detail</td>
                                </tr>
                                <tr>
                                    <td>Void Item Qty</td>
                                    <td className="dayend-text-center">{reportData.voidDetail?.voidItemQty || 0}</td>
                                </tr>
                                <tr>
                                    <td>Void Item Amount</td>
                                    <td className="dayend-text-center">{(reportData.voidDetail?.voidItemAmount || 0).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="dayend-empty">Select date and click Generate to see results</div>
                )}
            </div>
        </div>
    );
};

export default DayEndReport;