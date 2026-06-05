import { API_BASE_URL } from "../config/config";
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Member.css";

const API = API_BASE_URL + "/api/members";

function Member() {

  const [formData, setFormData] = useState({
    code: "",
    category: "",
    contactPerson: "",
    classification: "",
    companyName: "",
    email: "",
    ic: "",
    phone: "",
    city: "",
    postal: ""
  });

  const [rows, setRows] = useState([]);

  /* INPUT CHANGE */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /* LOAD DATA */
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(API);
      console.log(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* SAVE */
  const handleSave = async () => {
    // ✅ VALIDATION: Check all required fields
    if (!formData.code || formData.code.trim() === "") {
      alert("❌ Error: Member Code is required.");
      console.error("Validation failed: Member Code is empty");
      return;
    }

    if (!formData.companyName || formData.companyName.trim() === "") {
      alert("❌ Error: Company Name is required.");
      console.error("Validation failed: Company Name is empty");
      return;
    }

    if (!formData.contactPerson || formData.contactPerson.trim() === "") {
      alert("❌ Error: Contact Person is required.");
      console.error("Validation failed: Contact Person is empty");
      return;
    }

    console.log("📤 Sending member data to API:", {
      ...formData,
      meals: rows
    });

    try {
      const response = await axios.post(API, {
        ...formData,
        meals: rows
      });

      console.log("✅ Save response:", response.data);
      alert("✅ Member saved successfully!");
      handleNew(); // ✅ Reset form after successful save
    } catch (err) {
      console.error("❌ Save error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Unknown error";
      alert(`❌ Save failed: ${errorMsg}`);
    }
  };

  /* DELETE */
  const handleDelete = async () => {
    if (!formData.code || formData.code.trim() === "") {
      alert("❌ Error: Please select a member to delete (Member Code required).");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete member: ${formData.code}?`)) {
      return;
    }

    try {
      const response = await axios.delete(`${API}/${formData.code}`);
      console.log("✅ Delete response:", response.data);
      alert(`✅ Member ${formData.code} deleted successfully!`);
      handleNew();
    } catch (err) {
      console.error("❌ Delete error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Unknown error";
      alert(`❌ Delete failed: ${errorMsg}`);
    }
  };

  /* NEW */
  const handleNew = () => {
    setFormData({
      code: "",
      category: "",
      contactPerson: "",
      classification: "",
      companyName: "",
      email: "",
      ic: "",
      phone: "",
      city: "",
      postal: ""
    });
    setRows([]);
  };

  /* ADD ROW */
  const addRow = () => {
    setRows([
      ...rows,
      { dishCode: "", dishName: "", start: "", end: "", veg: 0, nonveg: 0, qty: 0 }
    ]);
  };

  const handleRowChange = (i, field, value) => {
    const updated = [...rows];
    updated[i][field] = value;
    setRows(updated);
  };

  return (
    <div className="main-screen1">
      <div className="window1">

        {/* HEADER */}
        <div className="header1">
          <span>Member</span>

          <div className="header-actions1">
            <button onClick={handleNew}>New</button>
            <button onClick={handleSave}>Save</button>
            <button onClick={handleDelete}>Delete</button>
            <button>Close</button>
          </div>
        </div>

        {/* FORM */}
        <div className="form-grid1">
          {input("Code", "code")}
          {input("Category Code", "category")}
          {input("Contact Person", "contactPerson")}
          {input("Classification", "classification")}
          {input("Company Name", "companyName")}
          {input("Email Id", "email")}
          {input("IC / Passport No", "ic")}
          {input("Hand Phone", "phone")}
          {input("City", "city")}
          {input("Postal Code", "postal")}
        </div>

        {/* TABLE */}
        <div className="table-area1">
          <table>
            <thead>
              <tr>
                {["Dish Code","Dish Name","Start","End","Veg","NonVeg","Qty"]
                  .map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td><input onChange={e=>handleRowChange(i,"dishCode",e.target.value)} /></td>
                  <td><input onChange={e=>handleRowChange(i,"dishName",e.target.value)} /></td>
                  <td><input type="date" onChange={e=>handleRowChange(i,"start",e.target.value)} /></td>
                  <td><input type="date" onChange={e=>handleRowChange(i,"end",e.target.value)} /></td>
                  <td><input onChange={e=>handleRowChange(i,"veg",e.target.value)} /></td>
                  <td><input onChange={e=>handleRowChange(i,"nonveg",e.target.value)} /></td>
                  <td><input onChange={e=>handleRowChange(i,"qty",e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLE BUTTONS */}
        <div className="table-buttons1">
          <button onClick={addRow}>Add</button>
          <button>Delete</button>
          <button onClick={()=>setRows([])}>Clear</button>
        </div>

      </div>
    </div>
  );

  function input(label, name) {
    return (
      <div className="field1">
        <label>{label}</label>
        <input
          name={name}
          value={formData[name] || ""}
          onChange={handleChange}
        />
      </div>
    );
  }
}

export default Member;