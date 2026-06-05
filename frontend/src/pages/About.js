import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/config";
import "./About.css";

function About() {

const [entries,setEntries] = useState([]);
const [showModal,setShowModal] = useState(false);
const [editIndex,setEditIndex] = useState(null);
const [successMsg,setSuccessMsg] = useState("");

const [displayName,setDisplayName] = useState(true);
const [activeTab, setActiveTab] = useState("category");

const [image,setImage] = useState(null);
const fileInputRef = useRef(null);

const [bgColor,setBgColor] = useState("#000000");
const [textColor,setTextColor] = useState("#ff0000");

const bgColorRef = useRef(null);
const textColorRef = useRef(null);
const [modifiers,setModifiers] = useState([]);
const [search,setSearch] = useState("");
const [selectedModifiers,setSelectedModifiers] = useState([]);

const [kitchens,setKitchens] = useState([]);
const [selectedKitchens,setSelectedKitchens] = useState([]);

const filteredModifiers = modifiers.filter((m)=>
m.ModifierName.toLowerCase().includes(search.toLowerCase())
);


const [form,setForm] = useState({
CategoryCode:"",
CategoryName:"",
ShortName:"",
SortCode:"",
isActive:false,
isDiscountAllowed:false,
isKitchenPrint:false,
IsTaxAllowed:false,
NameInOtherLanguage:false,
isServiceCharge:false,
isMemberSalesAllowed:false
});

useEffect(()=>{

if(successMsg){

const timer = setTimeout(()=>{
setSuccessMsg("");
},1000);

return ()=>clearTimeout(timer);

}

},[successMsg]);

/* =========================
     LOAD DATA
  ========================= */
const fetchCategory = async () => {

   try {
    const res = await axios.get(`${API_BASE_URL}/category`);
    setEntries(res.data);
  } catch (err) {
    console.error("Category load error:", err);
  }

};

const fetchModifier = async () => {

  try {

    const res = await axios.get(`${API_BASE_URL}/modifier`);
    setModifiers(res.data);

  } catch (err) {

    console.error("Modifier load error:", err);

  }

};

const fetchKitchen = async () => {

try{

const res = await axios.get(`${API_BASE_URL}/kitchen`);
setKitchens(res.data);

}catch(err){

console.error("Kitchen load error:",err);

}

};

useEffect(() => {
    fetchCategory();
    fetchModifier();
    fetchKitchen();
}, []);

const generateCategoryCode = ()=>{
let next = entries.length + 1;
return String(next).padStart(4,"0");
};

const handleChange = (e)=>{
const {name,value,type,checked} = e.target;

setForm({
...form,
[name]: type==="checkbox" ? checked : value
});
};

const handleEdit = (index)=>{
const row = entries[index];
setForm({...row});
setImage(row.CategoryImage);   // image load ஆகும்
setEditIndex(index);
setShowModal(true);

};

const handleSubmit = async (e)=>{

e.preventDefault();

if(!form.CategoryCode || !form.CategoryName){
alert("Please fill Category Code and Category Name");
return;
}

try{

// UPDATE
if(editIndex !== null){

await axios.put(
`${API_BASE_URL}/category/${form.CategoryId}`,
{
...form,
BackColor: bgColor,
ForeColor: textColor,
IsDispName: displayName,
CategoryImage: image || ""
}
);

}

// INSERT
else{

await axios.post(
`${API_BASE_URL}/category`,
{
...form,
BackColor: bgColor,
ForeColor: textColor,
IsDispName: displayName,
CategoryImage: image || "",
CreatedBy: "00000000-0000-0000-0000-000000000001"
}
);

}

// reload table
fetchCategory();

setEditIndex(null);

setForm({
CategoryCode: generateCategoryCode(),
CategoryName:"",
ShortName:"",
SortCode:"",
isActive:false,
isDiscountAllowed:false,
isKitchenPrint:false,
IsTaxAllowed:false,
NameInOtherLanguage:false,
isServiceCharge:false,
isMemberSalesAllowed:false
});

setImage(null);
setShowModal(false);
setSuccessMsg("Category saved successfully!");

}catch(err){

console.error("Save error:",err);
alert("Save failed");

}

};

return(

<div className="cat-page">

<h1 className="cat-title">Category</h1>

{successMsg && (
<div className="cat-success-msg">
{successMsg}
</div>
)}

<div className="cat-btn-right">

<button
className="cat-new-btn"
onClick={()=>{
setForm({
...form,
CategoryCode:generateCategoryCode()
});
setShowModal(true);
}}
>
New
</button>

</div>

{showModal && (

<div className="cat-modal-overlay">

<div className="cat-modal-content">

<h2>Category</h2>

<form onSubmit={handleSubmit} className="cat-modal-grid">

<div className="cat-left-form">

<div className="cat-form-row">
<label>Category Code</label>
<input
type="text"
name="CategoryCode"
value={form.CategoryCode}
readOnly
/>
</div>

<div className="cat-form-row">
<label>Category Name</label>
<input
type="text"
name="CategoryName"
value={form.CategoryName}
onChange={handleChange}
/>
</div>

<div className="cat-form-row">
<label>Short Name</label>
<input
type="text"
name="ShortName"
value={form.ShortName}
onChange={handleChange}
/>
</div>

<div className="cat-form-row">
<label>Sort Code</label>
<input
type="text"
name="SortCode"
value={form.SortCode}
onChange={handleChange}
/>
</div>

<div className="cat-checkbox-grid">

<label>
<input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange}/>
isActive
</label>

<label>
<input type="checkbox" name="isDiscountAllowed" checked={form.isDiscountAllowed} onChange={handleChange}/>
Discount Allowed
</label>

<label>
<input type="checkbox" name="isKitchenPrint" checked={form.isKitchenPrint} onChange={handleChange}/>
Kitchen Print
</label>

<label>
<input type="checkbox" name="IsTaxAllowed" checked={form.IsTaxAllowed} onChange={handleChange}/>
Tax Allowed
</label>

<label>
<input type="checkbox" name="NameInOtherLanguage" checked={form.NameInOtherLanguage} onChange={handleChange}/>
Other Language
</label>

<label>
<input type="checkbox" name="isServiceCharge" checked={form.isServiceCharge} onChange={handleChange}/>
Service Charge Allowed
</label>

<label>
<input type="checkbox" name="isMemberSalesAllowed" checked={form.isMemberSalesAllowed} onChange={handleChange}/>
Member Sales Allowed
</label>

</div>

</div>

<div className="cat-right-panel">

<div className="cat-tab-header">

<div className={activeTab==="category"?"cat-tab active-tab":"cat-tab"} onClick={()=>setActiveTab("category")}>
Category
</div>

<div className={activeTab==="modifier"?"cat-tab active-tab":"cat-tab"} onClick={()=>setActiveTab("modifier")}>
Modifier
</div>

<div className={activeTab==="kitchen"?"cat-tab active-tab":"cat-tab"} onClick={()=>setActiveTab("kitchen")}>
Kitchen Setup
</div>

</div>

{activeTab==="category" && (

<div className="cat-top-row">

<div className="cat-image-section">

<h4>Category Image</h4>

<div className="cat-image-box">
{image && <img src={image} alt="category"/>}
</div>

<div className="cat-image-buttons">

<button
type="button"
onClick={()=>fileInputRef.current.click()}
>
Scan
</button>

<button
type="button"
onClick={()=>setImage(null)}
>
Clear
</button>

</div>

<input
type="file"
accept="image/*"
ref={fileInputRef}
style={{display:"none"}}
onChange={(e)=>{
if(e.target.files && e.target.files[0]){
setImage(URL.createObjectURL(e.target.files[0]));
}
}}
/>

</div>

<div className="cat-preview-section">

<h4>Preview</h4>
<div className="cat-preview-box">

{image && (
<img
src={image}
alt="preview"
className="cat-preview-img"
/>
)}

{displayName && (
<div
className="cat-preview-text"
style={{ background: bgColor, color: textColor }}
>
{form.CategoryName || "DRINKS"}
</div>
)}

</div>

<label className="cat-display-check">

<input
type="checkbox"
checked={displayName}
onChange={(e)=>setDisplayName(e.target.checked)}
/>

Display Name

</label>

<button className="cat-apply-btn">
Apply All
</button>

</div>

<div className="cat-preview-buttons">

<h4>Button Color</h4>

<div
className="cat-button-preview"
style={{
background:bgColor,
color:textColor
}}
>
{form.CategoryName || "DRINKS"}
</div>

<div className="cat-color-buttons">

<button
type="button"
className="cat-small-btn"
onClick={()=>bgColorRef.current.showPicker()}
>
Color
</button>

<button
type="button"
className="cat-small-btn"
onClick={()=>textColorRef.current.showPicker()}
>
Text Color
</button>

<input
type="color"
ref={bgColorRef}
value={bgColor}
onChange={(e)=>setBgColor(e.target.value)}
className="cat-hidden-color"
/>

<input
type="color"
ref={textColorRef}
value={textColor}
onChange={(e)=>setTextColor(e.target.value)}
className="cat-hidden-color"
/>

</div>

</div>

</div>

)}

{activeTab==="modifier" && (

<div>

{modifiers.length === 0 ? (

<p>No modifier data</p>

) : (

<div className="modifier-box">

<input
type="text"
placeholder="Search Modifier..."
className="modifier-search"
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

<div className="modifier-list">

{filteredModifiers.map((m)=>(
<label key={m.ModifierId} className="modifier-item">

<input
type="checkbox"
checked={selectedModifiers.includes(m.ModifierId)}
onChange={(e)=>{

if(e.target.checked){

setSelectedModifiers([...selectedModifiers,m.ModifierId]);

}else{

setSelectedModifiers(
selectedModifiers.filter(id => id !== m.ModifierId)
);

}

}}
/>

{m.ModifierName}

</label>
))}

</div>

</div>

)}

</div>

)}

{activeTab==="kitchen" && (

<div className="kitchen-box">

{kitchens.length===0 ? (

<p>No kitchen data</p>

) : (

<div className="kitchen-list">

{kitchens.map((k)=>(
<label key={k.KitchenId} className="kitchen-item">

<input
type="checkbox"
checked={selectedKitchens.includes(k.KitchenId)}
onChange={(e)=>{

if(e.target.checked){

setSelectedKitchens([...selectedKitchens,k.KitchenId]);

}else{

setSelectedKitchens(
selectedKitchens.filter(id=>id!==k.KitchenId)
);

}

}}
/>

{k.KitchenTypeName}

</label>
))}

</div>

)}

</div>

)}


</div>

<div className="cat-modal-buttons">

<button type="submit" className="cat-save-btn">
Save
</button>

<button type="button" className="cat-cancel-btn" onClick={()=>setShowModal(false)}>
Cancel
</button>

</div>

</form>

</div>

</div>

)}

<table className="cat-table">

<thead>
<tr>
<th>Code</th>
<th>Name</th>
<th>Short</th>
<th>Sort</th>
<th>isActive</th>
<th>Discount</th>
<th>Kitchen</th>
<th>Tax</th>
<th>Language</th>
<th>Service</th>
<th>Member</th>
</tr>
</thead>

<tbody>

{entries.length===0 ? (
<tr>
<td colSpan="11" style={{textAlign:"left"}}>
No entries yet
</td>
</tr>
) : (

entries.map((row,index)=>(
<tr key={index} onClick={()=>handleEdit(index)} style={{cursor:"pointer"}}>
<td>{row.CategoryCode}</td>
<td>{row.CategoryName}</td>
<td>{row.ShortName}</td>
<td>{row.SortCode}</td>
<td>{row.isActive ? "Yes":"No"}</td>
<td>{row.isDiscountAllowed ? "Yes":"No"}</td>
<td>{row.isKitchenPrint ? "Yes":"No"}</td>
<td>{row.IsTaxAllowed ? "Yes":"No"}</td>
<td>{row.NameInOtherLanguage ? "Yes":"No"}</td>
<td>{row.isServiceCharge ? "Yes":"No"}</td>
<td>{row.isMemberSalesAllowed ? "Yes":"No"}</td>
</tr>
))

)}

</tbody>

</table>

</div>

);

}

export default About;