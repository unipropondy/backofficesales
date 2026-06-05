import React, { useState } from "react";
import "./PrinterSettings.css";

function PrinterSettings(){

const [visible,setVisible]=useState(true);
const [popup,setPopup]=useState("");
const [showSearch,setShowSearch]=useState(false);
const [searchType,setSearchType]=useState("PrinterIP");

const records=[
{name:"Receipt Printer",path:"Microsoft Print to PDF",ip:"Receipt Printer"},
{name:"DRINKS",path:"Microsoft Print to PDF",ip:"DRINKS"},
{name:"INDIAN",path:"Microsoft Print to PDF",ip:"INDIAN"},
{name:"THAI",path:"Microsoft Print to PDF",ip:"THAI"},
{name:"WESTERN",path:"Microsoft Print to PDF",ip:"WESTERN"},
{name:"TakeAway",path:"Microsoft Print to PDF",ip:"TakeAway"},
{name:"SOUTH INDIAN",path:"Microsoft Print to PDF",ip:"SOUTH INDIAN"},
{name:"english",path:"Microsoft Print to PDF",ip:"english"}
];

const [formData,setFormData]=useState({
printerName:"",
printerPath:"",
printerIP:"",
printerType:"",
printSection:"",
kitchenType:"",
active:true,
printCopy:"1"
});

function handleChange(e){
const {name,value,type,checked}=e.target;

setFormData(prev => ({
...prev,
[name]: type==="checkbox"?checked:value
}));
}

function handleNew(){
setFormData({
printerName:"",
printerPath:"",
printerIP:"",
printerType:"",
printSection:"",
kitchenType:"",
active:true,
printCopy:"1"
});
}

function handleSave(){
  const name = formData.printerName?.toString().trim();
  const path = formData.printerPath?.toString().trim();

  if(!name || !path){
    setPopup("Please enter both Printer Name and Path before saving.");
    return;
  }

setPopup("Updated Successfully");
}

function closePopup(){
setPopup("");
}

function selectRecord(item){
setFormData(prev=>({
...prev,
printerName:item.name,
printerPath:item.path,
printerIP:item.ip
}));

setShowSearch(false);
}

if(!visible) return null;

return React.createElement(
"div",
{className:"screen"},

React.createElement(
"div",
{className:"printer-window"},

React.createElement(
"h2",
{className:"title"},
React.createElement("span",{className:"smart"},"SMART"),
React.createElement("span",{className:"cafe"}," Café")
),

React.createElement(
"table",
{className:"form-table"},
React.createElement(
"tbody",
null,

row("Printer Name","printerName",true),
row("Printer Path","printerPath"),
row("Printer IP","printerIP"),
row("Printer Type","printerType"),
row("Print Section","printSection"),
row("Kitchen Type","kitchenType"),
rowCheckbox("Active","active"),
row("Print Copy","printCopy")

)
),

React.createElement(
"div",
{className:"buttons"},

React.createElement(
"button",
{className:"btn",onClick:handleNew},
"New(F2)"
),

React.createElement(
"button",
{className:"btn",onClick:handleSave},
"Save(F4)"
),

React.createElement(
"button",
{className:"btn",onClick:()=>setVisible(false)},
"Exit(Esc)"
)

)

),

popup && React.createElement(
"div",
{className:"popup"},

React.createElement(
"div",
{className:"popup-box"},

React.createElement("p",null,popup),

React.createElement(
"button",
{onClick:closePopup},
"OK"
)

)

),

showSearch && React.createElement(
"div",
{className:"search-window"},

React.createElement(
"h3",
null,
"Help Search"
),

React.createElement(
"div",
{className:"search-top"},

React.createElement(
"label",
null,
"Search"
),

React.createElement(
"select",
{
value:searchType,
onChange:(e)=>setSearchType(e.target.value)
},

React.createElement("option",null,"PrinterIP"),
React.createElement("option",null,"PrinterName"),
React.createElement("option",null,"PrinterPath")

)

),

React.createElement(
"table",
{className:"search-table"},

React.createElement(
"thead",
null,
React.createElement(
"tr",
null,
React.createElement("th",null,"Name"),
React.createElement("th",null,"PrinterPath"),
React.createElement("th",null,"PrinterIP")
)
),

React.createElement(
"tbody",
null,
records.map((item,i)=>
React.createElement(
"tr",
{
key:i,
onClick:()=>selectRecord(item)
},

React.createElement("td",null,item.name),
React.createElement("td",null,item.path),
React.createElement("td",null,item.ip)

)
)
)

),

React.createElement(
"button",
{onClick:()=>setShowSearch(false)},
"Close"
)

)

);

function row(label,name,withButton=false){
return React.createElement(
"tr",
null,
React.createElement("td",null,label),
React.createElement(
"td",
null,

React.createElement("input",{
type:"text",
name:name,
value:formData[name],
onChange:handleChange
}),

withButton && React.createElement(
"button",
{
className:"dots",
onClick:()=>setShowSearch(true)
},
"..."
)

)
);
}

function rowCheckbox(label,name){
return React.createElement(
"tr",
null,
React.createElement("td",null,label),
React.createElement(
"td",
null,
React.createElement("input",{
type:"checkbox",
name:name,
checked:formData[name],
onChange:handleChange
})
)
);
}

}

export default PrinterSettings;