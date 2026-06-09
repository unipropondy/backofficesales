import { API_BASE_URL } from "../config/config";
import React, { useState } from "react";
import axios from "axios";
import "./ConsoleSalesReport.css";

const ConsoleSalesReport = ({ sidebarOpen }) => {
   const today = new Date().toLocaleDateString('en-CA', {
  timeZone: 'Asia/Singapore'
});
    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);

    const [reportType, setReportType] = useState("summary");
    const [outputType, setOutputType] = useState("screen");
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [orgData, setOrgData] = useState(null);

    // Fetch organization info on mount
    React.useEffect(() => {
      axios.get(API_BASE_URL + '/api/organization')
            .then(res => setOrgData(res.data))
            .catch(err => console.error("Org fetch error:", err));
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const parts = dateStr.split("-");
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    // Logo and Company Header
    const CompanyHeader = () => (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '2px solid #ff7f27',
            paddingBottom: '15px'
        }}>
            <img
                src="https://uniprosg.com/wp-content/uploads/2024/09/unipro-logo-green-1.png"
                alt="Unipro Logo"
                style={{ maxWidth: '100px', maxHeight: '50px' }}
            />
            <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#6d645e', fontFamily: 'Cambria, Times New Roman, serif' }}>
                    {orgData?.Name || "UNIPRO SOFTWARES SG PTE LTD"}
                </div>
                <div style={{ fontSize: '10px', color: '#555', marginTop: '4px', fontFamily: 'Cambria, Times New Roman, serif' }}>
                    {orgData?.Address1_Line1 || "45 KALLANG PUDDING ROAD"}, {orgData?.Address1_City || "SINGAPORE"} {orgData?.Address1_PostalCode || "349317"}<br/>
                    Phone: {orgData?.Address1_Telephone1 || "65130000"}
                </div>
            </div>
            <div style={{ width: '100px' }}></div>
        </div>
    );

    // Render Summary Report with NEW ORDER: Paymode Breakdown → Sales Breakdown → Total Transactions → Average Bill
    
    const renderSummaryReport = () => {
        if (!reportData || !reportData.data) {
            return <div className="der-empty">No data available</div>;
        }
        const data = reportData.data;
        
        const dishGroupName = data.DishGroupName || "";

        return (
            <table className="der-table">
                <thead>
                    <tr><th>Particulars</th><th className="der-th-center">Amount</th></tr>
                </thead>
                <tbody>
                    <tr className="der-section-header"><td colSpan="2">Report Total</td></tr>
                    <tr><td>Net Sales</td><td className="der-text-right">{(data.NetSales || 0).toFixed(2)}</td></tr>
                    <tr><td>Service Charge</td><td className="der-text-right">{(data.ServiceCharge || 0).toFixed(2)}</td></tr>
                    <tr><td>Tax Collected</td><td className="der-text-right">{(data.TaxCollected || 0).toFixed(2)}</td></tr>
                    <tr><td>Rounding & Excess</td><td className="der-text-right">{(data.Rounding || 0).toFixed(2)}</td></tr>
                    <tr className="der-total-row"><td>Total Revenue</td><td className="der-text-right">{(data.TotalRevenue || 0).toFixed(2)}</td></tr>

                    <tr className="der-section-header"><td colSpan="2">Sales</td></tr>
                    <tr>
                        <td style={{ paddingLeft: '20px' }}>{dishGroupName}</td>
                        <td className="der-text-right">{(data.NetSales || 0).toFixed(2)}</td>
                    </tr>

                    {/* 1. PAYMODE BREAKDOWN - FIRST */}
                    <tr className="der-section-header"><td colSpan="2">Paymode Breakdown</td></tr>
                    {['CASH', 'CARD', 'NETS', 'CDC', 'VOUCHER'].map((mode) => (
                        <tr key={mode}>
                            <td style={{ paddingLeft: '20px' }}>{mode}</td>
                            <td className="der-text-right">
                                {(reportData?.paymodeBreakdown?.[mode]?.amount || 0).toFixed(2)}
                            </td>
                        </tr>
                    ))}

                    {/* 2. SALES BREAKDOWN - SECOND */}
                    <tr className="der-section-header"><td colSpan="2">Sales Breakdown</td></tr>
                    
                    {/* a) Sales by Category */}
                    {reportData?.salesByCategory?.map((cat, idx) => (
                        <tr key={`cat-${idx}`}>
                            <td style={{ paddingLeft: '20px' }}>Sales by Category - {cat.CategoryName}</td>
                            <td className="der-text-right">{cat.TotalSales.toFixed(2)}</td>
                        </tr>
                    ))}

                    {/* b) Sales by Department */}
                    {reportData?.salesByDepartment?.map((dept, idx) => {
                        const departmentName = dept.DepartmentName?.trim() || 'Uncategorized';
                        return (
                            <tr key={`dept-${idx}`}>
                                <td style={{ paddingLeft: '20px' }}>Sales by Department - {departmentName}</td>
                                <td className="der-text-right">{dept.TotalSales.toFixed(2)}</td>
                            </tr>
                        );
                    })}

                    {/* c) Top selling category */}
                    {reportData?.salesByCategory?.[0] && (
                        <tr>
                            <td style={{ paddingLeft: '20px' }}>Top Selling Category</td>
                            <td className="der-text-right">{reportData.salesByCategory[0].CategoryName}</td>
                        </tr>
                    )}

                    {/* d) Top selling item */}
                    {reportData?.topSellingItems?.[0] && (
                        <tr>
                            <td style={{ paddingLeft: '20px' }}>Top Selling Item</td>
                            <td className="der-text-right">{reportData.topSellingItems[0].ItemName}</td>
                        </tr>
                    )}

                    {/* e) Slow-moving category */}
                    {reportData?.slowMovingCategory?.[0] && (
                        <tr>
                            <td style={{ paddingLeft: '20px' }}>Slow-moving Category</td>
                            <td className="der-text-right">{reportData.slowMovingCategory[0].CategoryName}</td>
                        </tr>
                    )}

                    {/* f) Slow-moving item */}
                    {reportData?.slowMovingItems?.[0] && (
                        <tr>
                            <td style={{ paddingLeft: '20px' }}>Slow-moving Item</td>
                            <td className="der-text-right">{reportData.slowMovingItems[0].ItemName}</td>
                        </tr>
                    )}

                    <tr className="der-total-row">
                        <td style={{ paddingLeft: '20px' }}>Total Sales</td>
                        <td className="der-text-right">{(data.NetSales || 0).toFixed(2)}</td>
                    </tr>

                    {/* 3. TOTAL TRANSACTIONS COUNT - THIRD */}
                    <tr className="der-section-header"><td colSpan="2">Total Transactions Count</td></tr>
                    <tr>
                        <td>Total Transactions</td>
                        <td className="der-text-right">{reportData?.totalReceipts || 0}</td>
                    </tr>

                    {/* 4. AVERAGE BILL VALUE - FOURTH */}
                    <tr className="der-section-header"><td colSpan="2">Average Bill Value</td></tr>
                    <tr>
                        <td>Average Bill</td>
                        <td className="der-text-right">{(parseFloat(reportData?.averageReceipt || 0)).toFixed(2)}</td>
                    </tr>

                    <tr className="der-section-header"><td colSpan="2">Tax & SVC</td></tr>
                    <tr><td>Service Charge</td><td className="der-text-right">{(data.ServiceCharge || 0).toFixed(2)}</td></tr>
                    <tr><td>Tax Collected</td><td className="der-text-right">{(data.TaxCollected || 0).toFixed(2)}</td></tr>

                    <tr className="der-section-header"><td colSpan="2">Discount</td></tr>
                    <tr><td>Total Discount</td><td className="der-text-right">{(data.TotalDiscount || 0).toFixed(2)}</td></tr>
                </tbody>
            </table>
        );
    };

    // Render Detail Report with NEW ORDER
    const renderDetailReport = () => {
        if (!reportData || !reportData.data || !Array.isArray(reportData.data) || reportData.data.length === 0) {
            return <div className="der-empty">No data available</div>;
        }

        const groupedData = {};
        let grandTotalGross = 0;
        let grandTotalDiscount = 0;
        let grandTotalNet = 0;
        let grandTotalQuantity = 0;

        reportData.data.forEach(item => {
            const group = item.DishGroupIdName || 'Uncategorized';
            if (!groupedData[group]) groupedData[group] = [];
            groupedData[group].push(item);

            grandTotalGross += item.BaseAmount || 0;
            grandTotalDiscount += item.ManualDiscountAmount || 0;
            grandTotalNet += item.TotalDetailLineAmount || 0;
            grandTotalQuantity += item.Quantity || 0;
        });

        return (
            <div>
                {/* SALES REPORT TABLE */}
                <table className="der-table">
                    <thead>
                        <tr>
                            <th>DishCode</th>
                            <th>Name</th>
                            <th className="der-th-center">Qty</th>
                            <th className="der-th-center">%</th>
                            <th className="der-th-center">Gross</th>
                            <th className="der-th-center">Disc</th>
                            <th className="der-th-center">%</th>
                            <th className="der-th-center">Disc.Gross</th>
                            <th className="der-th-center">%</th>
                            <th className="der-th-center">Net</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(groupedData).map((group, gIdx) => {
                            let groupTotalGross = 0;
                            let groupTotalDiscount = 0;
                            let groupTotalNet = 0;
                            let groupTotalQty = 0;

                            return (
                                <React.Fragment key={gIdx}>
                                    <tr className="der-section-header">
                                        <td colSpan="10">Dish Group : {group}</td>
                                    </tr>
                                    {groupedData[group].map((item, idx) => {
                                        groupTotalGross += item.BaseAmount || 0;
                                        groupTotalDiscount += item.ManualDiscountAmount || 0;
                                        groupTotalNet += item.TotalDetailLineAmount || 0;
                                        groupTotalQty += item.Quantity || 0;

                                        const grossPercent = grandTotalGross > 0 ? ((item.BaseAmount / grandTotalGross) * 100).toFixed(2) : "0.00";
                                        const netPercent = grandTotalNet > 0 ? ((item.TotalDetailLineAmount / grandTotalNet) * 100).toFixed(2) : "0.00";

                                        return (
                                            <tr key={idx}>
                                                <td>{item.DishCode || ""}</td>
                                                <td>{item.DishName || ""}</td>
                                                <td className="der-text-right">{item.Quantity || 0}</td>
                                                <td className="der-text-right">{grossPercent}%</td>
                                                <td className="der-text-right">{(item.BaseAmount || 0).toFixed(2)}</td>
                                                <td className="der-text-right">{(item.ManualDiscountAmount || 0).toFixed(2)}</td>
                                                <td className="der-text-right">0.00%</td>
                                                <td className="der-text-right">{(item.TotalDetailLineAmount || 0).toFixed(2)}</td>
                                                <td className="der-text-right">{netPercent}%</td>
                                                <td className="der-text-right">{(item.TotalDetailLineAmount || 0).toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="der-total-row">
                                        <td colSpan="2">Group Total</td>
                                        <td className="der-text-right">{groupTotalQty}</td>
                                        <td></td>
                                        <td className="der-text-right">{groupTotalGross.toFixed(2)}</td>
                                        <td className="der-text-right">{groupTotalDiscount.toFixed(2)}</td>
                                        <td></td>
                                        <td className="der-text-right">{groupTotalNet.toFixed(2)}</td>
                                        <td></td>
                                        <td className="der-text-right">{groupTotalNet.toFixed(2)}</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}

                        <tr className="der-total-row" style={{ backgroundColor: '#d1d8dd' }}>
                            <td colSpan="2">Grand Total</td>
                            <td className="der-text-right">{grandTotalQuantity}</td>
                            <td></td>
                            <td className="der-text-right">{grandTotalGross.toFixed(2)}</td>
                            <td className="der-text-right">{grandTotalDiscount.toFixed(2)}</td>
                            <td></td>
                            <td className="der-text-right">{grandTotalNet.toFixed(2)}</td>
                            <td></td>
                            <td className="der-text-right">{grandTotalNet.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* NEW FEATURES - IN CORRECT ORDER */}
                <div style={{ marginTop: '30px' }}>
                    <hr style={{ border: '1px solid #34495e', marginBottom: '20px' }} />
                    
                    {/* 1. PAYMODE BREAKDOWN - FIRST */}
                    {reportData.paymodeBreakdown && (
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#34495e', borderLeft: '4px solid #34495e', paddingLeft: '10px' }}>
                                1. Paymode Breakdown
                            </h3>
                            <table className="der-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Payment Mode</th>
                                        <th className="der-th-center">Transaction Count</th>
                                        <th className="der-th-right">Amount (SGD)</th>
                                        <th className="der-th-center">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const paymodes = ['CASH', 'CARD', 'NETS', 'CDC', 'VOUCHER'];
                                        const totalAmount = Object.values(reportData.paymodeBreakdown).reduce((sum, mode) => sum + (mode?.amount || 0), 0);
                                        return paymodes.map(mode => {
                                            const data = reportData.paymodeBreakdown[mode] || { amount: 0, count: 0 };
                                            const percentage = totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(2) : '0.00';
                                            return (
                                                <tr key={mode}>
                                                    <td><strong>{mode}</strong></td>
                                                    <td className="der-text-right">{data.count || 0}</td>
                                                    <td className="der-text-right">{(data.amount || 0).toFixed(2)}</td>
                                                    <td className="der-text-right">{percentage}%</td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                    <tr className="der-total-row">
                                        <td><strong>Total</strong></td>
                                        <td className="der-text-right"><strong>{reportData.totalReceipts || 0}</strong></td>
                                        <td className="der-text-right"><strong>
                                            {Object.values(reportData.paymodeBreakdown).reduce((sum, mode) => sum + (mode?.amount || 0), 0).toFixed(2)}
                                        </strong></td>
                                        <td className="der-text-right"><strong>100%</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 2. SALES BREAKDOWN - SECOND */}
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#34495e', borderLeft: '4px solid #34495e', paddingLeft: '10px' }}>
                            2. Sales Breakdown
                        </h3>
                        
                        {/* a) Sales by Category */}
                        {reportData.salesByCategory && reportData.salesByCategory.length > 0 && (
                            <div style={{ marginBottom: '25px' }}>
                                <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#27ae60' }}>a) Sales by Category</h4>
                                <table className="der-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Category Name</th>
                                            <th className="der-th-right">Quantity Sold</th>
                                            <th className="der-th-right">Sales Amount (SGD)</th>
                                            <th className="der-th-center">% of Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.salesByCategory.map((cat, idx) => {
                                            const percentage = grandTotalNet > 0 ? ((cat.TotalSales / grandTotalNet) * 100).toFixed(2) : '0.00';
                                            return (
                                                <tr key={idx}>
                                                    <td>{cat.CategoryName}</td>
                                                    <td className="der-text-right">{cat.TotalQuantity}</td>
                                                    <td className="der-text-right">{cat.TotalSales.toFixed(2)}</td>
                                                    <td className="der-text-right">{percentage}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* b) Sales by Department */}
                        {reportData.salesByDepartment && reportData.salesByDepartment.length > 0 && (
                            <div style={{ marginBottom: '25px' }}>
                                <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#27ae60' }}>b) Sales by Department</h4>
                                <table className="der-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Department Name</th>
                                            <th className="der-th-right">Quantity Sold</th>
                                            <th className="der-th-right">Sales Amount (SGD)</th>
                                            <th className="der-th-center">% of Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.salesByDepartment.map((dept, idx) => {
                                            const departmentName = dept.DepartmentName?.trim() || 'Uncategorized';
                                            const percentage = grandTotalNet > 0 ? ((dept.TotalSales / grandTotalNet) * 100).toFixed(2) : '0.00';
                                            return (
                                                <tr key={idx}>
                                                    <td>{departmentName}</td>
                                                    <td className="der-text-right">{dept.TotalQuantity}</td>
                                                    <td className="der-text-right">{dept.TotalSales.toFixed(2)}</td>
                                                    <td className="der-text-right">{percentage}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* c) Top selling category */}
                        {reportData.salesByCategory && reportData.salesByCategory.length > 0 && (
                            <div style={{ marginBottom: '20px', padding: '12px', background: '#e8f8f5', borderRadius: '8px', border: '1px solid #27ae60' }}>
                                <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#27ae60' }}>c) Top Selling Category ⭐</h4>
                                <p style={{ fontSize: '13px', margin: 0 }}>
                                    <strong>{reportData.salesByCategory[0]?.CategoryName || 'N/A'}</strong> - 
                                    ${reportData.salesByCategory[0]?.TotalSales?.toFixed(2) || '0.00'} 
                                    ({reportData.salesByCategory[0]?.TotalQuantity || 0} units sold)
                                </p>
                            </div>
                        )}

                        {/* d) Top selling item */}
                        {reportData.topSellingItems && reportData.topSellingItems.length > 0 && (
                            <div style={{ marginBottom: '25px' }}>
                                <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#27ae60' }}>d) Top Selling Items ⭐</h4>
                                <table className="der-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Item Code</th>
                                            <th>Item Name</th>
                                            <th>Category</th>
                                            <th className="der-th-right">Quantity</th>
                                            <th className="der-th-right">Sales (SGD)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.topSellingItems.map((item, idx) => (
                                            <tr key={idx} style={idx === 0 ? { backgroundColor: '#fff9e6' } : {}}>
                                                <td className="der-text-center">#{idx + 1}</td>
                                                <td>{item.DishCode}</td>
                                                <td><strong>{item.ItemName}</strong></td>
                                                <td>{item.Category}</td>
                                                <td className="der-text-right">{item.TotalQuantity}</td>
                                                <td className="der-text-right">{item.TotalSales.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* e) Slow-moving category */}
                        {reportData.slowMovingCategory && reportData.slowMovingCategory.length > 0 && (
                            <div style={{ marginBottom: '20px', padding: '12px', background: '#fdedec', borderRadius: '8px', border: '1px solid #e74c3c' }}>
                                <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#e74c3c' }}>e) Slow-moving Category ⚠️</h4>
                                <p style={{ fontSize: '13px', margin: 0 }}>
                                    <strong>{reportData.slowMovingCategory[0]?.CategoryName || 'N/A'}</strong> - 
                                    ${reportData.slowMovingCategory[0]?.TotalSales?.toFixed(2) || '0.00'} 
                                    ({reportData.slowMovingCategory[0]?.TotalQuantity || 0} units sold)
                                </p>
                            </div>
                        )}

                        {/* f) Slow-moving item */}
                        {reportData.slowMovingItems && reportData.slowMovingItems.length > 0 && (
                            <div style={{ marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#e74c3c' }}>f) Slow-moving Items (Lowest Sales) ⚠️</h4>
                                <table className="der-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Item Code</th>
                                            <th>Item Name</th>
                                            <th>Category</th>
                                            <th className="der-th-right">Quantity</th>
                                            <th className="der-th-right">Sales (SGD)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.slowMovingItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="der-text-center">#{idx + 1}</td>
                                                <td>{item.DishCode}</td>
                                                <td>{item.ItemName}</td>
                                                <td>{item.Category}</td>
                                                <td className="der-text-right">{item.TotalQuantity}</td>
                                                <td className="der-text-right">{item.TotalSales.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 3. TOTAL TRANSACTIONS COUNT - THIRD */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '20px', 
                        marginBottom: '30px',
                        padding: '15px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #d1d8dd'
                    }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>📊 3. Total Transactions</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#34495e' }}>{reportData.totalReceipts || 0}</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>💰 4. Average Bill Value</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#34495e' }}>${reportData.averageReceipt || '0.00'}</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>💵 Total Net Sales</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#34495e' }}>${grandTotalNet.toFixed(2)}</div>
                        </div>
                                        </div>
                </div>

                {/* FOOTER - Add this here */}
                <div style={{
                    marginTop: '40px',
                    paddingTop: '20px',
                    borderTop: '2px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #333', width: '200px', paddingTop: '5px', fontSize: '11px' }}>
                            Cashier Signature
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '10px', color: '#666' }}>
                       Printed On: {
  new Date().toLocaleDateString('en-GB', {
    timeZone: 'Asia/Singapore'
  })
} {
new Date().toLocaleTimeString('en-US', {
  timeZone: 'Asia/Singapore',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
})
}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #333', width: '200px', paddingTop: '5px', fontSize: '11px' }}>
                            Authorized Signature
                        </div>
                        <div style={{ fontSize: '9px', color: '#95a5a6', marginTop: '5px' }}>Powered by UNIPRO</div>
                    </div>
                </div>
            </div>
        );
    };

    const handleGenerate = async () => {
        if (!fromDate || !toDate) {
            alert("Please select From Date and To Date");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(API_BASE_URL + "/api/consolesales", {
                params: {
                    type: reportType,
                    fromDate,
                    toDate
                }
            });
            if (response.data.success) {
                setReportData(response.data);
                if (outputType === "printer") {
                    setTimeout(() => { window.print(); }, 500);
                }
            } else {
                alert("Error: " + response.data.error);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Failed to fetch report data. Please check server connection.");
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
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});

        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Consolidated Sales Report</title>
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
                .summary-card {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .card {
                    flex: 1;
                    text-align: center;
                }
                .card-label {
                    font-size: 12px;
                    color: #666;
                }
                .card-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #34495e;
                }
            </style>
        </head>
        <body>
            <div class="a4-page">
                <table style="width: 100%; border: none; border-collapse: collapse; margin: 0; padding: 0;">
                    <thead class="print-spacer">
                        <tr><td style="height: 15mm; border: none; padding: 0;"></td></tr>
                    </thead>
                    <tbody>
                        <tr><td style="border: none; padding: 0;">
                            <div class="report-body">
                    <div class="header-container">
                        <img src="https://uniprosg.com/wp-content/uploads/2024/09/unipro-logo-green-1.png" alt="Unipro Logo" class="logo" />
                        <div class="company-name">${orgData?.Name || "UNIPRO SOFTWARES SG PTE LTD"}</div>
                        <div class="company-address">
                            ${orgData?.Address1_Line1 || "45 KALLANG PUDDING ROAD"}, ${orgData?.Address1_City || "SINGAPORE"} ${orgData?.Address1_PostalCode || "349317"}<br/>
                            Phone: ${orgData?.Address1_Telephone1 || "65130000"}
                        </div>
                    </div>
                    
                    <div class="report-title">Consolidated Business Performance Report ${reportType.toUpperCase()}</div>
                    
                    <div class="report-info">
                        <strong>Period:</strong> ${formatDate(fromDate)} to ${formatDate(toDate)}
                    </div>
        `;

        if (reportType === "summary") {
            htmlContent += `
                <table>
                    <thead>
                        <tr><th>Particulars</th><th class="amount-col">Amount</th></tr>
                    </thead>
                    <tbody>
                        <tr class="section-head"><td colspan="2">Report Total</td></tr>
                        <tr><td>Net Sales</td><td class="amount-col">${(reportData.data.NetSales || 0).toFixed(2)}</td></tr>
                        <tr><td>Service Charge</td><td class="amount-col">${(reportData.data.ServiceCharge || 0).toFixed(2)}</td></tr>
                        <tr><td>Tax Collected</td><td class="amount-col">${(reportData.data.TaxCollected || 0).toFixed(2)}</td></tr>
                        <tr><td>Rounding & Excess</td><td class="amount-col">${(reportData.data.Rounding || 0).toFixed(2)}</td></tr>
                        <tr class="total-row"><td>Total Revenue</td><td class="amount-col">${(reportData.data.TotalRevenue || 0).toFixed(2)}</td></tr>
                        
                        <tr class="section-head"><td colspan="2">Sales</td></tr>
                        <tr><td>${reportData.data.DishGroupName || ''}</td><td class="amount-col">${(reportData.data.NetSales || 0).toFixed(2)}</td></tr>
                        
                        <!-- 1. PAYMODE BREAKDOWN -->
                        <tr class="section-head"><td colspan="2">Paymode Breakdown</td></tr>
                        ${['CASH', 'CARD', 'NETS', 'CDC', 'VOUCHER'].map(mode => `
                        <tr><td>${mode}</td><td class="amount-col">${(reportData?.paymodeBreakdown?.[mode]?.amount || 0).toFixed(2)}</td></tr>
                        `).join('')}
                        
                        <!-- 2. SALES BREAKDOWN -->
                        <tr class="section-head"><td colspan="2">Sales Breakdown</td></tr>
                        ${reportData?.salesByCategory?.map(cat => `
                        <tr><td>Sales by Category - ${cat.CategoryName}</td><td class="amount-col">${cat.TotalSales.toFixed(2)}</td></tr>
                        `).join('')}
                        ${reportData?.salesByDepartment?.map(dep => {
                            const deptName = dep.DepartmentName?.trim() || 'Uncategorized';
                            return `<tr><td>Sales by Department - ${deptName}</td><td class="amount-col">${dep.TotalSales.toFixed(2)}</td></tr>`;
                        }).join('')}
                        
                        ${reportData?.salesByCategory?.[0] ? `<tr><td>Top Selling Category</td><td class="amount-col">${reportData.salesByCategory[0].CategoryName}</td></tr>` : ''}
                        ${reportData?.topSellingItems?.[0] ? `<tr><td>Top Selling Item</td><td class="amount-col">${reportData.topSellingItems[0].ItemName}</td></tr>` : ''}
                        ${reportData?.slowMovingCategory?.[0] ? `<tr><td>Slow-moving Category</td><td class="amount-col">${reportData.slowMovingCategory[0].CategoryName}</td></tr>` : ''}
                        ${reportData?.slowMovingItems?.[0] ? `<tr><td>Slow-moving Item</td><td class="amount-col">${reportData.slowMovingItems[0].ItemName}</td></tr>` : ''}
                        
                        <tr class="total-row"><td>Total Sales</td><td class="amount-col">${(reportData.data.NetSales || 0).toFixed(2)}</td></tr>
                        
                        <!-- 3. TOTAL TRANSACTIONS COUNT -->
                        <tr class="section-head"><td colspan="2">Total Transactions Count</td></tr>
                        <tr><td>Total Transactions</td><td class="amount-col">${reportData?.totalReceipts || 0}</td></tr>
                        
                        <!-- 4. AVERAGE BILL VALUE -->
                        <tr class="section-head"><td colspan="2">Average Bill Value</td></tr>
                        <tr><td>Average Bill</td><td class="amount-col">${(parseFloat(reportData?.averageReceipt || 0)).toFixed(2)}</td></tr>
                        
                        <tr class="section-head"><td colspan="2">Tax & SVC</td></tr>
                        <tr><td>Service Charge</td><td class="amount-col">${(reportData.data.ServiceCharge || 0).toFixed(2)}</td></tr>
                        <tr><td>Tax Collected</td><td class="amount-col">${(reportData.data.TaxCollected || 0).toFixed(2)}</td></tr>
                        
                        <tr class="section-head"><td colspan="2">Discount</td></tr>
                        <tr><td>Total Discount</td><td class="amount-col">${(reportData.data.TotalDiscount || 0).toFixed(2)}</td></tr>
                    </tbody>
                </table>
            `;
        } else {
            // Detail Report HTML
            const groupedData = {};
            let grandTotalGross = 0;
            let grandTotalDiscount = 0;
            let grandTotalNet = 0;
            let grandTotalQuantity = 0;

            reportData.data.forEach(item => {
                const group = item.DishGroupIdName || 'Uncategorized';
                if (!groupedData[group]) groupedData[group] = [];
                groupedData[group].push(item);
                grandTotalGross += item.BaseAmount || 0;
                grandTotalDiscount += item.ManualDiscountAmount || 0;
                grandTotalNet += item.TotalDetailLineAmount || 0;
                grandTotalQuantity += item.Quantity || 0;
            });
            
            htmlContent += `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #34495e; color: white;">
                            <th style="padding: 4px;">DishCode</th>
                            <th style="padding: 4px;">Name</th>
                            <th style="padding: 4px; text-align: right;">Qty</th>
                            <th style="padding: 4px; text-align: right;">%</th>
                            <th style="padding: 4px; text-align: right;">Gross</th>
                            <th style="padding: 4px; text-align: right;">Disc</th>
                            <th style="padding: 4px; text-align: right;">%</th>
                            <th style="padding: 4px; text-align: right;">Disc.Gross</th>
                            <th style="padding: 4px; text-align: right;">%</th>
                            <th style="padding: 4px; text-align: right;">Net</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.keys(groupedData).map((group) => {
                            let groupTotalGross = 0;
                            let groupTotalDiscount = 0;
                            let groupTotalNet = 0;
                            let groupTotalQty = 0;
                            
                            const rowsHtml = groupedData[group].map((item) => {
                                groupTotalGross += item.BaseAmount || 0;
                                groupTotalDiscount += item.ManualDiscountAmount || 0;
                                groupTotalNet += item.TotalDetailLineAmount || 0;
                                groupTotalQty += item.Quantity || 0;

                                const grossPercent = grandTotalGross > 0 ? ((item.BaseAmount / grandTotalGross) * 100).toFixed(2) : "0.00";
                                const netPercent = grandTotalNet > 0 ? ((item.TotalDetailLineAmount / grandTotalNet) * 100).toFixed(2) : "0.00";

                                return `
                                    <tr>
                                        <td style="padding: 4px; border: 1px solid #ddd;">${item.DishCode || ''}</td>
                                        <td style="padding: 4px; border: 1px solid #ddd;">${item.DishName || ''}</td>
                                        <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${item.Quantity || 0}</td>
                                        <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${grossPercent}%</td>
                                        <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${(item.BaseAmount || 0).toFixed(2)}</td>
                                        <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${(item.ManualDiscountAmount || 0).toFixed(2)}</td>
                                        <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">0.00%</td>
                                        <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${(item.TotalDetailLineAmount || 0).toFixed(2)}</td>
                                        <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${netPercent}%</td>
                                        <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${(item.TotalDetailLineAmount || 0).toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join('');
                            
                            return `
                                <tr>
                                    <td colspan="10" style="padding: 4px; background: #ecf0f1; font-weight: bold;">Dish Group : ${group}</td>
                                </tr>
                                ${rowsHtml}
                                <tr style="background: #fdfefe; font-weight: bold;">
                                    <td colspan="2" style="padding: 4px; border: 1px solid #ddd;">Group Total</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${groupTotalQty}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd;"></td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${groupTotalGross.toFixed(2)}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${groupTotalDiscount.toFixed(2)}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd;"></td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${groupTotalNet.toFixed(2)}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd;"></td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${groupTotalNet.toFixed(2)}</td>
                                </tr>
                            `;
                        }).join('')}
                        <tr style="background: #d1d8dd; font-weight: bold;">
                            <td colspan="2" style="padding: 4px; border: 1px solid #ddd;">Grand Total</td>
                            <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${grandTotalQuantity}</td>
                            <td style="padding: 4px; border: 1px solid #ddd;"></td>
                            <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${grandTotalGross.toFixed(2)}</td>
                            <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${grandTotalDiscount.toFixed(2)}</td>
                            <td style="padding: 4px; border: 1px solid #ddd;"></td>
                            <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${grandTotalNet.toFixed(2)}</td>
                            <td style="padding: 4px; border: 1px solid #ddd;"></td>
                            <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${grandTotalNet.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <h3 style="font-size: 14px; margin-top: 20px;">1. Paymode Breakdown</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #34495e; color: white;">
                            <th style="padding: 4px;">Payment Mode</th>
                            <th style="padding: 4px; text-align: right;">Transaction Count</th>
                            <th style="padding: 4px; text-align: right;">Amount (SGD)</th>
                            <th style="padding: 4px; text-align: right;">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(() => {
                            if (!reportData.paymodeBreakdown) return '';
                            const paymodes = ['Cash', 'Card', 'NETS', 'CDC', 'Voucher'];
                            const totalAmount = Object.values(reportData.paymodeBreakdown).reduce((sum, mode) => sum + (mode?.amount || 0), 0);
                            
                            const rows = paymodes.map(mode => {
                                const data = reportData.paymodeBreakdown[mode];
                                if (data && data.amount > 0) {
                                    const percentage = totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(2) : '0.00';
                                    return `
                                        <tr>
                                            <td style="padding: 4px; border: 1px solid #ddd;">${mode}</td>
                                            <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${data.count}</td>
                                            <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${data.amount.toFixed(2)}</td>
                                            <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${percentage}%</td>
                                        </tr>
                                    `;
                                }
                                return `
                                    <tr>
                                        <td style="padding: 4px; border: 1px solid #ddd;">${mode}</td>
                                        <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">0</td>
                                        <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">0.00</td>
                                        <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">0%</td>
                                    </tr>
                                `;
                            }).join('');
                            
                            return rows + `
                                <tr style="font-weight: bold; background: #fdfefe;">
                                    <td style="padding: 4px; border: 1px solid #ddd;">Total</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${reportData.totalReceipts || 0}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${totalAmount.toFixed(2)}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">100%</td>
                                </tr>
                            `;
                        })()}
                    </tbody>
                </table>
                
                <h3 style="font-size: 14px; margin-top: 20px;">2. Sales Breakdown</h3>
                ${reportData?.salesByCategory?.length > 0 ? `
                    <h4 style="font-size: 12px; margin-bottom: 5px;">a) Sales by Category</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                        <thead>
                            <tr style="background: #ecf0f1;">
                                <th style="padding: 4px; text-align: left;">Category Name</th>
                                <th style="padding: 4px; text-align: right;">Quantity Sold</th>
                                <th style="padding: 4px; text-align: right;">Sales (SGD)</th>
                                <th style="padding: 4px; text-align: right;">% of Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.salesByCategory.map(cat => {
                                const percentage = grandTotalNet > 0 ? ((cat.TotalSales / grandTotalNet) * 100).toFixed(2) : '0.00';
                                return `<tr>
                                    <td style="padding: 4px; border: 1px solid #ddd;">${cat.CategoryName}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${cat.TotalQuantity}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${cat.TotalSales.toFixed(2)}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${percentage}%</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                ` : ''}

                ${reportData?.salesByDepartment?.length > 0 ? `
                    <h4 style="font-size: 12px; margin-bottom: 5px;">b) Sales by Department</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                        <thead>
                            <tr style="background: #ecf0f1;">
                                <th style="padding: 4px; text-align: left;">Department Name</th>
                                <th style="padding: 4px; text-align: right;">Quantity Sold</th>
                                <th style="padding: 4px; text-align: right;">Sales (SGD)</th>
                                <th style="padding: 4px; text-align: right;">% of Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.salesByDepartment.map(dept => {
                                const deptName = dept.DepartmentName?.trim() || 'Uncategorized';
                                const percentage = grandTotalNet > 0 ? ((dept.TotalSales / grandTotalNet) * 100).toFixed(2) : '0.00';
                                return `<tr>
                                    <td style="padding: 4px; border: 1px solid #ddd;">${deptName}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${dept.TotalQuantity}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${dept.TotalSales.toFixed(2)}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${percentage}%</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                ` : ''}
                
                ${reportData?.salesByCategory?.[0] ? `
                    <div style="margin-bottom: 15px; padding: 10px; background: #e8f8f5; border: 1px solid #27ae60;">
                        <h4 style="font-size: 12px; margin: 0 0 5px 0;">c) Top Selling Category ⭐</h4>
                        <p style="margin: 0; font-size: 11px;">
                            <strong>${reportData.salesByCategory[0].CategoryName}</strong> - 
                            $${reportData.salesByCategory[0].TotalSales.toFixed(2)} (${reportData.salesByCategory[0].TotalQuantity} units sold)
                        </p>
                    </div>
                ` : ''}

                ${reportData?.topSellingItems?.length > 0 ? `
                    <h4 style="font-size: 12px; margin-bottom: 5px;">d) Top Selling Items ⭐</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                        <thead>
                            <tr style="background: #ecf0f1;">
                                <th style="padding: 4px; text-align: center;">Rank</th>
                                <th style="padding: 4px; text-align: left;">Item Code</th>
                                <th style="padding: 4px; text-align: left;">Item Name</th>
                                <th style="padding: 4px; text-align: left;">Category</th>
                                <th style="padding: 4px; text-align: right;">Quantity</th>
                                <th style="padding: 4px; text-align: right;">Sales (SGD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.topSellingItems.map((item, idx) => `
                                <tr ${idx === 0 ? 'style="background: #fff9e6;"' : ''}>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">#${idx + 1}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd;">${item.DishCode}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd;"><strong>${item.ItemName}</strong></td>
                                    <td style="padding: 4px; border: 1px solid #ddd;">${item.Category}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${item.TotalQuantity}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${item.TotalSales.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}
                
                ${reportData?.slowMovingCategory?.[0] ? `
                    <div style="margin-bottom: 15px; padding: 10px; background: #fdedec; border: 1px solid #e74c3c;">
                        <h4 style="font-size: 12px; margin: 0 0 5px 0; color: #e74c3c;">e) Slow-moving Category ⚠️</h4>
                        <p style="margin: 0; font-size: 11px;">
                            <strong>${reportData.slowMovingCategory[0].CategoryName}</strong> - 
                            $${reportData.slowMovingCategory[0].TotalSales.toFixed(2)} (${reportData.slowMovingCategory[0].TotalQuantity} units sold)
                        </p>
                    </div>
                ` : ''}

                ${reportData?.slowMovingItems?.length > 0 ? `
                    <h4 style="font-size: 12px; margin-bottom: 5px; color: #e74c3c;">f) Slow-moving Items ⚠️</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                        <thead>
                            <tr style="background: #ecf0f1;">
                                <th style="padding: 4px; text-align: center;">Rank</th>
                                <th style="padding: 4px; text-align: left;">Item Code</th>
                                <th style="padding: 4px; text-align: left;">Item Name</th>
                                <th style="padding: 4px; text-align: left;">Category</th>
                                <th style="padding: 4px; text-align: right;">Quantity</th>
                                <th style="padding: 4px; text-align: right;">Sales (SGD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.slowMovingItems.map((item, idx) => `
                                <tr>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">#${idx + 1}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd;">${item.DishCode}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd;">${item.ItemName}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd;">${item.Category}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${item.TotalQuantity}</td>
                                    <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${item.TotalSales.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}
                
                <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse; background: #f8f9fa; border: 1px solid #ddd;">
                    <tr>
                        <td style="padding: 10px; text-align: center; border-right: 1px solid #ddd;">
                            <div style="font-size: 10px; color: #666;">📊 3. Total Transactions</div>
                            <div style="font-size: 18px; font-weight: bold;">${reportData.totalReceipts || 0}</div>
                        </td>
                        <td style="padding: 10px; text-align: center; border-right: 1px solid #ddd;">
                            <div style="font-size: 10px; color: #666;">💰 4. Average Bill Value</div>
                            <div style="font-size: 18px; font-weight: bold;">$${reportData.averageReceipt || '0.00'}</div>
                        </td>
                        <td style="padding: 10px; text-align: center;">
                            <div style="font-size: 10px; color: #666;">💵 Total Net Sales</div>
                            <div style="font-size: 18px; font-weight: bold;">$${grandTotalNet.toFixed(2)}</div>
                        </td>
                    </tr>
                </table>
            `;
        }
        
        htmlContent += `
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
                        </td></tr>
                    </tbody>
                    <tfoot class="print-spacer">
                        <tr><td style="height: 15mm; border: none; padding: 0;"></td></tr>
                    </tfoot>
                </table>
            </div>
        </body>
        </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `Sales_Report_${fromDate}_to_${toDate}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`console-sales-report ${sidebarOpen ? "sidebar-open" : ""}`}>
            <div className="der-header-title">Consolidated Business Performance Report</div>

            <div className="der-filter-container">
                <div className="der-filter-row">
                    <div className="der-filter-item"><label>Report Type</label><select value={reportType} onChange={(e) => setReportType(e.target.value)} className="der-date-picker" style={{ width: '120px' }}><option value="summary">Summary</option><option value="detail">Detail</option></select></div>
                    <div className="der-filter-item"><label>From Date</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="der-date-picker" /></div>
                    <div className="der-filter-item"><label>To Date</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="der-date-picker" /></div>
                </div>
                <div className="der-generate-row">
                    <button className="der-btn-generate" onClick={handleGenerate} disabled={loading}>
                        {loading ? "..." : "Generate"}
                    </button>
                    {reportData && (
                        <button className="der-download-btn" onClick={handleDownload} title="Download Report" style={{ marginLeft: '10px' }}>
                            <span style={{ marginRight: '8px' }}>⬇️</span> Report
                        </button>
                    )}
                </div>
            </div>

            <div className="der-table-container">
                {loading ? (
                    <div className="der-empty">Loading...</div>
                ) : reportData ? (
                    <div className="der-table-wrapper">
                        {reportData.type === "summary" ? renderSummaryReport() : renderDetailReport()}
                    </div>
                ) : (
                    <div className="der-empty">Select filters and click Generate to see results</div>
                )}
            </div>
        </div>
    );
};

export default ConsoleSalesReport;