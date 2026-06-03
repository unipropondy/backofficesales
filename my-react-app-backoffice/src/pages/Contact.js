import { useState, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // npm install uuid
import "./Contact.css";

function Contact() {
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    kitchen_code: "",
    kitchen_name: "",
    active: "Yes",
  });

  const [successMsg, setSuccessMsg] = useState("");

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    fetchKitchen();
  }, []);

  const fetchKitchen = async () => {
    try {
      const res = await axios.get("http://localhost:3000/kitchen");
      const data = res.data.map((item) => ({
        id: item.KitchenTypeId,
        kitchen_code: item.KitchenTypeCode,
        kitchen_name: item.KitchenTypeName,
        active: item.isActive ? "Yes" : "No",
      }));
      setEntries(data);
    } catch (err) {
      console.error("Error fetching kitchen:", err);
      alert("Failed to load kitchen data");
    }
  };

  /* =========================
     FORM CHANGE
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  /* =========================
     OPEN EDIT
  ========================= */
  const handleEdit = (entry) => {
    setForm({
      kitchen_code: entry.kitchen_code,
      kitchen_name: entry.kitchen_name,
      active: entry.active,
    });
    setEditingId(entry.id);
    setShowModal(true);
  };

  /* =========================
     DELETE
  ========================= */
 const handleDelete = async (id) => {

  if (!window.confirm("Delete this kitchen?")) return;

  try {

    const res = await axios.delete(`http://localhost:3000/kitchen/${id}`);

    setSuccessMsg(res.data.message);

    fetchKitchen();

    setTimeout(() => setSuccessMsg(""), 3000);

  } catch (err) {

    console.error("Delete error:", err);

    alert(err.response?.data?.message || "Delete failed");

  }

};

  /* =========================
     SUBMIT (ADD / UPDATE)
  ========================= */
   const handleSubmit = async (e) => {
    e.preventDefault();

    const code = form.kitchen_code?.toString().trim();
    const name = form.kitchen_name?.toString().trim();

    if (!code || !name) {
      alert("Please enter both Kitchen Code and Name before saving.");
      return;
    }

    try {
      // Generate GUIDs for new entry
      const BusinessUnitId = "11111111-1111-1111-1111-111111111111"; // replace with real BU ID
      const CreatedBy = "22222222-2222-2222-2222-222222222222"; // replace with real user ID

      const payload = {
        BusinessUnitId,
        KitchenTypeCode: parseInt(form.kitchen_code), // numeric
        KitchenTypeName: form.kitchen_name,
        isActive: form.active === "Yes" ? 1 : 0,
        CreatedBy,
      };

      if (editingId) {
        // For update, we need ModifiedBy GUID
        payload.ModifiedBy = CreatedBy;

        await axios.put(
          `http://localhost:3000/kitchen/${editingId}`,
          payload
        );
        setSuccessMsg("Kitchen updated successfully");
      } else {
        await axios.post("http://localhost:3000/kitchen", payload);
        setSuccessMsg("Kitchen added successfully");
      }

      setForm({ kitchen_code: "", kitchen_name: "", active: "Yes" });
      setEditingId(null);
      setShowModal(false);
      fetchKitchen();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed. Check backend server!");
    }
  };

  /* =========================
     NEW BUTTON
  ========================= */
  const openNewModal = () => {
    setForm({ kitchen_code: "", kitchen_name: "", active: "Yes" });
    setEditingId(null);
    setShowModal(true);
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="contact-page">
      <h1 style={{ textAlign: "center" }}>Kitchen</h1>
      {successMsg && <div className="success-msg">{successMsg}</div>}

      <div className="btn_right">
        <button className="btn_right_btn" onClick={openNewModal}>
          New
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content1">
            <h2>{editingId ? "Edit Kitchen" : "New Kitchen"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="modal-form">
                <input
                  type="number"
                  name="kitchen_code"
                  placeholder="Kitchen Type Code"
                  value={form.kitchen_code}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="kitchen_name"
                  placeholder="Kitchen Type Name"
                  value={form.kitchen_name}
                  onChange={handleChange}
                />
                <select name="active" value={form.active} onChange={handleChange}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="modal-buttons2">
                <button type="submit" className="save-btn">
                  {editingId ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="contact-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Kitchen Code</th>
            <th>Kitchen Name</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No entries
              </td>
            </tr>
          ) : (
            entries.map((row, index) => (
              <tr key={row.id}>
                <td>{index + 1}</td>
                <td>{row.kitchen_code}</td>
                <td>{row.kitchen_name}</td>
                <td>{row.active}</td>
                <td>
                  <button onClick={() => handleEdit(row)}>Edit</button>
                  {/* <button
                    style={{ marginLeft: "5px" }}
                    onClick={() => handleDelete(row.id)}
                  >
                    Delete
                  </button> */}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Contact;