import { useState, useEffect } from "react";
import axios from "axios";
import "./ServerMaster.css";

function ServerMaster({ sidebarOpen }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    SER_NAME: "",
    Activeflag: true,
  });

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/server");
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
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ================= OPEN MODAL =================
  const openModal = (item = null) => {
    if (item) {
      setEditId(item.SER_ID);
      setForm({
        SER_NAME: item.SER_NAME,
        Activeflag: item.Activeflag === true || item.Activeflag === 1,
      });
    } else {
      setEditId(null);
      setForm({
        SER_NAME: "",
        Activeflag: true,
      });
    }
    setShowModal(true);
  };

  // ================= SAVE DATA =================
  const handleSave = async () => {
    if (!form.SER_NAME.trim()) {
      alert("Please enter a server name.");
      return;
    }

    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/server/${editId}`, form);
      } else {
        await axios.post("http://localhost:5000/api/server", form);
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
    if (window.confirm("Are you sure you want to delete this server?")) {
      try {
        await axios.delete(`http://localhost:5000/api/server/${id}`);
        setShowModal(false);
        fetchData();
      } catch (err) {
        console.error("Delete Error:", err);
        alert("Failed to delete server.");
      }
    }
  };

  return (
    <div className={`servermaster-page ${sidebarOpen ? "servermaster-sidebar-open" : ""}`}>
      <div className="servermaster-container">
        {/* HEADER AREA */}
        <div className="servermaster-top-header">
          <h1 className="servermaster-page-title">Server Master</h1>
          <button className="servermaster-btn-orange-new" onClick={() => openModal()}>
            New
          </button>
        </div>

        {/* TABLE AREA */}
        <div className="servermaster-table-card">
          <table className="servermaster-custom-table">
            <thead>
              <tr>
                <th className="servermaster-text-center" style={{ width: "50%" }}>SERVER NAME</th>
                <th className="servermaster-text-center" style={{ width: "50%" }}>
                  ACTIVEFLAG
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="2" className="servermaster-text-center">Loading...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="2" className="servermaster-text-center">No servers found.</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.SER_ID} onClick={() => openModal(item)}>
                    <td className="servermaster-text-center">{item.SER_NAME}</td>
                    <td className="servermaster-text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="servermaster-custom-checkbox"
                        checked={item.Activeflag}
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
        <div className="servermaster-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="servermaster-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="servermaster-modal-header">
              <h2>Server Master</h2>
            </div>

            <div className="servermaster-form-field">
              <label>Server Name</label>
              <input
                type="text"
                name="SER_NAME"
                placeholder="Enter server name"
                value={form.SER_NAME}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className="servermaster-form-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="Activeflag"
                  className="servermaster-custom-checkbox"
                  checked={form.Activeflag}
                  onChange={handleChange}
                />
                Active
              </label>
            </div>

            <div className="servermaster-modal-footer">
              {editId && (
                <button
                  className="servermaster-btn-delete-red"
                  onClick={() => handleDelete(editId)}
                >
                  Delete
                </button>
              )}
              <button className="servermaster-btn-cancel-grey" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="servermaster-btn-save-orange" onClick={handleSave}>
                {editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServerMaster;
