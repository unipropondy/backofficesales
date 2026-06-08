import { useState, useEffect } from "react";
import axios from "axios";
import "./DishOrderItemShare.css";
 
import { BASE_URL } from "../config/api";
 
function DishOrderItemShare({ sidebarOpen }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [dishList, setDishList] = useState([]);
 
 const [form, setForm] = useState({
  DishId: "",
  CustomerName: "",
  Amount: "",
  FromDate: "",
  ToDate: "",
  Active: false,
});
 
  const isEditMode = editId !== null;
 
  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/dishorderitemshare`);
      setData(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };
 
 const fetchDishes = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/dish`);
    console.log("Dish List =", res.data);
    setDishList(res.data);
  } catch (err) {
    console.error("Dish Fetch Error:", err);
  }
};
 
  useEffect(() => {
    fetchData();
    fetchDishes();
  }, []);
 
  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue =
      type === "checkbox"
        ? checked
        : type === "number"
        ? value === ""
          ? ""
          : parseInt(value, 10)
        : value;
 
    setForm({
      ...form,
      [name]: newValue,
    });
  };
 
  // ================= OPEN MODAL =================
  const openModal = (item) => {
    if (!item) return;
 
    setEditId(item.Id);
    setForm({
      DishId: item.DishId ?? "",
      CustomerName: item.CustomerName ?? "",
      Amount: item.Amount ?? "",
      FromDate: item.FromDate?.split("T")[0] ?? "",
      ToDate: item.ToDate?.split("T")[0] ?? "",
      Active: item.Active === true || item.Active === 1,
    });
    setShowModal(true);
  };
 
  const handleNew = () => {
    setEditId(null);
   setForm({
  DishId: "",
  CustomerName: "",
  Amount: "",
  FromDate: "",
  ToDate: "",
  Active: false,
});
    setShowModal(true);
  };
 
  // ================= SAVE DATA =================
  const handleSave = async () => {
    if (!form.CustomerName.trim()) {
      alert("Please enter Customer Name.");
      return;
    }
 
    try {
     const payload = {
  DishId: form.DishId,
  CustomerName: form.CustomerName,
  Amount: form.Amount,
  FromDate: form.FromDate,
  ToDate: form.ToDate,
  IsSelected: form.Active
};
 
      if (isEditMode) {
        await axios.put(`${BASE_URL}/dishorderitemshare/${editId}`, payload);
      } else {
        await axios.post(`${BASE_URL}/dishorderitemshare`, payload);
      }
 
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Save Error:", err);
      alert("Failed to save data.");
    }
  };
 
  // ================= DELETE DATA =================
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this dish order item share?")) {
      try {
        await axios.delete(`${BASE_URL}/dishorderitemshare/${id}`);
        setShowModal(false);
        fetchData();
      } catch (err) {
        console.error("Delete Error:", err);
        alert("Failed to delete dish order item share.");
      }
    }
  };
 
  return (
    <div className={`dishorderitemshare-page ${sidebarOpen ? "dishorderitemshare-sidebar-open" : ""}`}>
      <div className="dishorderitemshare-container">
        {/* HEADER AREA */}
        <div className="dishorderitemshare-top-header">
          <h1 className="dishorderitemshare-page-title">Dish Order Item Share</h1>
          <button className="dishorderitemshare-btn-orange-new" onClick={handleNew}>
            New
          </button>
        </div>
 
        {/* TABLE AREA */}
        <div className="dishorderitemshare-table-card">
          <table className="dishorderitemshare-custom-table">
            <thead>
              <tr>
                <th className="dishorderitemshare-text-center" style={{ width: "50%" }}>CUSTOMER NAME</th>
                <th className="dishorderitemshare-text-center" style={{ width: "50%" }}>ACTIVE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="2" className="dishorderitemshare-text-center">Loading...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="2" className="dishorderitemshare-text-center">No dish order item shares found.</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.Id} onClick={() => openModal(item)}>
                    <td className="dishorderitemshare-text-center">{item.CustomerName}</td>
                    <td className="dishorderitemshare-text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="dishorderitemshare-custom-checkbox"
                        checked={item.Active}
                        readOnly
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
 
      {/* MODAL FORM */}
      {showModal && (
        <div className="dishorderitemshare-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="dishorderitemshare-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="dishorderitemshare-modal-header">
              <h2>{isEditMode ? "Update Dish Order Item Share" : "New Dish Order Item Share"}</h2>
            </div>
 
            <div className="dishorderitemshare-form-field">
            <label>Dish Name</label>
 
            <select
              value={form.DishId}
             onChange={(e) => {
  const selectedDish = dishList.find(
    (dish) => dish.DishId === e.target.value
  );

  setForm({
    ...form,
    DishId: selectedDish?.DishId || "",
    CustomerName: selectedDish?.DishName || "",
    Amount: selectedDish?.Amount || ""
  });
}}
            >
              <option value="">Select Dish</option>
 
              {dishList.map((dish) => (
                <option
                  key={dish.DishId}
                  value={dish.DishId}
                >
                  {dish.DishName}
                </option>
              ))}
            </select>
          </div>
 
            <div className="dishorderitemshare-form-field">
            <label>Amount</label>
            <input
              type="number"
              name="Amount"
              value={form.Amount}
              onChange={handleChange}
            />
          </div>
 
          <div className="dishorderitemshare-form-field">
            <label>From Date</label>
            <input
              type="date"
              name="FromDate"
              value={form.FromDate}
              onChange={handleChange}
            />
          </div>
 
          <div className="dishorderitemshare-form-field">
            <label>To Date</label>
            <input
              type="date"
              name="ToDate"
              value={form.ToDate}
              onChange={handleChange}
            />
          </div>
 
            <div className="dishorderitemshare-form-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="Active"
                  className="dishorderitemshare-custom-checkbox"
                  checked={form.Active}
                  onChange={handleChange}
                />
                Active
              </label>
            </div>
 
            <div className="dishorderitemshare-modal-footer">
              {isEditMode && (
                <button
                  className="dishorderitemshare-btn-delete-red"
                  onClick={() => handleDelete(editId)}
                >
                  Delete
                </button>
              )}
               <button className="dishorderitemshare-btn-save-orange" onClick={handleSave}>
                {isEditMode ? "Update" : "Save"}
              </button>
              <button className="dishorderitemshare-btn-cancel-grey" onClick={() => setShowModal(false)}>
                Cancel
              </button>
             
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
export default DishOrderItemShare;
 
 
 