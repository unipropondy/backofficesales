import { API_BASE_URL } from "../config/config";
import React, { useState } from 'react';
import axios from 'axios';
import './DishMovement.css';

const DishMovement = ({ sidebarOpen }) => {
    const today = new Date().toISOString().split('T')[0];
    const [fromDate, setFromDate] = useState(today);
    const [fromTime, setFromTime] = useState("00:00");
    const [toDate, setToDate] = useState(today);
    const [toTime, setToTime] = useState("23:59");
    const [category, setCategory] = useState("");
    const [dishGroup, setDishGroup] = useState("");
    const [dishName, setDishName] = useState("");
    const [activeOnly, setActiveOnly] = useState(true);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    // Lookup state
    const [showLookup, setShowLookup] = useState(false);
    const [lookupType, setLookupType] = useState("");
    const [lookupData, setLookupData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [lookupLoading, setLookupLoading] = useState(false);
    const [orgData, setOrgData] = useState(null);

    React.useEffect(() => {
        axios.get(API_BASE_URL + '/api/organization')
            .then(res => setOrgData(res.data))
            .catch(err => console.error("Org fetch error:", err));
    }, []);

    const formatDateForReport = (dateStr) => {
        if (!dateStr) return "";
        const dateOnly = dateStr.split('T')[0];
        const parts = dateOnly.split("-");
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    const handleDownload = () => {
        if (!data || data.length === 0) {
            alert("Please fetch data first.");
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
            <title>Dish Movement Transaction Report</title>
            <style>
                /* Cambria is a standard Windows font, so no @import needed, but we'll fall back to serif */
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Cambria', serif;
                }
                body { 
                    font-family: 'Cambria', serif; 
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
                @media print {
                    @page { margin: 5mm; }
                    body { background: white; padding: 0; margin: 0; display: block; }
                    .a4-page { 
                        box-shadow: none; 
                        width: 100% !important; 
                        min-height: 282mm; 
                        padding: 5mm 10mm !important; 
                        margin: 0; 
                        border: none; 
                        display: flex;
                        flex-direction: column;
                    }
                    th, td { padding: 6px 8px !important; font-size: 9px; }
                    .header-container { margin-bottom: 15px; padding-bottom: 10px; }
                    .report-title { margin: 10px 0; font-size: 12px; }
                    .report-info { margin-bottom: 15px; padding: 5px; font-size: 11px; }
                    .signature { margin-top: 30px; }
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
                }
                .company-address { 
                    font-size: 11px; 
                    color: #7f8c8d; 
                    margin-top: 4px; 
                }
                .report-title { 
                    text-align: center; 
                    font-size: 14px; 
                    font-weight: bold; 
                    margin: 20px 0; 
                    color: #34495e; 
                    text-transform: uppercase; 
                }
                .report-info {
                    text-align: center;
                    margin-bottom: 25px;
                    font-size: 12px;
                    border: 1px solid #e0e0e0;
                    padding: 8px;
                    background: #f8f9fa;
                    color: #333;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0; 
                    font-size: 10px; 
                }
                th, td { 
                    padding: 10px 12px; 
                    border: 1px solid #e0e0e0; 
                    text-align: left; 
                }
                th { 
                    background: #34495e; 
                    color: #ffffff; 
                    font-weight: bold; 
                    text-transform: uppercase;
                    text-align: center;
                }
                .section-head td {
                    background-color: #eaeff2 !important;
                    font-weight: bold;
                    color: #34495e;
                }
                .total-row td {
                    background-color: #f8f9fa !important;
                    font-weight: bold;
                }
                .footer { 
                    margin-top: 40px;
                    font-size: 10px; 
                    color: #95a5a6; 
                    padding-top: 15px; 
                    display: flex; 
                    justify-content: space-between; 
                }
                .signature {
                    margin-top: 60px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: #333;
                }
                .amount-col {
                    text-align: right;
                }
            </style>
        </head>
        <body>
            <div class="a4-page">
                <div class="report-body">
                    <div class="header-container">
                        <img src="https://uniprosg.com/wp-content/uploads/2024/09/unipro-logo-green-1.png" alt="Unipro Logo" class="logo" />
                        <div class="company-name">${orgData?.Name || "UNIPRO SOFTWARES SG PTE LTD"}</div>
                        <div class="company-address">
                            ${orgData?.Address1_Line1 || "45 KALLANG PUDDING ROAD"}, ${orgData?.Address1_City || "SINGAPORE"} ${orgData?.Address1_PostalCode || "349317"}<br/>
                            Phone: ${orgData?.Address1_Telephone1 || "65130000"}
                        </div>
                    </div>
                    <div class="report-title">DISH MOVEMENT TRANSACTION</div>
                    <div class="report-info">Period: ${formatDateForReport(fromDate)} ${fromTime} to ${formatDateForReport(toDate)} ${toTime}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>DishGroup</th>
                                <th>Dish Name</th>
                                <th>TranDate</th>
                                <th class="amount-col">Open</th>
                                <th class="amount-col">PQty</th>
                                <th class="amount-col">PRQty</th>
                                <th class="amount-col">SQty</th>
                                <th class="amount-col">SRQty</th>
                                <th class="amount-col">Close</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(r => `
                                <tr>
                                    <td>${r['Category Name'] || ''}</td>
                                    <td>${r['DishGroup Name'] || ''}</td>
                                    <td>${r['DishName'] || ''}</td>
                                    <td>${r['TranDate'] || ''}</td>
                                    <td class="amount-col">${(r['Opening Stock'] || 0).toFixed(2)}</td>
                                    <td class="amount-col">${(r['PQty'] || 0).toFixed(2)}</td>
                                    <td class="amount-col">${(r['PRQty'] || 0).toFixed(2)}</td>
                                    <td class="amount-col">${(r['SQty'] || 0).toFixed(2)}</td>
                                    <td class="amount-col">${(r['SRQty'] || 0).toFixed(2)}</td>
                                    <td class="amount-col">${(r['Closing Stock'] || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="signature">
                    <div>
                        <div style="border-top: 1px solid #333; width: 180px; padding-top: 5px; text-align: center;">Cashier Signature</div>
                    </div>
                    <div>
                        <div style="border-top: 1px solid #333; width: 180px; padding-top: 5px; text-align: center;">Authorized Signature</div>
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
        link.download = `Dish_Movement_Transaction_${fromDate}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleGenerate = async () => {
        /*
        if (!category || !dishGroup || !dishName) {
            alert("Please select Category, Dishgroup, and DishName to fetch data.");
            return;
        }
        */
        setLoading(true);
        setData([]);
        try {
            const startDateTime = `${fromDate}T${fromTime}:00`;
            const endDateTime = `${toDate}T${toTime}:59`;
            const res = await axios.get(API_BASE_URL + '/api/dishmovement', {
                params: {
                    type: 'detail',
                    fromDate: startDateTime,
                    toDate: endDateTime,
                    category,
                    dishGroup,
                    dishName,
                    active: activeOnly
                }
            });
            if (res.data.success) {
                setData(res.data.data);
                setHasFetched(true);
            } else {
                alert("Backend Error: " + (res.data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("API Connection Error:", err);
            alert("Failed to connect to backend server.");
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
            if (type === "category") {
                endpoint = API_BASE_URL + "/api/lookup/categories";
            } else if (type === "dishgroup") {
                endpoint = API_BASE_URL + "/api/lookup/dishgroups";
                if (category) params.category = category;
            } else if (type === "dish") {
                endpoint = API_BASE_URL + "/api/lookup/dishes";
                if (dishGroup) params.dishGroup = dishGroup;
            }

            const res = await axios.get(endpoint, { params });
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
        setData([]);
    };

    const filteredLookup = lookupData.filter(item =>
        item && item.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`dish-movement ${sidebarOpen ? "sidebar-open" : ""}`}>
            <div className="der-header-title" style={{ color: '#34495e' }}>Dish Movement</div>

            <div className="der-filter-container">
                <div className="der-filter-row">
                    <div className="der-filter-item">
                        <label>From Date</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input type="date" className="der-date-picker" value={fromDate} onChange={e => { setFromDate(e.target.value); setData([]); }} />
                            <input type="time" className="der-date-picker" value={fromTime} onChange={e => { setFromTime(e.target.value); setData([]); }} style={{ width: '80px' }} />
                        </div>
                    </div>
                    <div className="der-filter-item">
                        <label>To Date</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input type="date" className="der-date-picker" value={toDate} onChange={e => { setToDate(e.target.value); setData([]); }} />
                            <input type="time" className="der-date-picker" value={toTime} onChange={e => { setToTime(e.target.value); setData([]); }} style={{ width: '80px' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '15px' }}>
                        <input type="checkbox" id="dm-active" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />
                        <label htmlFor="dm-active" style={{ fontSize: '11px', fontWeight: 'bold' }}>Active Only</label>
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
                                setData([]);
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
                                setData([]);
                            }} placeholder="All" />
                            <button className="der-lookup-btn" onClick={() => openLookup("dishgroup")}>…</button>
                        </div>
                    </div>
                    <div className="der-filter-item">
                        <label>DishName</label>
                        <div className="der-lookup-wrap">
                            <input type="text" value={dishName} onChange={e => { setDishName(e.target.value); setData([]); }} placeholder="All" />
                            <button className="der-lookup-btn" onClick={() => openLookup("dish")}>…</button>
                        </div>
                    </div>
                    <div className="der-generate-row">
                        <button className="der-btn-generate" onClick={handleGenerate} disabled={loading} style={{ backgroundColor: '#d1477d', color: 'white', fontWeight: 'bold' }}>
                            {loading ? "Loading..." : "Fetch"}
                        </button>
                        {data.length > 0 && (
                            <button className="der-download-btn" onClick={handleDownload} title="Download Report" style={{ marginLeft: '10px' }}>
                                <span style={{ marginRight: '8px' }}>⬇️</span> Report
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="der-table-container">
                <div className="der-table-wrapper">
                    <table className="der-table">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>DishGroup Name</th>
                                <th>DishName</th>
                                <th>TranDate</th>
                                <th className="der-th-center">Opening Stock</th>
                                <th className="der-th-center">PQty</th>
                                <th className="der-th-center">PRQty</th>
                                <th className="der-th-center">SQty</th>
                                <th className="der-th-center">SRQty</th>
                                <th className="der-th-center">Closing Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="der-empty">
                                        {loading ? "Fetching data..." : hasFetched ? "No data found" : "Select filters and click Fetch to see results"}
                                    </td>
                                </tr>
                            ) : data.map((r, i) => (
                                <tr key={i}>
                                    <td>{r['Category Name']}</td>
                                    <td>{r['DishGroup Name']}</td>
                                    <td>{r['DishName']}</td>
                                    <td>{r['TranDate']}</td>
                                    <td className="der-text-center">{(r['Opening Stock'] || 0).toFixed(2)}</td>
                                    <td className="der-text-center">{(r['PQty'] || 0).toFixed(2)}</td>
                                    <td className="der-text-center">{(r['PRQty'] || 0).toFixed(2)}</td>
                                    <td className="der-text-center">{(r['SQty'] || 0).toFixed(2)}</td>
                                    <td className="der-text-center">{(r['SRQty'] || 0).toFixed(2)}</td>
                                    <td className="der-text-center">{(r['Closing Stock'] || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

export default DishMovement;
