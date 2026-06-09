import { API_BASE_URL } from "../config/config";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DayEndReport.css';

const DayEndReport = ({ sidebarOpen }) => {
    const [selectedDate, setSelectedDate] = useState("2025-11-21");
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
                params: { fromDate: selectedDate, toDate: selectedDate }
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
        const selectedDateFormatted = formatDate(selectedDate);

        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Day End Report - ${selectedDate}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Open Sans', Arial, sans-serif; }
                body {
                    background: #dce3ea;
                    margin: 0;
                    padding: 30px;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                }
                .a4-page {
                    background: #ffffff;
                    width: 210mm;
                    min-height: 297mm;
                    padding: 18mm 20mm 15mm 20mm;
                    box-sizing: border-box;
                    box-shadow: 0 2px 20px rgba(0,0,0,0.15);
                    border-radius: 3px;
                    color: #333;
                    display: flex;
                    flex-direction: column;
                }
                .report-body { flex-grow: 1; }
                @media print {
                    @page { margin: 8mm; size: A4; }
                    body { background: white; padding: 0; margin: 0; display: block; }
                    .a4-page { box-shadow: none; width: 100% !important; min-height: auto; padding: 5mm 8mm !important; margin: 0; border: none; display: flex; flex-direction: column; border-radius: 0; }
                    th, td { padding: 5px 8px !important; font-size: 9px !important; }
                    .header-container { margin-bottom: 10px; padding-bottom: 8px; }
                    .report-title-section { margin: 8px 0; }
                    .report-info { margin-bottom: 10px; padding: 5px 8px; font-size: 10px; }
                    .signature { margin-top: 20px; }
                    .footer { margin-top: 10px; }
                }
                /* ── HEADER ─────────────────────────────── */
                .header-container {
                    display: flex;
                    align-items: center;
                    padding-bottom: 12px;
                    margin-bottom: 14px;
                    border-bottom: 1.5px solid #3d6275;
                }
                .logo-wrap { flex: 0 0 90px; }
                .logo { max-width: 85px; max-height: 55px; }
                .company-info { flex: 1; text-align: center; }
                .company-name {
                    font-size: 17px;
                    font-weight: 700;
                    color: #1a3a5f;
                    letter-spacing: 0.3px;
                }
                .company-address {
                    font-size: 10.5px;
                    color: #7a8fa6;
                    margin-top: 3px;
                    line-height: 1.5;
                }
                /* ── REPORT TITLE ───────────────────────── */
                .report-title-section {
                    text-align: center;
                    margin: 12px 0 10px 0;
                }
                .report-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #2c3e50;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                /* ── PERIOD/INFO BOX ────────────────────── */
                .report-info {
                    text-align: center;
                    border: 1px solid #d0dae3;
                    background: #f7f9fb;
                    padding: 8px 15px;
                    font-size: 11.5px;
                    color: #2c3e50;
                    margin-bottom: 14px;
                    border-radius: 2px;
                }
                .report-info strong { color: #2c3e50; }
                /* ── TABLE ──────────────────────────────── */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 0;
                    font-size: 11px;
                }
                /* Table header row */
                thead tr th {
                    background: #2d4a65;
                    color: #ffffff;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    padding: 9px 12px;
                    border: none;
                    letter-spacing: 0.3px;
                }
                thead tr th:first-child { text-align: left; }
                thead tr th.amount-col { text-align: right; }
                /* Section header rows */
                .section-head td {
                    background: #e6f0f5 !important;
                    color: #1e6fa8;
                    font-weight: 700;
                    font-size: 11px;
                    padding: 7px 12px;
                    border-top: 1px solid #cddce8;
                    border-bottom: 1px solid #cddce8;
                }
                /* Data rows */
                tbody tr td {
                    padding: 7px 12px;
                    border-bottom: 1px solid #e8edf2;
                    color: #2980b9;
                    font-size: 11px;
                    vertical-align: middle;
                }
                tbody tr td.amount-col {
                    text-align: right;
                    color: #2c3e50;
                    font-weight: 500;
                }
                /* Total rows */
                .total-row td {
                    background: #f0f4f7 !important;
                    color: #1a3a5f !important;
                    font-weight: 700 !important;
                    padding: 7px 12px;
                    border-top: 1px solid #cddce8;
                    border-bottom: 1px solid #cddce8;
                }
                .total-row td.amount-col {
                    text-align: right;
                    color: #1a3a5f !important;
                }
                /* ── SIGNATURE ──────────────────────────── */
                .signature {
                    margin-top: 70px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10.5px;
                    color: #555;
                }
                .sig-block { text-align: center; }
                .sig-line {
                    border-top: 1px solid #555;
                    width: 170px;
                    padding-top: 5px;
                }
                /* ── FOOTER ─────────────────────────────── */
                .footer {
                    margin-top: 18px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 9.5px;
                    color: #a0b0be;
                    padding-top: 8px;
                    border-top: 1px solid #e8edf2;
                }
                .amount-col { text-align: right; }
                .particulars-col { display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <div class="a4-page">
                <div class="report-body">
                    <div class="header-container">
                        <div class="logo-wrap">
                            <img src="https://uniprosg.com/wp-content/uploads/2024/09/unipro-logo-green-1.png" alt="Unipro Logo" class="logo" />
                        </div>
                        <div class="company-info">
                            <div class="company-name">${orgInfo?.Name || "UNIPRO SOFTWARES SG PTE LTD"}</div>
                            <div class="company-address">
                                ${orgInfo?.Address1_Line1 || "45 KALLANG PUDDING ROAD"}, ${orgInfo?.Address1_City || "SINGAPORE"} ${orgInfo?.Address1_PostalCode || "349317"}<br/>
                                Phone: ${orgInfo?.Address1_Telephone1 || "65130000"}
                            </div>
                        </div>
                        <div style="flex:0 0 90px;"></div>
                    </div>
                    
                    <div class="report-title-section">
                        <div class="report-title">DAY END REPORT</div>
                    </div>
                    
                    <div class="report-info">
                        <strong>Date:</strong> <span style="color:#2980b9">${selectedDateFormatted}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
                        <strong>Cashier:</strong> <span style="color:#2980b9">${reportData.cashier || "System"}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
                        <strong>RefNo:</strong> <span style="color:#2980b9">${reportData.refNo || "1"}</span>
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
 
                <div class="signature">
                    <div class="sig-block">
                        <div class="sig-line" style="color:#2980b9">Cashier Signature</div>
                    </div>
                    <div class="sig-block">
                        <div class="sig-line" style="color:#2980b9">Authorized Signature</div>
                    </div>
                </div>

                <div class="footer">
                    <span>Printed On: ${printDate} ${printTime}</span>
                    <span>Powered by UNIPRO</span>
                </div>
            </div>
        </body>
        </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `DayEndReport_${selectedDate}.html`;
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
            <label>DAY END DATE</label>
            <input
                type="date"
                className="dayend-date-picker"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
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