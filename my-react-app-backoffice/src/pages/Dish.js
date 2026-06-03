import React, { useState, useRef } from "react";
import "./Dish.css";

function Dish() {

  const emptyDish = {
    DishCode: "",
    Name: "",
    ShortName: "",
    Description: "",
    DishGroupId: "",
    CurrentCost: "",
    SordCode: "",
    UnitCost: "",
    QuantityOnHand: "",
    NameInOtherLanguage: "",
    BrandId: "",
    MobileTab: "",
    AvailableTimeFrom: "",
    AvailableTimeTo: "",
    isMultiPrice: false,
    isOpenitem: false,
    IsShowinKiosk: false,
    DishImage: null,
    IsActive: false,
    iskitchenPrint: false,
    isDiscountAllowed: false,
    IsTaxAllowed: false,
    IsStockDish: false,
    isFOC: false,
    isServiceCharge: false,
    isFavourite: false
  };

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("customize");
  const [dish, setDish] = useState(emptyDish);
  const [dishes, setDishes] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [categoryImage, setCategoryImage] = useState(null);
  const [buttonColor, setButtonColor] = useState("#2e7d32");
  const [textColor, setTextColor] = useState("#fff");
  const [displayName, setDisplayName] = useState(true);

  const colorPickerRef = useRef(null);
  const textColorPickerRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setDish({
      ...dish,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (file) {
      const url = URL.createObjectURL(file);
      setCategoryImage(url);
    }
  };

  const clearImage = () => {
    setCategoryImage(null);
  };

  /* ❌ Apply All disabled */
  const applyAll = () => {};

  const handleSave = () => {
    const dishCode = dish.DishCode?.toString().trim();
    const dishName = dish.Name?.toString().trim();

    if (!dishCode || !dishName) {
      alert("Please enter both Dish Code and Name before saving.");
      return;
    }

    if (editIndex !== null) {
      const updated = [...dishes];
      updated[editIndex] = dish;
      setDishes(updated);
      setEditIndex(null);
    } else {
      setDishes([...dishes, dish]);
    }

    setDish(emptyDish);
    alert("Dish saved successfully");
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditIndex(null);
  };

  const openNewDish = () => {
    setDish(emptyDish);
    setEditIndex(null);
    setShowModal(true);
  };

  const handleEdit = (index) => {
    setDish(dishes[index]);
    setEditIndex(index);
    setShowModal(true);
  };

  return (
    <div className="dish-page1">

      <h1>Dish Master</h1>

      <button className="btn-standard btn-new" onClick={openNewDish}>
        New Dish
      </button>

      <div className="report-section1">
        <table className="report-table1">

          <thead>
            <tr>
              <th>Dish Code</th>
              <th>Name</th>
              <th>Short Name</th>
              <th>Description</th>
              <th>Group</th>
              <th>Price</th>
              <th>Sort Code</th>
              <th>Unit Cost</th>
              <th>Qty</th>
              <th>Active</th>
              <th>Kitchen</th>
              <th>Discount</th>
              <th>Tax</th>
              <th>Stock</th>
              <th>FOC</th>
              <th>Service</th>
              <th>Favourite</th>
            </tr>
          </thead>

          <tbody>
            {dishes.length === 0 ? (
              <tr>
                <td colSpan="17">No Data</td>
              </tr>
            ) : (
              dishes.map((d, i) => (
                <tr
                  key={i}
                  onClick={() => handleEdit(i)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{d.DishCode}</td>
                  <td>{d.Name}</td>
                  <td>{d.ShortName}</td>
                  <td>{d.Description}</td>
                  <td>{d.DishGroupId}</td>
                  <td>{d.CurrentCost}</td>
                  <td>{d.SordCode}</td>
                  <td>{d.UnitCost}</td>
                  <td>{d.QuantityOnHand}</td>
                  <td>{d.IsActive ? "Yes" : "No"}</td>
                  <td>{d.iskitchenPrint ? "Yes" : "No"}</td>
                  <td>{d.isDiscountAllowed ? "Yes" : "No"}</td>
                  <td>{d.IsTaxAllowed ? "Yes" : "No"}</td>
                  <td>{d.IsStockDish ? "Yes" : "No"}</td>
                  <td>{d.isFOC ? "Yes" : "No"}</td>
                  <td>{d.isServiceCharge ? "Yes" : "No"}</td>
                  <td>{d.isFavourite ? "Yes" : "No"}</td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">

          <div className="modal-box1">

            <div className="dish-layout1">

              {/* LEFT SIDE */}
              <div className="dish-left1">

                <div className="form-row1">
                  <label>DishCode</label>
                  <input name="DishCode" value={dish.DishCode} onChange={handleChange} />
                </div>

                <div className="form-row">
                  <label>Name</label>
                  <input name="Name" value={dish.Name} onChange={handleChange} />
                </div>

                <div className="form-row1">
                  <label>ShortName</label>
                  <input name="ShortName" value={dish.ShortName} onChange={handleChange} />
                </div>

                <div className="form-row1">
                  <label>Description</label>
                  <textarea name="Description" value={dish.Description} onChange={handleChange} />
                </div>

                <div className="form-row1">
                  <label>Dish Group</label>
                  <input name="DishGroupId" value={dish.DishGroupId} onChange={handleChange} />
                </div>

                {/* PRICE ROW */}
                <div className="row-31">

                  <div>
                    <label>CurrentCost</label>
                    <input name="CurrentCost" value={dish.CurrentCost} onChange={handleChange} />
                  </div>

                  <div>
                    <label>SordCode</label>
                    <input name="SordCode" value={dish.SordCode} onChange={handleChange} />
                  </div>

                  <div>
                    <label>UnitCost</label>
                    <input name="UnitCost" value={dish.UnitCost} onChange={handleChange} />
                  </div>

                </div>

                {/* SECOND ROW */}
                <div className="row-31">

                  <div>
                    <label>QuantityOnHand</label>
                    <input name="QuantityOnHand" value={dish.QuantityOnHand} onChange={handleChange} />
                  </div>

                  <div>
                    <label>NameInOtherLanguage</label>
                    <input name="NameInOtherLanguage" value={dish.NameInOtherLanguage} onChange={handleChange} />
                  </div>

                  <div className="active-box1">
                    <label>
                      <input type="checkbox" name="IsActive" checked={dish.IsActive} onChange={handleChange} />
                      Active
                    </label>
                  </div>

                </div>

                {/* CHECKBOX GRID */}
                <div className="check-grid1">
                  <label><input type="checkbox" name="iskitchenPrint" checked={dish.iskitchenPrint} onChange={handleChange} /> iskitchenPrint</label>
                  <label><input type="checkbox" name="isDiscountAllowed" checked={dish.isDiscountAllowed} onChange={handleChange} /> isDiscountAllowed</label>
                  <label><input type="checkbox" name="IsTaxAllowed" checked={dish.IsTaxAllowed} onChange={handleChange} /> IsTaxAllowed</label>
                  <label><input type="checkbox" name="IsStockDish" checked={dish.IsStockDish} onChange={handleChange} /> IsStockDish</label>
                  <label><input type="checkbox" name="isFOC" checked={dish.isFOC} onChange={handleChange} /> isFOC</label>
                  <label><input type="checkbox" name="isServiceCharge" checked={dish.isServiceCharge} onChange={handleChange} /> isServiceCharge</label>
                  <label><input type="checkbox" name="isFavourite" checked={dish.isFavourite} onChange={handleChange} /> isFavourite</label>
                  <label><input type="checkbox" name="isMultiPrice" checked={dish.isMultiPrice} onChange={handleChange} /> isMultiPrice</label>
                  <label><input type="checkbox" name="isOpenitem" checked={dish.isOpenitem} onChange={handleChange} /> isOpenitem</label>
                </div>

              </div>

              {/* RIGHT SIDE */}
              <div className="dish-right1">

                <div className="tabs">
                  <button className={activeTab === "customize" ? "active-tab" : ""} onClick={() => setActiveTab("customize")}>Category</button>
                  <button className={activeTab === "modifier" ? "active-tab" : ""} onClick={() => setActiveTab("modifier")}>Modifier</button>
                  <button className={activeTab === "kitchen" ? "active-tab" : ""} onClick={() => setActiveTab("kitchen")}>Kitchen</button>
                </div>

                {activeTab === "customize" && (
                  <div className="customize-layout">

                    <div className="customize-col1">
                      <h4>Category Image</h4>

                      <div className="image-box1">
                        {categoryImage && (
                          <img src={categoryImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                      </div>

                      <div className="img-btns1">
                        <label className="blue-btn1">
                          Scan
                          <input type="file" hidden onChange={handleImageUpload} />
                        </label>

                        <button className="btn-standard btn-danger" onClick={clearImage}>Clear</button>
                      </div>
                    </div>

                    <div className="customize-col1">
                      <h4>Preview</h4>

                      <div
                        className="preview-box1"
                        style={{
                          backgroundColor: buttonColor,
                          color: textColor,
                          position: "relative",
                          overflow: "hidden"
                        }}
                      >
                        {categoryImage ? (
                          <>
                            <img src={categoryImage} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            {displayName && (
                              <div className="preview-text1">
                                {dish.Name || "DRINKS"}
                              </div>
                            )}
                          </>
                        ) : (
                          dish.Name || "DRINKS"
                        )}
                      </div>

                      <label className="display-check1">
                        <input type="checkbox" checked={displayName} onChange={(e) => setDisplayName(e.target.checked)} />
                        Display Name
                      </label>

                      <button className="btn-standard btn-primary" onClick={applyAll}>Apply All</button>
                    </div>

                    <div className="customize-col1">
                      <h4>Button Color</h4>

                      <div className="button-preview1">
                        {dish.Name || "DRINKS"}
                      </div>

                      <div className="color-btns1">
                        <button className="btn-standard btn-secondary" onClick={() => colorPickerRef.current.click()}>Color</button>

                        <input
                          type="color"
                          ref={colorPickerRef}
                          style={{ display: "none" }}
                          value={buttonColor}
                          onChange={(e) => setButtonColor(e.target.value)}
                        />

                        <button className="btn-standard btn-secondary" onClick={() => textColorPickerRef.current.click()}>Text Color</button>

                        <input
                          type="color"
                          ref={textColorPickerRef}
                          style={{ display: "none" }}
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                        />
                      </div>

                    </div>

                  </div>
                )}

              </div>

            </div>

            <div className="bottom-btns1">
              <button className="btn-standard btn-success" onClick={handleSave}>Save</button>
              <button className="btn-standard btn-danger" onClick={handleCancel}>Cancel</button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Dish;