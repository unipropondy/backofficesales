import React, { useState } from "react";
import "./Modifier.css";

function Modifier() {

  const [showModal, setShowModal] = useState(false);
  const [modifierList, setModifierList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  const [modifier, setModifier] = useState({
    ModifierCode: "",
    ModifierName: "",
    ConflictId: "",
    isActive: true,
    SortCode: "",
    isPriceAffect: false,
    isOpenModifier: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setModifier({
      ...modifier,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = () => {
    const code = modifier.ModifierCode?.toString().trim();
    const name = modifier.ModifierName?.toString().trim();

    if (!code || !name) {
      alert("Please enter both Modifier Code and Name before saving.");
      return;
    }

    if (editIndex !== null) {
      const updated = [...modifierList];
      updated[editIndex] = modifier;
      setModifierList(updated);
    } else {
      setModifierList([...modifierList, modifier]);
    }

    setShowModal(false);
    setEditIndex(null);

    setModifier({
      ModifierCode: "",
      ModifierName: "",
      ConflictId: "",
      isActive: true,
      SortCode: "",
      isPriceAffect: false,
      isOpenModifier: false,
    });
  };

  const handleEdit = (index) => {
    setModifier(modifierList[index]);
    setEditIndex(index);
    setShowModal(true);
  };

  return (
    <div className="modifier-container">

      <h1 className="title">Modifier</h1>

      <button className="btn-standard btn-new" onClick={() => setShowModal(true)}>
        New
      </button>

      <table className="modifier-table">

        <thead>
          <tr>
            <th>ModifierCode</th>
            <th>ModifierName</th>
            <th>ConflictId</th>
            <th>isActive</th>
            <th>SortCode</th>
            <th>isPriceAffect</th>
            <th>isOpenModifier</th>
          </tr>
        </thead>

        <tbody>

          {modifierList.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No entries yet
              </td>
            </tr>
          ) : (

            modifierList.map((item, index) => (

              <tr key={index} onClick={() => handleEdit(index)} style={{ cursor: "pointer" }}>

                <td>{item.ModifierCode}</td>
                <td>{item.ModifierName}</td>
                <td>{item.ConflictId}</td>
                <td>{item.isActive ? "Active" : "Inactive"}</td>
                <td>{item.SortCode}</td>
                <td>{item.isPriceAffect ? "Yes" : "No"}</td>
                <td>{item.isOpenModifier ? "Yes" : "No"}</td>

              </tr>

            ))

          )}

        </tbody>

      </table>


      {showModal && (

        <div className="modal-overlay-md">

          <div className="modal-box-md">

            <h2>{editIndex !== null ? "Edit Modifier" : "Add Modifier"}</h2>

            <div className="modifier-form">

              <div className="form-row">
                <label>Modifier Code</label>
                <input
                  name="ModifierCode"
                  value={modifier.ModifierCode}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label>Modifier Name</label>
                <input
                  name="ModifierName"
                  value={modifier.ModifierName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label>Conflict Id</label>
                <input
                  name="ConflictId"
                  value={modifier.ConflictId}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label>Active</label>
                <select
                  name="isActive"
                  value={modifier.isActive}
                  onChange={handleChange}
                >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>

              <div className="form-row">
                <label>Sort Code</label>
                <input
                  type="number"
                  name="SortCode"
                  value={modifier.SortCode}
                  onChange={handleChange}
                />
              </div>


{/* Price Affect */}

<div className="checkbox-row">

<span className="label">Price Affect</span>

<input
  type="checkbox"
  name="isPriceAffect"
  checked={modifier.isPriceAffect}
  onChange={handleChange}
/>

</div>


{/* Open Modifier */}

<div className="checkbox-row">

<span className="label">Open Modifier</span>

<input
type="checkbox"
name="isOpenModifier"
checked={modifier.isOpenModifier}
onChange={handleChange}
/>

</div>


              <div className="modal-buttons-md">
                <button className="btn-standard btn-success" onClick={handleSave}>
                  {editIndex !== null ? "Update" : "Save"}
                </button>

                <button
                  className="btn-standard btn-danger"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Modifier;