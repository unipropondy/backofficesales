import React, { useState, useEffect } from "react";
import "./Settlement.css";
 
export default function Settlement() {
 
const [dateTime,setDateTime] = useState("");
 
useEffect(()=>{
 
const interval=setInterval(()=>{
const now=new Date();
 
const formatted=
now.toLocaleDateString()+" "+
now.toLocaleTimeString();
 
setDateTime(formatted);
 
},1000)
 
return ()=>clearInterval(interval)
 
},[])
 
const [summary,setSummary] = useState({
salesTotal:0,
discount:0,
service:0,
gst:0,
round:0,
tips:0,
netSales:0,
guests:0,
void:0
})
 
const [salesSummary,setSalesSummary] = useState([
{mode:"CASH",amount:0},
{mode:"NETS",amount:15},
{mode:"PAYNOW",amount:58.5}
])
 
const handleChange=(e)=>{
setSummary({...summary,[e.target.name]:e.target.value})
}
 
return(
 
<div className="cashier-container">
 
<h2>Cashier Settlement</h2>
 
<div className="top-row">
 
<label>Terminal</label>
 
<select>
<option>SR</option>
</select>
 
<input value={dateTime} readOnly/>
 
</div>
 
 
<div className="main-grid">
 
{/* LEFT PANEL */}
 
<div className="left-panel">
 
<table className="summary-table">
 
<tbody>
 
<tr>
<td>Sales Total</td>
<td><input name="salesTotal" value={summary.salesTotal} onChange={handleChange}/></td>
</tr>
 
<tr>
<td>Total Discount</td>
<td><input name="discount" value={summary.discount} onChange={handleChange}/></td>
</tr>
 
<tr>
<td>Service Charge</td>
<td><input name="service" value={summary.service} onChange={handleChange}/></td>
</tr>
 
<tr>
<td>GST</td>
<td><input name="gst" value={summary.gst} onChange={handleChange}/></td>
</tr>
 
<tr>
<td>Round Off</td>
<td><input name="round" value={summary.round} onChange={handleChange}/></td>
</tr>
 
<tr>
<td>Tips</td>
<td><input name="tips" value={summary.tips} onChange={handleChange}/></td>
</tr>
 
<tr className="bold">
<td>Net Sales</td>
<td><input name="netSales" value={summary.netSales} onChange={handleChange}/></td>
</tr>
 
<tr>
<td>Number Of Guests</td>
<td><input name="guests" value={summary.guests} onChange={handleChange}/></td>
</tr>
 
<tr>
<td>Void</td>
<td><input name="void" value={summary.void} onChange={handleChange}/></td>
</tr>
 
</tbody>
 
</table>
 
<h3>Transactions</h3>
 
<table className="table">
 
<thead>
<tr>
<th>Paymode</th>
<th>Cash In</th>
<th>Cash Out</th>
</tr>
</thead>
 
<tbody>
 
<tr>
<td><input/></td>
<td><input/></td>
<td><input/></td>
</tr>
 
<tr>
<td><input/></td>
<td><input/></td>
<td><input/></td>
</tr>
 
</tbody>
 
</table>
 
<div className="bottom-zero">0.00</div>
 
</div>
 
 
{/* RIGHT PANEL */}
 
<div className="right-panel">
 
<h3>Sales Summary</h3>
 
<table className="table">
 
<thead>
<tr>
<th>Paymode</th>
<th>Manual Amount</th>
</tr>
</thead>
 
<tbody>
 
{salesSummary.map((item,i)=>(
<tr key={i}>
<td>{item.mode}</td>
<td>
<input
value={item.amount}
onChange={(e)=>{
 
let data=[...salesSummary]
data[i].amount=e.target.value
setSalesSummary(data)
 
}}
/>
</td>
</tr>
))}
 
</tbody>
 
</table>
 
 
<div className="sales-box">
 
<h3>Sales</h3>
 
<table className="table">
 
<thead>
<tr>
<th>Paymode</th>
<th>Amount</th>
</tr>
</thead>
 
<tbody>
 
<tr>
<td>CASH</td>
<td>44.50</td>
</tr>
 
<tr>
<td>NETS</td>
<td>15.00</td>
</tr>
 
<tr>
<td>PAYNOW</td>
<td>58.50</td>
</tr>
 
</tbody>
 
</table>
 
</div>
 
 
<div className="total-box">
 
Total
 
<input value="118.00" readOnly/>
 
</div>
 
 
<button className="close-btn">
 
Close (Esc)
 
</button>
 
</div>
 
</div>
 
</div>
 
)
 
}