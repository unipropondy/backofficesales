import { API_BASE_URL } from "../config/config";
import React, { useEffect, useState } from "react";
import { ChromePicker } from "react-color";
import "./Discount.css";
 
export default function Discount({ sidebarOpen }) {
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerType, setPickerType] = useState("");
  const [editId, setEditId] = useState(null);
 
  // ✅ ADDED
  const [isReadOnly, setIsReadOnly] = useState(false);
 
  const [form, setForm] = useState({
    DiscountCode: "",
    Description: "",
    DiscountPercentage: "",
    FromDate: "",
    ToDate: "",
    isActive: true,
    isGuestMeal: false,
    Backcolor: "",
    ForeColor: ""
  });
 
  const loadData = async () => {
    try {
      const res = await fetch(API_BASE_URL + "/api/discount");
 
      if (!res.ok) {
        const err = await res.json();
        console.error("GET ERROR:", err);
        return;
      }
 
      const json = await res.json();
      console.log("DATA FROM API:", json);
 
      setData(json);
 
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };
 
  useEffect(() => {
    loadData();
  }, []);
 
  const handleChange1 = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };
 
  const deleteData1 = async () => {
    if (!editId) return;
    if (!window.confirm("Are you sure you want to delete this discount?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/discount/${editId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        alert("Delete failed ❌");
        return;
      }
      alert("Deleted successfully ✅");
      setShowForm(false);
      setEditId(null);
      loadData();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting ❌");
    }
  };

 
  const saveData1 = async () => {
    try {
      console.log("SAVE CLICKED:", form);
 
      // ✅ BLOCK SAVE FOR BACKEND DATA
      if (isReadOnly) {
        setShowForm(false);
        return;
      }
 
      const url = editId
        ? `${API_BASE_URL}/api/discount/${editId}`
        : API_BASE_URL + "/api/discount";
 
      const method = editId ? "PUT" : "POST";
 
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
 
      if (!res.ok) {
        const errText = await res.text();
        console.error("Backend Error:", errText);
        alert("Save failed ❌");
        return;
      }
 
      alert("Saved successfully ✅");
 
      setShowForm(false);
      setEditId(null);
 
      setForm({
        DiscountCode: "",
        Description: "",
        DiscountPercentage: "",
        FromDate: "",
        ToDate: "",
        isActive: true,
        isGuestMeal: false,
        Backcolor: "",
        ForeColor: ""
      });
 
      loadData();
 
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving ❌");
    }
  };
 
  return (
    <div className={`discount-container1 ${sidebarOpen ? "sidebar-open" : ""}`}>
 
      <div className="discount-header1">
        <h2 className="discount-title1">Discount</h2>
 
        <button
          className="discount-new-btn1"
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setIsReadOnly(false); // ✅ reset
          }}
        >
          New
        </button>
      </div>
 
      <table className="discount-table1">
        <thead>
          <tr>
            <th>DiscountCode</th>
            <th>Description</th>
            <th>DiscountPercentage</th>
            <th>Active</th>
            <th>GuestMeal</th>
          </tr>
        </thead>
 
        <tbody>
          {data && data.length > 0 && data.map((d, i) => (
            <tr
              key={i}
              onClick={() => {
                setForm(d);
                setEditId(d.Discountid);
 
                // Removed DC000 restriction so you can edit after saving
                setIsReadOnly(false);
 
                setShowForm(true);
              }}
              style={{ cursor: "pointer" }}
            >
              <td>{d.DiscountCode}</td>
 
              <td>
                <div
                  style={{
                    background: d.Backcolor,
                    color: d.ForeColor,
                    padding: "5px"
                  }}
                >
                  {d.Description} ({d.DiscountPercentage}%)
                </div>
              </td>
 
              <td>{d.DiscountPercentage}</td>
              <td>{d.isActive ? "yes" : "no"}</td>
              <td>{d.isGuestMeal ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
 
      {showForm && (
        <div className="discount-overlay1">
          <div className="discount-form-box1">
 
            <h3 className="discount-form-title1">Discount</h3>
 
            <div className="discount-form-row1">
              <label>Discount Code</label>
              <input name="DiscountCode" value={form.DiscountCode} onChange={handleChange1} disabled={isReadOnly} />
            </div>
 
            <div className="discount-form-row1">
              <label>Description</label>
              <input name="Description" value={form.Description} onChange={handleChange1} disabled={isReadOnly} />
            </div>
 
            <div className="discount-form-row1">
              <label>Discount %</label>
              <input name="DiscountPercentage" value={form.DiscountPercentage} onChange={handleChange1} disabled={isReadOnly} />
             
              <label>Discount $</label>
              <input name="DiscountAmount" disabled={isReadOnly} />
            </div>
 
            <div className="discount-form-row1">
              <label>From Date</label>
              <input type="date" name="FromDate" value={form.FromDate ? String(form.FromDate).split("T")[0] : ""} onChange={handleChange1} disabled={isReadOnly} />
 
              <label>To Date</label>
              <input type="date" name="ToDate" value={form.ToDate ? String(form.ToDate).split("T")[0] : ""} onChange={handleChange1} disabled={isReadOnly} />
            </div>
 
            <div className="discount-form-row1">
              <label>Guest Meal</label>
              <input type="checkbox" name="isGuestMeal" checked={form.isGuestMeal} onChange={handleChange1} disabled={isReadOnly} />
            </div>
 
            <div className="discount-form-row1">
              <label>Active</label>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange1} disabled={isReadOnly} />
            </div>
 
            <div className="discount-btn-row1">
              <button onClick={saveData1} className="discount-save-btn1">
                Save
              </button>
 
              {editId && !isReadOnly && (
                <button onClick={deleteData1} className="discount-delete-btn1" style={{ background: "darkred", color: "white", padding: "8px 20px", border: "none", cursor: "pointer" }}>
                  Delete
                </button>
              )}
 
              <button onClick={() => setShowForm(false)} className="discount-exit-btn1">
                Exit
              </button>
            </div>
 
            <div className="discount-form-row1">
              <label>Button BackColor / ForeColor</label>
 
              <div
                className="discount-preview-box1"
                style={{
                  background: form.Backcolor,
                  color: form.ForeColor
                }}
              >
                {form.Description && form.DiscountPercentage &&
                  `${form.Description} ${form.DiscountPercentage}%`}
              </div>
 
              <div className="discount-color-btns1">
                <button onClick={() => { setPickerType("bg"); setShowColorPicker(true); }}>
                  Color
                </button>
 
                <button onClick={() => { setPickerType("text"); setShowColorPicker(true); }}>
                  Text Color
                </button>
              </div>
            </div>
 
          </div>
 
          {showColorPicker && (
            <div className="discount-custom-picker1">
              <ChromePicker
                color={pickerType === "bg" ? form.Backcolor : form.ForeColor}
                onChange={(color) => {
                  if (pickerType === "bg") {
                    setForm({ ...form, Backcolor: color.hex });
                  } else {
                    setForm({ ...form, ForeColor: color.hex });
                  }
                }}
              />
              <button onClick={() => setShowColorPicker(false)}>OK</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
 