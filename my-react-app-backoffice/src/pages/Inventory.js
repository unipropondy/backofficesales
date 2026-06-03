import React, { useState } from "react";
import "./Inventory.css";

function Inventory() {
  const [showModal, setShowModal] = useState(false);
  const [inventoryList, setInventoryList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  const [item, setItem] = useState({
    itemCode: "",
    description: "",
    inventoryGroup: "",
    brand: "",
    uom: "",
    grossCost: "",
    sortCode: "",
    discountAllowed: false,
    active: true,
    vendor: "",
    price: "",
    avgCost: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setItem({
      ...item,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = () => {
    // Check if at least one field is entered
    if (!item.itemCode.trim() && !item.description.trim()) {
      alert("Please enter an Item Code or Description before saving.");
      return;
    }

    if (editIndex !== null) {
      const updated = [...inventoryList];
      updated[editIndex] = item;
      setInventoryList(updated);
    } else {
      setInventoryList([...inventoryList, item]);
    }

    setShowModal(false);
    setEditIndex(null);
    resetForm();
  };

  const resetForm = () => {
    setItem({
      itemCode: "",
      description: "",
      inventoryGroup: "",
      brand: "",
      uom: "",
      grossCost: "",
      sortCode: "",
      discountAllowed: false,
      active: true,
      vendor: "",
      price: "",
      avgCost: "",
    });
  };

  const handleEdit = (index) => {
    setItem(inventoryList[index]);
    setEditIndex(index);
    setShowModal(true);
  };

  return (
    <div className="inventory-container">
      <h1 className="title">Inventory</h1>

      <button className="btn-standard btn-new" onClick={() => setShowModal(true)}>
        New
      </button>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Description</th>
            <th>Group</th>
            <th>Brand</th>
            <th>UOM</th>
            <th>Gross Cost</th>
            <th>Price</th>
            <th>Avg Cost</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {inventoryList.length === 0 ? (
            <tr>
              <td colSpan="9" style={{ textAlign: "center" }}>
                No entries yet
              </td>
            </tr>
          ) : (
            inventoryList.map((item, index) => (
              <tr key={index} onClick={() => handleEdit(index)} style={{ cursor: "pointer" }}>
                <td>{item.itemCode}</td>
                <td>{item.description}</td>
                <td>{item.inventoryGroup}</td>
                <td>{item.brand}</td>
                <td>{item.uom}</td>
                <td>{item.grossCost}</td>
                <td>{item.price}</td>
                <td>{item.avgCost}</td>
                <td>{item.active ? "Yes" : "No"}</td>
                
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay-in">
          <div className="modal-box-in">
            <h2>{editIndex !== null ? "Edit Item" : "Add Item"}</h2>

            <div className="form-grid">
              <input placeholder="Item Code" name="itemCode" value={item.itemCode} onChange={handleChange} />
              <input placeholder="Description" name="description" value={item.description} onChange={handleChange} />
              <input placeholder="Inventory Group" name="inventoryGroup" value={item.inventoryGroup} onChange={handleChange} />
              <input placeholder="Brand" name="brand" value={item.brand} onChange={handleChange} />
              <input placeholder="UOM" name="uom" value={item.uom} onChange={handleChange} />
              <input type="number" placeholder="Gross Cost" name="grossCost" value={item.grossCost} onChange={handleChange} />
              <input type="number" placeholder="Sort Code" name="sortCode" value={item.sortCode} onChange={handleChange} />
              <input placeholder="Vendor" name="vendor" value={item.vendor} onChange={handleChange} />
              <input type="number" placeholder="Price" name="price" value={item.price} onChange={handleChange} />
              <input type="number" placeholder="Avg Cost" name="avgCost" value={item.avgCost} onChange={handleChange} />
            </div>

            <div className="checkbox-group">
              <label>
                <input type="checkbox" name="discountAllowed" checked={item.discountAllowed} onChange={handleChange} />
                Discount Allowed
              </label>

              <label>
                <input type="checkbox" name="active" checked={item.active} onChange={handleChange} />
                Active
              </label>
            </div>

            <div className="modal-buttons-in">
              <button className="btn-standard btn-success" onClick={handleSave}>
                {editIndex !== null ? "Update" : "Save"}
              </button>
              <button className="btn-standard btn-danger" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;