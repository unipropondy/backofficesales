import { useState, useEffect } from "react";
import axios from "axios";
import "./DishOrderItemShare.css";

function DishOrderItemShare({ sidebarOpen }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    CustomerName: "",
    IsSelected: false,
  });

  const isEditMode = editId !== null;

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/dishorderitemshare");
      setData(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      CustomerName: item.CustomerName ?? "",
      IsSelected: item.IsSelected === true || item.IsSelected === 1,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditId(null);
    setForm({
      CustomerName: "",
      IsSelected: false,
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
        CustomerName: form.CustomerName,
        IsSelected: Boolean(form.IsSelected),
      };

      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/dishorderitemshare/${editId}`, payload);
      } else {
        await axios.post(`http://localhost:5000/api/dishorderitemshare`, payload);
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
        await axios.delete(`http://localhost:5000/api/dishorderitemshare/${id}`);
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
                <th className="dishorderitemshare-text-center" style={{ width: "50%" }}>IS SELECTED</th>
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
                        checked={item.IsSelected}
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
              <label>Customer Name</label>
              <input
                type="text"
                name="CustomerName"
                placeholder="Enter customer name"
                value={form.CustomerName}
                onChange={handleChange}
              />
            </div>

            <div className="dishorderitemshare-form-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="IsSelected"
                  className="dishorderitemshare-custom-checkbox"
                  checked={form.IsSelected}
                  onChange={handleChange}
                />
                Is Selected
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
              <button className="dishorderitemshare-btn-cancel-grey" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="dishorderitemshare-btn-save-orange" onClick={handleSave}>
                {isEditMode ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DishOrderItemShare;