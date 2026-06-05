import { API_BASE_URL } from "../config/config";
import React, { useState } from "react";
import axios from "axios";
import "./DishMovementReport.css";

const DishMovementReport = ({ sidebarOpen }) => {
    const today = new Date().toISOString().split('T')[0];
    const [fromDate, setFromDate] = useState(today);
    const [fromTime, setFromTime] = useState("00:00");
    const [toDate, setToDate] = useState(today);
    const [toTime, setToTime] = useState("23:59");
    const [reportType, setReportType] = useState("detail");
    const [activeOnly, setActiveOnly] = useState(true);
    const [category, setCategory] = useState("");
    const [dishGroup, setDishGroup] = useState("");
    const [dishName, setDishName] = useState("");
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [orgData, setOrgData] = useState(null);

    // Fetch org data on mount
    React.useEffect(() => {
        axios.get(API_BASE_URL + '/api/organization')
            .then(res => setOrgData(res.data))
            .catch(err => console.error("Org fetch error:", err));
    }, []);

    const [showLookup, setShowLookup] = useState(false);
    const [lookupType, setLookupType] = useState("");
    const [lookupData, setLookupData] = useState([]);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const formatDate = (d) => {
        if (!d) return "";
        const p = d.split("-");
        return `${p[2]}-${p[1]}-${p[0]}`;
    };

    const handleGenerate = async () => {
        if (!fromDate || !toDate) {
            alert("Please select From Date and To Date");
            return;
        }
        /*
        if (!category || !dishGroup || !dishName) {
            alert("Please select Category, Dishgroup, and DishName to generate the report.");
            return;
        }
        */
        setLoading(true);
        try {
            const startDateTime = `${fromDate}T${fromTime}:00`;
            const endDateTime = `${toDate}T${toTime}:59`;
            const res = await axios.get(API_BASE_URL + "/api/dishmovementreport", {
                params: {
                    type: reportType,
                    fromDate: startDateTime,
                    toDate: endDateTime,
                    category: (category || "").trim(),
                    dishGroup: (dishGroup || "").trim(),
                    dishName: (dishName || "").trim(),
                    active: activeOnly
                }
            });
            if (res.data.success) {
                setReportData(res.data);
            } else {
                alert("Backend Error: " + res.data.error);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            alert("Failed to fetch report.");
        } finally {
            setLoading(false);
        }
    };

    const openLookup = async (type) => {
        setLookupType(type);
        setShowLookup(true);
        setLookupLoading(true);
        setSearchTerm("");
        try {
            let endpoint = "";
            let params = {};
            if (type === "category") endpoint = "categories";
            else if (type === "dishgroup") {
                endpoint = "dishgroups";
                if (category) params.category = category;
            } else if (type === "dish") {
                endpoint = "dishes";
                if (dishGroup) params.dishGroup = dishGroup;
            }

            const res = await axios.get(`${API_BASE_URL}/api/lookup/${endpoint}`, { params });
            if (res.data.success) {
                setLookupData(res.data.data);
            }
        } catch (err) {
            console.error("Lookup error:", err);
        } finally {
            setLookupLoading(false);
        }
    };

    const selectLookupValue = (val) => {
        if (lookupType === "category") {
            setCategory(val);
            setDishGroup("");
            setDishName("");
        }
        else if (lookupType === "dishgroup") {
            setDishGroup(val);
            setDishName("");
        }
        else if (lookupType === "dish") {
            setDishName(val);
        }
        setShowLookup(false);
        setReportData(null);
    };

    const filteredLookup = lookupData.filter(item =>
        item && item.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownload = () => {
        if (!reportData) {
            alert("Please generate a report first");
            return;
        }

        const now = new Date();
        const printDate = now.toLocaleDateString('en-GB');
        const printTime = now.toLocaleTimeString('en-GB');

        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Dish Movement Report</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Inter', Arial, sans-serif;
                }
                body { 
                    background: #eef1f4; 
                    margin: 0; 
                    padding: 20px; 
                    display: flex; 
                    justify-content: center; 
                }
                .a4-page {
                    background: white;
                    width: 297mm;
                    min-height: 210mm;
                    padding: 20mm;
                    box-sizing: border-box;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    color: #333;
                    display: flex;
                    flex-direction: column;
                }
                .report-body {
                    flex-grow: 1;
                }
                @media print {
                    @page { margin: 5mm; size: A4 landscape; }
                    body { background: white; padding: 0; margin: 0; display: block; }
                    .a4-page { 
                        box-shadow: none; 
                        width: 100% !important; 
                        min-height: auto; 
                        padding: 5mm 10mm !important; 
                        margin: 0; 
                        border: none; 
                        display: flex;
                        flex-direction: column;
                    }
                    th, td { padding: 6px 10px !important; font-size: 10px; }
                    .header-container { margin-bottom: 15px; padding-bottom: 10px; }
                    .report-header-section { margin: 10px 0; }
                    .report-title { font-size: 12px; }
                    .report-info { margin-bottom: 15px; padding: 5px; font-size: 11px; }
                    .signature { margin-top: 30px; }
                }
                .header-container { 
                    position: relative; 
                    text-align: center; 
                    margin-bottom: 20px; 
                    min-height: 60px; 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: center; 
                    border-bottom: 1px solid #34495e;
                    padding-bottom: 15px;
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
                    font-weight: 700; 
                    color: #1a4971; 
                }
                .company-address { 
                    font-size: 11px; 
                    color: #7f8c8d; 
                    margin-top: 4px; 
                }
                .report-header-section {
                    margin: 15px 0;
                    text-align: center;
                }
                .report-title { 
                    font-size: 14px; 
                    font-weight: 700; 
                    color: #34495e; 
                    text-transform: uppercase; 
                }
                .report-info {
                    text-align: center;
                    margin-bottom: 15px;
                    font-size: 12px;
                    font-weight: 600;
                    border: 1px solid #e0e0e0;
                    padding: 10px;
                    background: #f8f9fa;
                    color: #333;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 10px 0; 
                    font-size: 11px; 
                }
                th, td { 
                    padding: 10px 12px; 
                    border: 1px solid #e0e0e0; 
                    text-align: left; 
                }
                th { 
                    background: #34495e; 
                    color: #ffffff; 
                    font-weight: 700; 
                    text-align: center;
                    text-transform: uppercase;
                    border: 1px solid #ffffff;
                }
                .section-head td {
                    background-color: #eaeff2 !important;
                    font-weight: 700;
                    color: #34495e;
                }
                .total-row td {
                    background-color: #f8f9fa !important;
                    font-weight: 700;
                }
                .amount-col {
                    text-align: right;
                }
                th.amount-col {
                    text-align: right;
                }
                .footer { 
                    margin-top: 30px;
                    font-size: 10px; 
                    color: #95a5a6; 
                    padding-top: 15px; 
                    display: flex; 
                    justify-content: space-between; 
                }
                .signature {
                    margin-top: 80px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: #333;
                }
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
                            <div class="company-name">${orgData?.Name || "UNIPRO SOFTWARES SG PTE LTD"}</div>
                            <div class="company-address">
                                ${orgData?.Address1_Line1 || "45 KALLANG PUDDING ROAD"}, ${orgData?.Address1_City || "SINGAPORE"} ${orgData?.Address1_PostalCode || "349317"}<br/>
                                Phone: ${orgData?.Address1_Telephone1 || "65130000"}
                            </div>
                        </div>
                        <div style="flex:0 0 90px;"></div>
                    </div>
                    
                    <div class="report-title-section">
                        <div class="report-title">DISH MOVEMENT ${reportType.toUpperCase()} REPORT</div>
                    </div>
                    
                    <div class="report-info">
                        <strong>Period:</strong> <span style="color:#2980b9">${formatDate(fromDate)} to ${formatDate(toDate)}</span>
                    </div>
                    ${reportType === "detail" ? `
                        ${(() => {
                    const grouped = reportData.data.reduce((acc, row) => {
                        const key = row.Code || 'Unknown';
                        if (!acc[key]) acc[key] = {
                            dishName: row.Name,
                            dishCode: row.Code,
                            categoryName: row.CategoryName,
                            dishGroupName: row.DishGroupName,
                            transactions: []
                        };
                        acc[key].transactions.push(row);
                        return acc;
                    }, {});

                    return Object.values(grouped).map(group => `
                                <div style="margin-bottom: 25px; border: 1px solid #eee; padding: 10px;">
                                    <div style="border-bottom: 2px solid #333; margin-bottom: 10px; padding-bottom: 5px;">
                                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px;">
                                            <span>Dish Code: ${group.dishCode}</span>
                                            <span>Dish Name: ${group.dishName}</span>
                                        </div>
                                        <div style="font-size: 10px; color: #555; margin-top: 3px;">
                                            Category: ${group.categoryName} | Dish Group: ${group.dishGroupName}
                                        </div>
                                    </div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th class="amount-col">Opening</th>
                                                <th class="amount-col">Purchase</th>
                                                <th class="amount-col">Pur. Ret</th>
                                                <th class="amount-col">Sales</th>
                                                <th class="amount-col">Sales Ret</th>
                                                <th class="amount-col">Closing</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${group.transactions.map(t => `
                                                <tr>
                                                    <td>${t.TranDate ? new Date(t.TranDate).toLocaleDateString('en-GB') : ''}</td>
                                                    <td class="amount-col">${(t.OpeningStock || 0).toFixed(2)}</td>
                                                    <td class="amount-col">${(t.PQty || 0).toFixed(2)}</td>
                                                    <td class="amount-col">${(t.PRQty || 0).toFixed(2)}</td>
                                                    <td class="amount-col">${(t.SQty || 0).toFixed(2)}</td>
                                                    <td class="amount-col">${(t.SRQty || 0).toFixed(2)}</td>
                                                    <td class="amount-col">${(t.ClosingStock || 0).toFixed(2)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `).join('');
                })()}
                    ` : `
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Dish Group</th>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th class="amount-col">Open</th>
                                    <th class="amount-col">PQty</th>
                                    <th class="amount-col">PRQty</th>
                                    <th class="amount-col">SQty</th>
                                    <th class="amount-col">SRQty</th>
                                    <th class="amount-col">Close</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reportData.data.map(r => `
                                    <tr>
                                        <td>${r.CategoryName || ''}</td>
                                        <td>${r.DishGroupName || ''}</td>
                                        <td>${r.Code || ''}</td>
                                        <td>${r.Name || ''}</td>
                                        <td class="amount-col">${(r.OpeningStock || 0).toFixed(2)}</td>
                                        <td class="amount-col">${(r.PQty || 0).toFixed(2)}</td>
                                        <td class="amount-col">${(r.PRQty || 0).toFixed(2)}</td>
                                        <td class="amount-col">${(r.SQty || 0).toFixed(2)}</td>
                                        <td class="amount-col">${(r.SRQty || 0).toFixed(2)}</td>
                                        <td class="amount-col">${(r.ClosingStock || 0).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                                <tr class="total-row">
                                    <td colspan="4">Grand Total</td>
                                    <td class="amount-col">${reportData.data.reduce((acc, r) => acc + (r.OpeningStock || 0), 0).toFixed(2)}</td>
                                    <td class="amount-col">${reportData.data.reduce((acc, r) => acc + (r.PQty || 0), 0).toFixed(2)}</td>
                                    <td class="amount-col">${reportData.data.reduce((acc, r) => acc + (r.PRQty || 0), 0).toFixed(2)}</td>
                                    <td class="amount-col">${reportData.data.reduce((acc, r) => acc + (r.SQty || 0), 0).toFixed(2)}</td>
                                    <td class="amount-col">${reportData.data.reduce((acc, r) => acc + (r.SRQty || 0), 0).toFixed(2)}</td>
                                    <td class="amount-col">${reportData.data.reduce((acc, r) => acc + (r.ClosingStock || 0), 0).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    `}
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
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Dish_Movement_Report_${fromDate}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const renderSummary = () => {
        const rows = reportData.data;
        let grandPQty = 0, grandPRQty = 0, grandSQty = 0, grandSRQty = 0;
        let grandOpen = 0, grandClose = 0;

        return (
            <table className="der-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead>
                    <tr>
                        <th style={{ width: '15%' }}>Category</th>
                        <th style={{ width: '15%' }}>Dish Group</th>
                        <th style={{ width: '8%' }}>Code</th>
                        <th style={{ width: '12%' }}>Name</th>
                        <th className="der-th-center" style={{ width: '8%' }}>Open</th>
                        <th className="der-th-center" style={{ width: '8%' }}>PQty</th>
                        <th className="der-th-center" style={{ width: '8%' }}>PRQty</th>
                        <th className="der-th-center" style={{ width: '8%' }}>SQty</th>
                        <th className="der-th-center" style={{ width: '8%' }}>SRQty</th>
                        <th className="der-th-center" style={{ width: '10%' }}>Close</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => {
                        grandPQty += r.PQty || 0; grandPRQty += r.PRQty || 0;
                        grandSQty += r.SQty || 0; grandSRQty += r.SRQty || 0;
                        grandOpen += r.OpeningStock || 0; grandClose += r.ClosingStock || 0;
                        return (
                            <tr key={i}>
                                <td>{r.CategoryName}</td>
                                <td>{r.DishGroupName}</td>
                                <td>{r.Code}</td>
                                <td>{r.Name}</td>
                                <td className="der-text-center">{(r.OpeningStock || 0).toFixed(2)}</td>
                                <td className="der-text-center">{(r.PQty || 0).toFixed(2)}</td>
                                <td className="der-text-center">{(r.PRQty || 0).toFixed(2)}</td>
                                <td className="der-text-center">{(r.SQty || 0).toFixed(2)}</td>
                                <td className="der-text-center">{(r.SRQty || 0).toFixed(2)}</td>
                                <td className="der-text-center">{(r.ClosingStock || 0).toFixed(2)}</td>
                            </tr>
                        );
                    })}
                    <tr className="der-total-row">
                        <td colSpan="4">Grand Total</td>
                        <td className="der-text-center">{grandOpen.toFixed(2)}</td>
                        <td className="der-text-center">{grandPQty.toFixed(2)}</td>
                        <td className="der-text-center">{grandPRQty.toFixed(2)}</td>
                        <td className="der-text-center">{grandSQty.toFixed(2)}</td>
                        <td className="der-text-center">{grandSRQty.toFixed(2)}</td>
                        <td className="der-text-center">{grandClose.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        );
    };

    const renderDetail = () => {
        const rows = reportData.data;
        if (!rows || rows.length === 0) return <div className="der-empty">No records found</div>;

        // Group rows by Dish Code
        const groupedData = rows.reduce((acc, row) => {
            const key = row.Code || 'Unknown';
            if (!acc[key]) acc[key] = {
                dishName: row.Name,
                dishCode: row.Code,
                categoryName: row.CategoryName,
                dishGroupName: row.DishGroupName,
                transactions: []
            };
            acc[key].transactions.push(row);
            return acc;
        }, {});

        return (
            <div className="dish-movement-detail-container" style={{ width: '100%' }}>
                {Object.values(groupedData).map((group, gIdx) => (
                    <div key={gIdx} className="dish-group-section" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '30px', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                        <div className="dish-detail-header" style={{ borderBottom: '2px solid #34495e', marginBottom: '10px', paddingBottom: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                                <span>Dish Code: {group.dishCode}</span>
                                <span>Dish Name: {group.dishName}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', textAlign: 'left' }}>
                                <span>Category: {group.categoryName}</span> | <span>Dish Group: {group.dishGroupName}</span>
                            </div>
                        </div>
                        <table className="der-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '15%' }}>Date</th>
                                    <th className="der-th-center" style={{ width: '14%' }}>Opening</th>
                                    <th className="der-th-center" style={{ width: '14%' }}>Purchase</th>
                                    <th className="der-th-center" style={{ width: '14%' }}>Pur. Ret</th>
                                    <th className="der-th-center" style={{ width: '14%' }}>Sales</th>
                                    <th className="der-th-center" style={{ width: '14%' }}>Sales Ret</th>
                                    <th className="der-th-center" style={{ width: '15%' }}>Closing</th>
                                </tr>
                            </thead>
                            <tbody>
                                {group.transactions.map((t, i) => (
                                    <tr key={i}>
                                        <td style={{ textAlign: 'left' }}>{t.TranDate ? new Date(t.TranDate).toLocaleDateString('en-GB') : ''}</td>
                                        <td className="der-text-center">{(t.OpeningStock || 0).toFixed(2)}</td>
                                        <td className="der-text-center">{(t.PQty || 0).toFixed(2)}</td>
                                        <td className="der-text-center">{(t.PRQty || 0).toFixed(2)}</td>
                                        <td className="der-text-center">{(t.SQty || 0).toFixed(2)}</td>
                                        <td className="der-text-center">{(t.SRQty || 0).toFixed(2)}</td>
                                        <td className="der-text-center">{(t.ClosingStock || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={`dish-movement-report ${sidebarOpen ? "sidebar-open" : ""}`}>
            <div className="der-header-title">Dish Movement Report</div>

            <div className="der-filter-container">
                <div className="der-filter-row">
                    <div className="der-filter-item">
                        <label>Report Type</label>
                        <select value={reportType} onChange={e => { setReportType(e.target.value); setReportData(null); }}>
                            <option value="summary">Summary</option>
                            <option value="detail">Detail</option>
                        </select>
                    </div>
                    <div className="der-filter-item">
                        <label>From Date</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input type="date" className="der-date-picker" value={fromDate} onChange={e => { setFromDate(e.target.value); setReportData(null); }} />
                            <input type="time" className="der-date-picker" value={fromTime} onChange={e => { setFromTime(e.target.value); setReportData(null); }} style={{ width: '80px' }} />
                        </div>
                    </div>
                    <div className="der-filter-item">
                        <label>To Date</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input type="date" className="der-date-picker" value={toDate} onChange={e => { setToDate(e.target.value); setReportData(null); }} />
                            <input type="time" className="der-date-picker" value={toTime} onChange={e => { setToTime(e.target.value); setReportData(null); }} style={{ width: '80px' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '15px' }}>
                        <input type="checkbox" id="dmr-active" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />
                        <label htmlFor="dmr-active" style={{ fontSize: '11px', fontWeight: 'bold' }}>Active Only</label>
                    </div>
                </div>

                <div className="der-filter-row">
                    <div className="der-filter-item">
                        <label>Category</label>
                        <div className="der-lookup-wrap">
                            <input type="text" value={category} onChange={e => {
                                setCategory(e.target.value);
                                setDishGroup("");
                                setDishName("");
                                setReportData(null);
                            }} placeholder="All" />
                            <button className="der-lookup-btn" onClick={() => openLookup("category")}>…</button>
                        </div>
                    </div>
                    <div className="der-filter-item">
                        <label>Dishgroup</label>
                        <div className="der-lookup-wrap">
                            <input type="text" value={dishGroup} onChange={e => {
                                setDishGroup(e.target.value);
                                setDishName("");
                                setReportData(null);
                            }} placeholder="All" />
                            <button className="der-lookup-btn" onClick={() => openLookup("dishgroup")}>…</button>
                        </div>
                    </div>
                    <div className="der-filter-item">
                        <label>DishName</label>
                        <div className="der-lookup-wrap">
                            <input type="text" value={dishName} onChange={e => { setDishName(e.target.value); setReportData(null); }} placeholder="All" />
                            <button className="der-lookup-btn" onClick={() => openLookup("dish")}>…</button>
                        </div>
                    </div>
                    <div className="der-generate-row">
                        <button className="der-btn-generate" onClick={handleGenerate} disabled={loading}>
                            {loading ? "Loading..." : "Generate"}
                        </button>
                        {reportData && (
                            <button className="der-download-btn" onClick={handleDownload} title="Download Report" style={{ marginLeft: '10px' }}>
                                <span style={{ marginRight: '8px' }}>⬇️</span> Report
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="der-table-container">
                <div className="der-table-wrapper">
                    {loading ? (
                        <div className="der-empty">Loading...</div>
                    ) : reportData ? (
                        reportType === "summary" ? renderSummary() : renderDetail()
                    ) : (
                        <div className="der-empty">Select filters and click Generate to see results</div>
                    )}
                </div>
            </div>

            {/* Lookup Modal */}
            {showLookup && (
                <div className="der-modal-overlay">
                    <div className="der-modal-content">
                        <div className="der-modal-header">
                            <span>Select {lookupType.charAt(0).toUpperCase() + lookupType.slice(1)}</span>
                            <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }} onClick={() => setShowLookup(false)}>×</button>
                        </div>
                        <div className="der-modal-body">
                            <div className="der-modal-search">
                                <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
                            </div>
                            <div className="der-modal-list">
                                <ul>
                                    <li className="der-all-option" onClick={() => selectLookupValue("")}>[ ALL ]</li>
                                    {lookupLoading ? (
                                        <li style={{ textAlign: 'center' }}>Loading...</li>
                                    ) : filteredLookup.map((item, idx) => (
                                        <li key={idx} onClick={() => selectLookupValue(item)}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DishMovementReport;
