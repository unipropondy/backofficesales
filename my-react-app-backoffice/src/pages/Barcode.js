import { useState, useEffect } from "react";
import axios from "axios";
import "./Barcode.css";

function Barcode({ sidebarOpen }) {

  const [mode, setMode] = useState("list");
  const [data, setData] = useState([]);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    DishId: "",
    dishCode: "",
    dishName: "",
    dishGroup: "",
    price: "",
    BarCode: ""
  });

  const [showPopup, setShowPopup] = useState(false);
  const [dishList, setDishList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ================= FETCH BARCODE =================
  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/barcode");
      setData(res.data);
    } catch (err) {
      console.error("❌ Barcode Fetch Error:", err);
      alert("Backend not working");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Lock body scroll when modal is open
  useEffect(() => {
    if (mode === "form") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mode]);

  // ================= FETCH DISH LIST =================
  const fetchDishList = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/barcode/dish-list"
      );
      setDishList(res.data);
    } catch (err) {
      console.error("❌ FETCH ERROR:", err);
      alert("Error loading dish list");
    }
  };

  // ================= DELETE =================
  const handleDelete = async () => {
    if (!editId) return;

    if (!window.confirm("Are you sure you want to delete this barcode?")) {
      return;
    }

    try {
      const res = await axios.delete(
        `http://localhost:5000/api/barcode/${editId}`
      );

      if (res.data.message === "Deleted ✅") {
        alert("Deleted Successfully");
        fetchData();
        setMode("list");
      } else {
        alert(res.data.message || "Delete failed");
      }
    } catch (err) {
      console.error("❌ DELETE ERROR:", err);
      alert("Delete failed");
    }
  };

  // ================= SAVE =================
  const handleSave = async () => {
    try {
      const barcode = form.BarCode?.toString().trim();
      const dishId = form.DishId;

      // ✅ VALIDATION: Check required fields
      if (!barcode) {
        alert("❌ Error: Barcode is required.");
        console.error("Validation failed: Barcode is empty");
        return;
      }

      if (!dishId) {
        alert("❌ Error: Please select a Dish before saving.");
        console.error("Validation failed: Dish ID is empty");
        return;
      }

      const payload = {
        DishId: form.DishId,
        BarCode: form.BarCode,
        Description: form.dishName || ""
      };

      console.log(`📤 ${editId ? 'PUT' : 'POST'} request:`, payload);

      if (editId) {
        const res = await axios.put(
          `http://localhost:5000/api/barcode/${editId}`,
          payload
        );
        console.log("✅ Update response:", res.data);
        alert("✅ Barcode updated successfully!");
      } else {
        const res = await axios.post(
          "http://localhost:5000/api/barcode",
          payload
        );
        console.log("✅ Save response:", res.data);
        alert("✅ Barcode saved successfully!");
      }

      // ✅ Reset form and reload data
      fetchData();
      setMode("list");
      setForm({ BarCode: "", DishId: "", dishName: "" });
      setEditId(null);

    } catch (err) {
      console.error("❌ SAVE ERROR:", err);
      const errorMsg = err.response?.data?.message || err.message || "Unknown error";
      alert(`❌ Save failed: ${errorMsg}`);
    }
  };

  return (
    <div className={`Barcode-page ${sidebarOpen ? "sidebar-open" : ""}`}>

      {/* ================= LIST (Background) ================= */}
      <div className={`Barcode-list-container ${mode === "form" ? "dimmed" : ""}`}>
        <div className="Barcode-header">
          <h2>Barcode</h2>
          <button 
            className="Barcode-new-btn"
            onClick={() => {
            setEditId(null);
            setForm({
              DishId: "",
              dishCode: "",
              dishName: "",
              dishGroup: "",
              price: "",
              BarCode: ""
            });
            setMode("form");
          }}>New</button>
        </div>

        <table className="Barcode-table">
          <thead>
            <tr>
              <th>BarCode</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>
            {data.length > 0 ? (
              data.map((item, i) => (
                <tr
                  key={i}
                  onClick={() => {
                    setEditId(item.Id);

                    setForm({
                      DishId: item.DishId,
                      dishCode: item.DishCode || "",
                      dishName: item.Description,
                      dishGroup: item.DishGroupName || "",
                      price: item.Price || "",
                      BarCode: item.BarCode
                    });

                    setMode("form");
                  }}
                >
                  <td>{item.BarCode}</td>
                  <td>{item.Description}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No Data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= FORM (Modal Overlay) ================= */}
      {mode === "form" && (
        <div className={`Barcode-modal-overlay ${sidebarOpen ? "sidebar-open" : ""}`}>
          <div className="Barcode-card">

            <div className="Barcode-form-header">
              <h2>Barcode</h2>

              <div className="Barcode-actions">
                <button className="Barcode-save-btn" onClick={handleSave}>
                  Save
                </button>

                <button
                  className="Barcode-delete-btn"
                  onClick={handleDelete}
                  disabled={!editId}
                  style={{
                    opacity: editId ? 1 : 0.5,
                    cursor: editId ? "pointer" : "not-allowed"
                  }}
                >
                  Delete
                </button>

                <button
                  className="Barcode-cancel-btn"
                  onClick={() => setMode("list")}
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="Barcode-grid">

              {/* Dish Code + LOV */}
              <div className="Barcode-form-row">
                <label>Dish Code</label>

                <div className="Barcode-input-group">
                  <input value={form.dishCode} readOnly />

                  <button
                    className="Barcode-lov-btn"
                    onClick={() => {
                      setShowPopup(true);
                      fetchDishList();
                    }}
                  >
                    ...
                  </button>
                </div>
              </div>

              <div className="Barcode-form-row">
                <label>Dish Group</label>
                <input value={form.dishGroup} readOnly />
              </div>

              <div className="Barcode-form-row">
                <label>BarCode</label>
                <input
                  value={form.BarCode}
                  onChange={(e) =>
                    setForm({ ...form, BarCode: e.target.value })
                  }
                />
              </div>

              <div className="Barcode-form-row">
                <label>Dish Name</label>
                <input value={form.dishName} readOnly />
              </div>

              <div className="Barcode-form-row">
                <label>Price</label>
                <input value={form.price} readOnly />
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= POPUP ================= */}
      {showPopup && (
        <div className="Barcode-popup-overlay">
          <div className="Barcode-popup-box">

            <div className="Barcode-popup-header">
              <h3>Select Dish</h3>
              <button onClick={() => {
                setShowPopup(false);
                setSearchTerm("");
              }}>X</button>
            </div>

            <div className="Barcode-popup-search-container">
              <input
                type="text"
                placeholder="Search dish name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className="Barcode-popup-table-wrapper">
              <table className="Barcode-popup-table">
                <thead>
                  <tr>
                    <th>Dish Code</th>
                    <th>Dish Name</th>
                    <th>Price</th>
                  </tr>
                </thead>

                <tbody>
                  {dishList
                    .filter(item =>
                      item.DishName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.DishCode?.toString().includes(searchTerm)
                    )
                    .length > 0 ? (
                    dishList
                      .filter(item =>
                        item.DishName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.DishCode?.toString().includes(searchTerm)
                      )
                      .map((item, i) => (
                        <tr
                          key={i}
                          onClick={() => {
                            setForm({
                              DishId: item.DishId,
                              dishCode: item.DishCode,
                              dishName: item.DishName,
                              dishGroup: item.DishGroupName || "",
                              price: item.CurrentCost,
                              BarCode: ""
                            });

                            setShowPopup(false);
                          }}
                        >
                          <td>{item.DishCode}</td>
                          <td>{item.DishName}</td>
                          <td>{item.CurrentCost}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="3">No Data Found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Barcode;

