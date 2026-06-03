import { useState, useEffect } from "react";
import axios from "axios";
import "./Paymode.css";

function Paymode() {

  const [mode, setMode] = useState("list");
  const [data, setData] = useState([]);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    position: "",
    paymode: "",
    description: "",
    active: true,
    entertainment: false,
    imagePreview: null
  });

  // ================= FETCH =================
  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/paymode");
      setData(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= INPUT =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  // ================= IMAGE =================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({
          ...form,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // ================= EDIT =================
  const handleEdit = (item) => {
    setForm({
      position: item.Position,
      paymode: item.PayMode,
      description: item.Description,
      active: item.Active === true || item.Active === 1,
      entertainment: item.isEntertainment === true || item.isEntertainment === 1,
      imagePreview: item.PaymodeImage || null
    });

    setEditId(item.Position);
    setMode("form");
  };

  // ================= SAVE =================
  const handleSave = async () => {
    const position = form.position?.toString().trim();
    const paymode = form.paymode?.toString().trim();

    // ✅ VALIDATION: Check required fields
    if (!position) {
      alert("❌ Error: Position is required.");
      console.error("Validation failed: Position is empty");
      return;
    }

    if (!paymode) {
      alert("❌ Error: Paymode is required.");
      console.error("Validation failed: Paymode is empty");
      return;
    }

    try {
      const payload = {
        position: Number(form.position),
        paymode: form.paymode,
        description: form.description || "",
        active: form.active,
        entertainment: form.entertainment,
        image: form.imagePreview
      };

      console.log(`📤 ${editId ? 'PUT' : 'POST'} request:`, payload);

      if (editId !== null) {
        const res = await axios.put(
          `http://localhost:5000/api/paymode/${editId}`,
          payload
        );
        console.log("✅ Update response:", res.data);
        alert("✅ Paymode updated successfully!");
      } else {
        const res = await axios.post(
          "http://localhost:5000/api/paymode",
          payload
        );
        console.log("✅ Save response:", res.data);
        alert("✅ Paymode saved successfully!");
      }

      // ✅ Reset form and reload
      fetchData();
      setMode("list");
      setEditId(null);
      setForm({
        position: "",
        paymode: "",
        description: "",
        active: true,
        entertainment: false,
        imagePreview: null
      });

    } catch (err) {
      console.error("❌ SAVE ERROR:", err);
      const errorMsg = err.response?.data?.message || err.message || "Unknown error";
      alert(`❌ Save failed: ${errorMsg}`);
    }
  };

  return (
    <div className="payment-page1">

      {/* HEADER */}
      <div className="payment-header1">
        <h1 className="payment-title1">Paymode</h1>
      </div>

      {/* ================= LIST ================= */}
      {mode === "list" && (
        <div className="payment-box1">

          <div className="payment-bottomBtns1">
            <button
              className="payment-btn1 payment-new1"
              onClick={() => {
                setMode("form");
                setEditId(null);
              }}
            >
              New
            </button>
          </div>

          <table className="payment-table1">
            <thead>
              <tr>
                <th>Position</th>
                <th>Paymode</th>
                <th>Description</th>
                <th>Active</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="4">No entries</td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={index} onClick={() => handleEdit(item)}>
                    <td>{item.Position}</td>
                    <td>{item.PayMode}</td>
                    <td>{item.Description}</td>
                    <td>{item.Active ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

        </div>
      )}

      {/* ================= FORM ================= */}
      {mode === "form" && (
        <div className="payment-modalOverlay1">

          <div className="payment-modal1">

            <h2 className="payment-modalTitle1">
              {editId ? "Edit Paymode" : "New Paymode"}
            </h2>

            {/* INPUTS */}
            <div className="payment-modalRow1">

              <div className="payment-field1">
                <label>Position</label>
                <input
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                />
              </div>

              <div className="payment-field1">
                <label>Paymode</label>
                <input
                  name="paymode"
                  value={form.paymode}
                  onChange={handleChange}
                />
              </div>

              <div className="payment-field1">
                <label>Description</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

            </div>

            {/* CHECKBOX + IMAGE */}
            <div className="payment-modalRow1">

              <div className="payment-checkbox1">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                <label>Active</label>
              </div>

              {/* IMAGE BOX */}
              <div className="payment-imageBox1">
                {form.imagePreview ? (
                  <img src={form.imagePreview} alt="preview" />
                ) : (
                  <span></span>
                )}
              </div>

              {/* FILE INPUT */}
              <input
                type="file"
                id="scanInput"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />

              <label htmlFor="scanInput" className="payment-btn1 payment-scan1">
                Scan
              </label>

              <div className="payment-checkbox1">
                <input
                  type="checkbox"
                  name="entertainment"
                  checked={form.entertainment}
                  onChange={handleChange}
                />
                <label>Entertainment</label>
              </div>

            </div>

            {/* BUTTONS */}
            <div className="payment-modalActions1">
              <button
                className="payment-btn1 payment-save1"
                onClick={handleSave}
              >
                Save
              </button>

              <button
                className="payment-btn1 payment-exit1"
                onClick={() => setMode("list")}
              >
                Cancel
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Paymode;