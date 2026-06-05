import React, { useState, useEffect } from "react";
 
import "./usergroup.css";
 
import axios from "axios";
import { API_BASE_URL } from "../config/config";
 
import { useNavigate } from "react-router-dom";
 
export default function UserGroup() {
 
  const navigate = useNavigate();
 
  const [groups, setGroups] = useState([]);
 
  const [selectedIndex, setSelectedIndex] = useState(null);
 
  const [showModal, setShowModal] = useState(false);
 
  const initialFormData = {
 
    id: null,
 
    code: "",
 
    name: "",
 
    active: true,
 
    createdUser: "",
 
    createdDate: "",
 
    modifyUser: "",
 
    modifyDate: "",
 
  };
 
  const [formData, setFormData] = useState(initialFormData);
 
  const fetchGroups = async () => {
 
    try {
 
      const res = await axios.get(`${API_BASE_URL}/api/usergroup`);
 
      setGroups(res.data);
 
    } catch (err) {
 
      console.log("Fetch error:", err);
 
    }
 
  };
 
  useEffect(() => {
 
    fetchGroups();
 
  }, []);
 
  useEffect(() => {
 
    const esc = (e) => {
 
      if (e.key === "Escape") setShowModal(false);
 
    };
 
    window.addEventListener("keydown", esc);
 
    return () => window.removeEventListener("keydown", esc);
 
  }, []);
 
  const handleSelect = (index) => {
 
    setSelectedIndex(index);
 
    setFormData(groups[index]);
 
    setShowModal(true);
 
  };
 
  const handleChange = (e) => {
 
    const { name, value, type, checked } = e.target;
 
    setFormData({
 
      ...formData,
 
      [name]: type === "checkbox" ? checked : value,
 
    });
 
  };
 
  const handleNew = () => {
 
    setFormData(initialFormData);
 
    setSelectedIndex(null);
 
    setShowModal(true);
 
  };
 
  const handleSave = async () => {
    const code = formData.code?.trim();
    const name = formData.name?.trim();

    if (!code || !name) {
      alert("Please enter both User Group Code and Name before saving.");
      return;
    }
 
    try {
 
      await axios.post(`${API_BASE_URL}/api/usergroup`, formData);
 
      alert("Saved");
 
      fetchGroups();
 
      setShowModal(false);
 
    } catch (err) {
 
      console.log(err);
 
    }
 
  };
 
  const handleDelete = () => {
 
    if (selectedIndex === null) {
 
      alert("Select a record");
 
      return;
 
    }
 
    if (window.confirm("Delete this record?")) {
 
      const updated = groups.filter((_, idx) => idx !== selectedIndex);
 
      setGroups(updated);
 
      setShowModal(false);
 
    }
 
  };
 
  const handleClose = () => setShowModal(false);
 
  return (
<div id="usergroup-container" className="usergroup-container1">
 
      <div id="full-page" className="full-page1">
 
        {/* HEADER */}
<div id="top-bar1" className="top-bar1">
<h2 id="top-title1" className="top-title1">User Group</h2>
 
          <button id="btn-new1" className="btn-new1" onClick={handleNew}>
 
            New
</button>
</div>
 
        {/* TABLE */}
<table id="styled-table1" className="styled-table1">
<thead>
<tr>
<th>ID</th>
<th>Code</th>
<th>Name</th>
<th>Active</th>
<th>Created</th>
<th>Modified</th>
</tr>
</thead>
 
          <tbody>
 
            {groups.length === 0 ? (
<tr>
<td colSpan="6">No records available</td>
</tr>
 
            ) : (
 
              groups.map((grp, index) => (
<tr key={grp.id} onClick={() => handleSelect(index)}>
<td>{grp.id}</td>
<td>{grp.code}</td>
<td>{grp.name}</td>
<td>{grp.active ? "Yes" : "No"}</td>
<td>{grp.createdDate || "-"}</td>
<td>{grp.modifyDate || "-"}</td>
</tr>
 
              ))
 
            )}
</tbody>
</table>
 
      </div>
 
      {/* MODAL */}
 
      {showModal && (
<div id="form-overlay1" className="form-overlay1">
<div id="form-modal1" className="form-modal1">
 
            <h2 id="form-title1" className="form-title1">User Group Setup</h2>
 
            <div id="form-left1" className="form-left1">
 
              <label> 
                <span>ID</span>
 
                
<input className="form-left1" id="ug-id" type="number" name="id" value={formData.id || ""} readOnly />
</label>
 
              <label>
                
 <span>Code</span>
                
<input className="form-left1" id="ug-code" type="text" name="code" value={formData.code} onChange={handleChange} />
</label>
 
              <label>
 
                <span>Name</span>
<input className="form-left1" id="ug-name" type="text" name="name" value={formData.name} onChange={handleChange} />
</label>
 
              <label>
 
                <span>Active</span>
<input className="form-left1" id="ug-active" type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
</label>
 
            </div>
 
            <div id="button-box1" className="button-box1">
<button id="save-btn1" className="save-btn1" onClick={handleSave}>Save</button>
<button id="delete-btn1" className="delete-btn1" onClick={handleDelete}>Delete</button>
<button id="cancel-btn1" className="cancel-btn1" onClick={handleClose}>Close</button>
</div>
 
          </div>
</div>
 
      )}
 
    </div>
 
  );
 
}
 