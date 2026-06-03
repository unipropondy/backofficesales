import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./DishGroup.css";

function DishGroup() {

const [entries,setEntries] = useState([]);
const [showModal,setShowModal] = useState(false);
const [activeTab,setActiveTab] = useState("category");

const [image,setImage] = useState(null);
const [displayName,setDisplayName] = useState(true);

const [bgColor,setBgColor] = useState("#2e7d32");
const [textColor,setTextColor] = useState("#ffffff");

const fileInputRef = useRef(null);
const bgColorRef = useRef(null);
const textColorRef = useRef(null);
const [editingIndex,setEditingIndex] = useState(null);

const [form,setForm] = useState({
DishGroupCode:"",
DishGroupName:"",
ShortName:"",
SortCode:"",
KitchenSortCode:"",
CategoryId:"",
NameInOtherLanguage:"",
ShowModifierTabOrder:"No",
IsActive:"No",
isDiscountAllowed:"No",
IsTaxAllowed:"No",
isKitchenprint:"No",
isServiceCharge:"No",
isMemberSalesAllowed:"No"
});


// ✅ API GET
const fetchDishGroup = async () => {
try{

const res = await axios.get("http://localhost:5000/api/dishgroup");

setEntries(res.data);

}catch(err){

console.error("DishGroup load error:",err);

}
};


// ✅ PAGE LOAD
useEffect(()=>{
fetchDishGroup();
},[]);
const handleChange=(e)=>{
const {name,type,checked,value}=e.target;

setForm({
...form,
[name]: type==="checkbox" ? (checked?"Yes":"No") : value
});
};

const handleSubmit = (e) => {
    e.preventDefault();

    const code = form.DishGroupCode?.toString().trim();
    const name = form.DishGroupName?.toString().trim();

    if (!code || !name) {
      alert("Please enter both Dish Group Code and Name before saving.");
      return;
    }

if(editingIndex !== null){

const updated = [...entries];
updated[editingIndex] = form;

setEntries(updated);
setEditingIndex(null);

}else{

setEntries([...entries,{...form}]);

}

setForm({
DishGroupCode:"",
DishGroupName:"",
ShortName:"",
SortCode:"",
KitchenSortCode:"",
CategoryId:"",
NameInOtherLanguage:"",
ShowModifierTabOrder:"No",
IsActive:"No",
isDiscountAllowed:"No",
IsTaxAllowed:"No",
isKitchenprint:"No",
isServiceCharge:"No",
isMemberSalesAllowed:"No"
});

setShowModal(false);
};


const handleEdit = (index) => {

setForm(entries[index]);
setEditingIndex(index);
setShowModal(true);

};

return(

<div className="dg-page">

<h1 className="dg-title">Dish Group</h1>

<div className="dg-btn-right">
<button
className="dg-new-btn"
onClick={()=>{
setForm({
DishGroupCode:"",
DishGroupName:"",
ShortName:"",
SortCode:"",
KitchenSortCode:"",
CategoryId:"",
NameInOtherLanguage:"",
ShowModifierTabOrder:"No",
IsActive:"No",
isDiscountAllowed:"No",
IsTaxAllowed:"No",
isKitchenprint:"No",
isServiceCharge:"No",
isMemberSalesAllowed:"No"
});

setEditingIndex(null);
setShowModal(true);
}}
>
New
</button>
</div>

{showModal && (

<div className="dg-modal-overlay">

<div className="dg-modal">

<h2>Add Dish Group</h2>

<form onSubmit={handleSubmit}>

<div className="dg-layout">

{/* LEFT PANEL */}

<div className="dg-left">

<div className="dg-input-grid">

<div className="dg-field">
<label>Dish Group Code</label>
<input
type="text"
name="DishGroupCode"
value={form.DishGroupCode}
onChange={handleChange}
/>
</div>

<div className="dg-field">
<label>Dish Group Name</label>
<input
type="text"
name="DishGroupName"
value={form.DishGroupName}
onChange={handleChange}
/>
</div>

<div className="dg-field">
<label>Short Name</label>
<input
type="text"
name="ShortName"
value={form.ShortName}
onChange={handleChange}
/>
</div>

<div className="dg-field">
<label>Sort Code</label>
<input
type="number"
name="SortCode"
placeholder="Sort Code"
value={form.SortCode}
onChange={handleChange}
/>
</div>

<div className="dg-field">
<label>Kitchen Sort Code</label>
<input
type="number"
name="KitchenSortCode"
placeholder="Kitchen Sort Code"
value={form.KitchenSortCode}
onChange={handleChange}
/>
</div>

<div className="dg-category-row">
<div className="dg-field">
<label>Category</label>
<input
type="text"
name="CategoryId"
placeholder="Category"
value={form.CategoryId}
onChange={handleChange}
/>
</div>

<button type="button">...</button>

</div>

<div className="dg-category-row">
<div className="dg-field"></div>
<label>Other Language</label>
<input
type="text"
name="NameInOtherLanguage"
placeholder="Other Language"
value={form.NameInOtherLanguage}
onChange={handleChange}
/>
</div>

</div>

<div className="dg-checkbox-grid">

<label>
<input
type="checkbox"
name="IsActive"
checked={form.IsActive==="Yes"}
onChange={handleChange}
/>
Active
</label>

<label>
<input
type="checkbox"
name="isDiscountAllowed"
checked={form.isDiscountAllowed==="Yes"}
onChange={handleChange}
/>
Discount Allowed
</label>

<label>
<input
type="checkbox"
name="IsTaxAllowed"
checked={form.IsTaxAllowed==="Yes"}
onChange={handleChange}
/>
Tax Allowed
</label>

<label>
<input
type="checkbox"
name="isKitchenprint"
checked={form.isKitchenprint==="Yes"}
onChange={handleChange}
/>
Kitchen Print
</label>

<label>
<input
type="checkbox"
name="isServiceCharge"
checked={form.isServiceCharge==="Yes"}
onChange={handleChange}
/>
Service Charge Allowed
</label>

<label>
<input
type="checkbox"
name="isMemberSalesAllowed"
checked={form.isMemberSalesAllowed==="Yes"}
onChange={handleChange}
/>
Member Sales Allowed
</label>

<label>

<input
type="checkbox"
name="ShowModifierTabOrder"
checked={form.ShowModifierTabOrder==="Yes"}
onChange={handleChange}
/>

Show Modifier Tab Order

</label>

</div>

</div>

{/* RIGHT PANEL */}

<div className="dg-right">

<div className="dg-tab-header">

<div
className={activeTab==="category"?"dg-tab dg-active":"dg-tab"}
onClick={()=>setActiveTab("category")}
>
Customize
</div>

<div
className={activeTab==="modifier"?"dg-tab dg-active":"dg-tab"}
onClick={()=>setActiveTab("modifier")}
>
Modifier
</div>

<div
className={activeTab==="kitchen"?"dg-tab dg-active":"dg-tab"}
onClick={()=>setActiveTab("kitchen")}
>
Kitchen Setup
</div>

</div>

{activeTab==="category" && (

<div className="dg-top-row">

<div className="dg-image">

<h4>Dish Group Image</h4>

<div className="dg-image-box">
{image && <img src={image} alt="preview"/>}
</div>

<div className="dg-image-btn">

<button
type="button"
onClick={()=>fileInputRef.current.click()}
>
SCAN
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
onChange={(e)=>setImage(URL.createObjectURL(e.target.files[0]))}
/>

</div>

<div className="dg-preview">

<h4>Preview</h4>

<div className="dg-preview-box">

{displayName && (

<div
className="dg-preview-text"
style={{background:bgColor,color:textColor}}
>
{form.DishGroupName || "SOUP"}
</div>

)}

</div>

<label>

<input
type="checkbox"
checked={displayName}
onChange={(e)=>setDisplayName(e.target.checked)}
/>

Display Name

</label>

<button className="dg-apply">
Apply To All
</button>

</div>

<div className="dg-button-color">

<h4>Button Color</h4>

<div
className="dg-button-preview"
style={{background:bgColor,color:textColor}}
>
{form.DishGroupName || "SOUP"}
</div>

<div className="dg-color-btn">

<button
type="button"
onClick={()=>bgColorRef.current.showPicker()}
>
Color
</button>

<button
type="button"
onClick={()=>textColorRef.current.showPicker()}
>
Text Color
</button>

<input
type="color"
ref={bgColorRef}
value={bgColor}
onChange={(e)=>setBgColor(e.target.value)}
className="dg-hidden"
/>

<input
type="color"
ref={textColorRef}
value={textColor}
onChange={(e)=>setTextColor(e.target.value)}
className="dg-hidden"
/>

</div>

</div>

</div>

)}

</div>

</div>

<div className="dg-modal-buttons">

<button type="submit" className="dg-save">
Save
</button>

<button
type="button"
className="dg-cancel"
onClick={()=>setShowModal(false)}
>
Cancel
</button>

</div>

</form>

</div>

</div>

)}

<div className="dg-table-wrapper">

<table className="dg-table">

<thead>
<tr>
<th>S.No</th>
<th>DishGroupCode</th>
<th>DishGroupName</th>
<th>Active</th>
<th>KitchenPrint</th>
<th>Discount</th>
<th>SortCode</th>
<th>KitchenSortCode</th>
</tr>
</thead>

<tbody>

{entries.length===0 ? (

<tr>

<td colSpan="8" style={{textAlign:"left"}}>
No entries yet
</td>

</tr>

):(entries.map((row,index)=>(

<tr key={index} onClick={() => handleEdit(index)} style={{cursor:"pointer"}}>

<td>{index+1}</td>
<td>{row.DishGroupCode}</td>
<td>{row.DishGroupName}</td>

<td>{row.Active}</td>
<td>{row.KitchenPrint}</td>
<td>{row.Discount}</td>

<td>{row.SortCode}</td>
<td>{row.KitchenSortCode}</td>

</tr>

)))}

</tbody>

</table>

</div>

</div>

);

}

export default DishGroup;