import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HappyHours.css";

const HappyHours = ({ sidebarOpen }) => {
  const [showForm, setShowForm] = useState(false);
  const [promoCode, setPromoCode] = useState("PR0001");
  const [description, setDescription] = useState("");
  const [promoBegin, setPromoBegin] = useState("");
  const [promoEnd, setPromoEnd] = useState("");
  const [promoStartTime, setPromoStartTime] = useState("00:00");
  const [promoEndTime, setPromoEndTime] = useState("23:59");
  const [tableData, setTableData] = useState([]);
  const [promotionType, setPromotionType] = useState("");
  const [promotionValue, setPromotionValue] = useState("");
  const [reportData, setReportData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [promotionsData, setPromotionsData] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [dishGroup, setDishGroup] = useState("");
  const [dishGroups, setDishGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showDishPopup, setShowDishPopup] = useState(false);
  const [fetchedDishes, setFetchedDishes] = useState([]);
  const [selectedPopupDishes, setSelectedPopupDishes] = useState([]);
  const [dishSearchText, setDishSearchText] = useState("");
  const [lookupType, setLookupType] = useState(""); // "group" or "promo"

  const daysList = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [selectedDays, setSelectedDays] = useState(
    daysList.reduce((acc, day) => ({ ...acc, [day]: true }), {})
  );

  useEffect(() => {
    fetchDishGroups();
    fetchReport();
  }, []);

  useEffect(() => {
    setSelectedRows([]);
    setSelectAll(false);
  }, [showForm]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowPopup(false);
      setShowDishPopup(false);
    };
    if (showPopup || showDishPopup) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [showPopup, showDishPopup]);

  const fetchDishGroups = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/happyhours/dishgroups");
      const rawData = res.data.data || res.data || [];
      const groups = rawData.map(g => {
        if (typeof g === "string") return { id: g, name: g };
        return {
          id: g.id || g.DishGroupId || g.GroupId || g.name || g.DishGroupName || "",
          code: g.code || g.DishGroupCode || g.GroupCode || "",
          name: g.name || g.DishGroupName || g.GroupName || g || "Unknown Group"
        };
      });
      setDishGroups(groups);
    } catch (err) { console.error("Dish group load failed", err); }
  };

  const fetchReport = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/happyhours/report");
      const trimmedData = (res.data.data || []).map(item => ({
        ...item,
        InventoryID: item.InventoryID?.toString().trim()
      }));
      setReportData(trimmedData);
    } catch (err) { console.log("Report load failed"); }
  };

  const fetchPromotions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/happyhours/promotions");
      setPromotionsData(res.data.data || []);
    } catch (err) { console.log("Promotions load failed"); }
  };

  const handleSave = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user")) || {};

      // Helper to ensure we send a valid GUID string
      const toGuid = (id) => {
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (guidRegex.test(id)) return id;
        return "00000000-0000-0000-0000-000000000000";
      };

      const userId = toGuid(userData.UserId);
      const businessUnitId = toGuid(userData.BusinessUnitId);
      const groupId = toGuid(selectedGroupId);

      const selectedDaysArr = Object.keys(selectedDays).filter(day => selectedDays[day]).join(",");
      let itemsToSave = selectedRows.length > 0 ? selectedRows.map(idx => tableData[idx]) : tableData;
      if (itemsToSave.length === 0) { alert("No dishes to save ❌"); return; }

      let savedCount = 0;
      let errorMsgs = [];

      for (const dish of itemsToSave) {
        // Generate a new GUID for new promotions, otherwise keep existing
        const pId = dish.PromotionId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dish.PromotionId)
          ? dish.PromotionId
          : crypto.randomUUID ? crypto.randomUUID() : "00000000-0000-0000-0000-000000000000";

        const payload = {
          PromotionId: pId,
          PromotionCode: promoCode,
          Description: description,
          DishGroupId: groupId,
          DishId: toGuid(dish.dishId || dish.id),
          FromDate: promoBegin ? new Date(promoBegin).toISOString() : null,
          ToDate: promoEnd ? new Date(promoEnd).toISOString() : null,
          FromTime: promoStartTime,
          ToTime: promoEndTime,
          PromotionDay: selectedDaysArr,
          PromotionPerc: promotionType === "%" ? Number(promotionValue) || 0 : 0,
          PromotionPrice: Number(dish.promoPrice) || 0,
          PromoType: promotionType || "$",
          CreatedBy: userId,
          CreatedOn: new Date().toISOString(),
          BusinessUnitId: businessUnitId,
          IsActive: 1
        };

        try {
          const res = await axios.post("http://localhost:5000/api/happyhours", payload);
          if (res.data.success || res.status === 200) {
            savedCount++;
          }
        } catch (err) {
          console.error(`❌ Error saving ${dish.dishName}:`, err.response?.data || err.message);
          errorMsgs.push(dish.dishName);
        }
      }

      if (savedCount > 0) {
        alert(`Saved ${savedCount} records Successfully! ✅`);
        await fetchReport();
        setShowForm(false);
      }

      if (errorMsgs.length > 0) {
        alert(`Failed to save ${errorMsgs.length} items. Check console. ❌`);
      }
    } catch (err) {
      console.error("❌ Save Error:", err);
      alert("Save Failed! ❌");
    }
  };

  const handleFetch = async () => {
    try {
      if (!promoBegin || !promoEnd) { alert("Enter Promo Begin and End dates ❌"); return; }
      if (!dishGroup || !selectedGroupId) { alert("Select Dish Group ❌"); return; }
      console.log("Fetching dishes for group:", dishGroup, selectedGroupId);

      const res = await axios.get(`http://localhost:5000/api/happyhours?dishGroup=${selectedGroupId}`);
      const filtered = res.data.data || res.data || [];

      if (filtered.length === 0) {
        alert("No dishes found for this group ❌");
        setTableData([]);
        return;
      }

      const mapped = filtered.map(dish => ({
        dishCode: dish.dishCode || dish.DishCode || dish.Code || "",
        dishName: dish.dishName || dish.DishName || dish.Name || "",
        price: dish.price || dish.CurrentCost || dish.Price || 0,
        promoPrice: "",
        isSelected: false,
        dishId: dish.dishId || dish.DishId || dish.id
      }));

      setTableData(mapped);
      console.log("Mapped Dishes:", mapped);
    } catch (err) {
      console.error("Fetch Error:", err);
      alert("Failed to fetch dishes ❌");
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedRows.length === 0) { alert("Select records to delete ❌"); return; }

      if (!window.confirm("Are you sure you want to delete selected records?")) return;

      const itemsToDelete = selectedRows.map(idx => {
        // If it's a saved record (reportData), it will have PromotionId
        // If it's a new row in tableData, we just remove it locally
        return tableData[idx] || reportData[idx];
      });

      const promotionIds = itemsToDelete.map(d => d.PromotionId).filter(Boolean);

      if (promotionIds.length > 0) {
        // Delete from backend if they are saved records
        await axios.post("http://localhost:5000/api/happyhours/delete", { promotionIds });
        await fetchReport();
        alert("Deleted saved records ✅");
      }

      // Also remove from local tableData if they were just fetched but not saved yet
      setTableData(tableData.filter((_, idx) => !selectedRows.includes(idx)));
      setSelectedRows([]);
      setSelectAll(false);
    } catch (err) { alert("Delete Failed ❌"); }
  };

  const handleEditReport = (item) => {
    setShowForm(true);
    setPromoCode(item.PromotionCode || "");
    setDescription(item.Description || "");
    setPromoBegin(item.FromDate ? new Date(item.FromDate).toISOString().split('T')[0] : "");
    setPromoEnd(item.ToDate ? new Date(item.ToDate).toISOString().split('T')[0] : "");
    setPromoStartTime(item.FromTime || "00:00");
    setPromoEndTime(item.ToTime || "23:59");
    setPromotionType(item.PromoType || "%");
    setPromotionValue(item.PromoType === "%" ? item.PromotionPerc : item.PromotionPrice);

    // Find dish group if possible
    const group = dishGroups.find(g => g.id === item.DishGroupId);
    setDishGroup(item.DishGroupName || (group ? group.name : ""));
    setSelectedGroupId(item.DishGroupId);

    // Filter report data for all items in this promotion
    const promoItems = reportData.filter(p => p.PromotionCode === item.PromotionCode);
    const mappedTableData = promoItems.map(p => ({
      PromotionId: p.PromotionId,
      dishCode: p.DishCode || p.InventoryID,
      dishName: p.DishName || p.dishName,
      price: p.Price || p.price || "0.00",
      promoPrice: p.PromotionPrice || p.promoPrice,
      dishId: p.DishId || p.dishId || p.id
    }));
    setTableData(mappedTableData);
  };

  const handleApply = () => {
    if (selectedRows.length === 0) { alert("Select dishes to apply promo ❌"); return; }
    if (!promotionValue) { alert("Enter promotion value ❌"); return; }

    const updatedData = [...tableData];
    selectedRows.forEach(idx => {
      if (promotionType === "%") {
        const originalPrice = Number(updatedData[idx].price) || 0;
        const discount = (originalPrice * Number(promotionValue)) / 100;
        updatedData[idx].promoPrice = (originalPrice - discount).toFixed(2);
      } else {
        updatedData[idx].promoPrice = Number(promotionValue).toFixed(2);
      }
    });
    setTableData(updatedData);
  };

  const handleNew = () => {
    setShowForm(true);
    setPromoCode("PR0001"); // Reset to default or next available
    setDescription(""); setPromoBegin(""); setPromoEnd(""); setPromotionValue("");
    setTableData([]); setSelectedRows([]); setSelectAll(false);
  };

  const filteredDishGroups = dishGroups.filter(g => g.name.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <div className={`happyhours-main-full ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="happyhours-container">

        {/* HEADER */}
        <header className="hh-premium-header">
          <h1>Happy Hours</h1>
          <div className="hh-btn-group">
            {!showForm ? (
              <button className="hh-btn hh-btn-primary" onClick={() => setShowForm(true)}>New</button>
            ) : (
              <>
                <button className="hh-btn hh-btn-outline" onClick={handleNew}>New</button>
                <button className="hh-btn hh-btn-primary" onClick={handleSave}>Save</button>
                <button className="hh-btn hh-btn-danger" onClick={handleDelete}>Delete</button>
                <button className="hh-btn hh-btn-outline" onClick={() => setShowForm(false)}>Exit</button>
              </>
            )}
          </div>
        </header>

        {!showForm ? (
          <div className="hh-table-card animate-slide-up">
            <table className="hh-table">
              <thead>
                <tr>
                  <th>PromotionCode</th>
                  <th>Description</th>
                  <th>FromTime</th>
                  <th>ToTime</th>
                  <th>FromDate</th>
                  <th>ToDate</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr><td colSpan="6" align="center" style={{ padding: '40px', color: '#666' }}>No Data</td></tr>
                ) : (
                  reportData.map((item, i) => (
                    <tr key={i} onClick={() => handleEditReport(item)} style={{ cursor: 'pointer' }}>
                      <td>{item.PromotionCode}</td>
                      <td>{item.Description}</td>
                      <td>{item.FromTime}</td>
                      <td>{item.ToTime}</td>
                      <td>{item.FromDate ? new Date(item.FromDate).toLocaleDateString('en-GB') : ''}</td>
                      <td>{item.ToDate ? new Date(item.ToDate).toLocaleDateString('en-GB') : ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="animate-slide-up">
            <div className="hh-form-card" style={{ padding: "15px", borderRadius: "12px", background: "#fff", border: "1px solid #dcd1c5" }}>
              <div className="hh-grid-layout" style={{ gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr', gap: '15px', alignItems: 'start' }}>

                {/* Column 1 */}
                <div className="hh-field-group">
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <label style={{ width: "100px", fontSize: "12px", fontWeight: "bold", color: "#6d645e" }}>Promotion Code</label>
                    <div style={{ display: "flex", flex: 1 }}>
                      <input className="hh-input" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} style={{ flex: 1, height: "26px", borderRadius: "6px", border: "1px solid #dcd1c5", fontSize: "12px", padding: "0 5px" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "8px" }}>
                    <label style={{ width: "100px", fontSize: "12px", fontWeight: "bold", color: "#6d645e" }}>Description</label>
                    <input className="hh-input" value={description} onChange={(e) => setDescription(e.target.value)} style={{ height: "26px", borderRadius: "0", border: "1px solid #dcd1c5", fontSize: "12px", padding: "0 5px" }} />
                  </div>
                </div>

                {/* Column 2 */}
                <div className="hh-field-group">
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <label style={{ width: "90px", fontSize: "12px", fontWeight: "bold", color: "#6d645e" }}>Promo Begin</label>
                    <input type="date" className="hh-input" value={promoBegin} onChange={(e) => setPromoBegin(e.target.value)} style={{ height: "26px", borderRadius: "0", border: "1px solid #dcd1c5", fontSize: "12px", padding: "0 5px" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "8px" }}>
                    <label style={{ width: "90px", fontSize: "12px", fontWeight: "bold", color: "#6d645e" }}>Promo End</label>
                    <input type="date" className="hh-input" value={promoEnd} onChange={(e) => setPromoEnd(e.target.value)} style={{ height: "26px", borderRadius: "0", border: "1px solid #dcd1c5", fontSize: "12px", padding: "0 5px" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "8px" }}>
                    <label style={{ width: "90px", fontSize: "12px", fontWeight: "bold", color: "#6d645e" }}>Dish Group</label>
                    <div style={{ display: "flex", flex: 1 }}>
                      <input className="hh-input" value={dishGroup} readOnly style={{ height: "26px", borderRadius: "0", border: "1px solid #dcd1c5", background: "#fdfaf7", fontSize: "12px", padding: "0 5px" }} />
                      <button style={{ width: "30px", height: "26px", border: "1px solid #dcd1c5", borderLeft: "none", background: "#f2ece4", cursor: "pointer", color: "#6d645e" }} onClick={(e) => { e.stopPropagation(); setLookupType("group"); setSearchText(""); fetchDishGroups(); setShowPopup(true); }}>...</button>
                    </div>
                  </div>
                </div>

                {/* Column 3: Days Vertical */}
                <div className="hh-field-group">
                  <div style={{ border: "1px solid #dcd1c5", padding: "0", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{ background: "#f2ece4", padding: "2px 8px", fontSize: "11px", fontWeight: "bold", borderBottom: "1px solid #dcd1c5", textAlign: "center", color: "#6d645e" }}>Promotion Days</div>
                    <div style={{ background: "#fdfaf7", padding: "5px" }}>
                      {daysList.map(day => (
                        <label key={day} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#333", fontWeight: "600", marginBottom: "2px", cursor: "pointer" }}>
                          <input type="checkbox" checked={selectedDays[day]} onChange={() => setSelectedDays(p => ({ ...p, [day]: !p[day] }))} style={{ margin: 0, accentColor: "#ff7f27" }} />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 4: Times */}
                <div className="hh-field-group" style={{ textAlign: "center" }}>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "3px", color: "#6d645e" }}>Promo Start</label>
                    <input type="time" className="hh-input" value={promoStartTime} onChange={(e) => setPromoStartTime(e.target.value)} style={{ height: "26px", borderRadius: "0", border: "1px solid #dcd1c5", width: "100%", fontSize: "12px", fontWeight: "bold", color: "#333" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "3px", color: "#6d645e" }}>Promo End</label>
                    <input type="time" className="hh-input" value={promoEndTime} onChange={(e) => setPromoEndTime(e.target.value)} style={{ height: "26px", borderRadius: "0", border: "1px solid #dcd1c5", width: "100%", fontSize: "12px", fontWeight: "bold", color: "#333" }} />
                  </div>
                  <button
                    className="hh-btn"
                    style={{ marginTop: "15px", width: "100%", height: "28px", borderRadius: "6px", background: "#ff7f27", color: "white", fontWeight: "bold", border: "none", cursor: "pointer", boxShadow: "0 4px 10px rgba(255, 127, 39, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}
                    onClick={handleFetch}
                  >
                    Fetch
                  </button>
                </div>

              </div>
            </div>

            {/* Table Area */}
            <div className="hh-table-card" style={{ marginTop: "15px", border: "1px solid #dcd1c5", borderRadius: "12px", background: "#fff", overflow: "hidden" }}>
              <div className="hh-table-meta" style={{ background: "#f2ece4", borderBottom: "1px solid #dcd1c5", padding: "8px 15px" }}>
                <label className="hh-day-item" style={{ fontWeight: '600', color: '#6d645e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={selectAll} onChange={() => {
                    if (selectAll) setSelectedRows([]);
                    else setSelectedRows(tableData.map((_, i) => i));
                    setSelectAll(!selectAll);
                  }} style={{ accentColor: "#ff7f27" }} /> Select All
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <span style={{ fontWeight: "bold", color: "#6d645e", fontSize: "12px" }}>Total Records:</span>
                  <span style={{ fontWeight: "bold", color: "#ff7f27", fontSize: "13px" }}>{tableData.length}</span>
                </div>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="hh-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>SELECT</th>
                      <th>DISH CODE</th>
                      <th>DISH NAME</th>
                      <th>PRICE</th>
                      <th>PROMO PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr><td colSpan="5" align="center" style={{ padding: '40px', color: '#666' }}>No Data</td></tr>
                    ) : (
                      tableData.map((item, i) => (
                        <tr key={i}>
                          <td><input type="checkbox" checked={selectedRows.includes(i)} onChange={() => {
                            if (selectedRows.includes(i)) setSelectedRows(selectedRows.filter(x => x !== i));
                            else setSelectedRows([...selectedRows, i]);
                          }} /></td>
                          <td>{item.dishCode}</td>
                          <td>{item.dishName || item.DishName || item.Description}</td>
                          <td>{item.price || item.Price}</td>
                          <td>{item.promoPrice}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="hh-promo-footer">
                <div className="hh-promo-type">
                  <label><input type="radio" name="pt" value="%" onChange={(e) => setPromotionType(e.target.value)} /> Promotion %</label>
                  <label><input type="radio" name="pt" value="$" onChange={(e) => setPromotionType(e.target.value)} /> Promotion $</label>
                </div>
                <div className="hh-field-group" style={{ width: '120px' }}>
                  <label style={{ fontSize: "11px", fontWeight: "bold" }}>Promotion %</label>
                  <input type="number" className="hh-input" value={promotionValue} onChange={(e) => setPromotionValue(e.target.value)} placeholder="0.00" />
                </div>
                <button className="hh-btn hh-btn-primary" onClick={handleApply}>Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* Dish Popup Modal */}
        {showDishPopup && (
          <div className="hh-modal-overlay">
            <div className="hh-modal-content animate-slide-up">
              <div className="hh-modal-header">
                <h3 style={{ margin: 0, fontSize: "16px" }}>Select Dishes from {dishGroup}</h3>
                <button onClick={() => setShowDishPopup(false)} style={{ background: 'none', border: 'none', color: '#6d645e', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div className="hh-modal-body">
                <input className="hh-input" style={{ marginBottom: '15px' }} placeholder="Search dishes..." value={dishSearchText} onChange={(e) => setDishSearchText(e.target.value)} />
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <table className="hh-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>Select</th>
                        <th>Code</th>
                        <th>Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fetchedDishes.filter(d => d.dishName.toLowerCase().includes(dishSearchText.toLowerCase())).map((d, i) => {
                        const originalIdx = fetchedDishes.findIndex(fd => fd.dishCode === d.dishCode);
                        return (
                          <tr key={originalIdx} onClick={() => {
                            if (selectedPopupDishes.includes(originalIdx)) setSelectedPopupDishes(selectedPopupDishes.filter(x => x !== originalIdx));
                            else setSelectedPopupDishes([...selectedPopupDishes, originalIdx]);
                          }}>
                            <td><input type="checkbox" checked={selectedPopupDishes.includes(originalIdx)} readOnly /></td>
                            <td>{d.dishCode}</td>
                            <td>{d.dishName}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button className="hh-btn hh-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }} onClick={() => {
                  const selected = selectedPopupDishes.map(idx => fetchedDishes[idx]);
                  setTableData([...tableData, ...selected.filter(s => !tableData.some(t => t.dishCode === s.dishCode))]);
                  setShowDishPopup(false);
                }}>Add to Order View</button>
              </div>
            </div>
          </div>
        )}

        {/* Lookup Selection Modal (Unified) */}
        {showPopup && lookupType === "group" && (
          <div className="hh-modal-overlay">
            <div className="hh-modal-content animate-slide-up" style={{ width: "450px", padding: "0", borderRadius: "15px", overflow: "hidden" }}>
              <div className="hh-modal-header" style={{ background: "#f2ece4", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, color: "#6d645e", fontSize: "16px" }}>Select Dish Group</h3>
                <button onClick={() => setShowPopup(false)} style={{ background: 'none', border: 'none', color: '#6d645e', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div className="hh-modal-body" style={{ padding: "20px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <input
                    className="hh-input"
                    style={{ height: "30px", borderRadius: "6px", border: "1px solid #d1d5db", padding: "0 10px", width: "100%", fontSize: "12px" }}
                    placeholder="Search group..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                <div style={{ maxHeight: '350px', overflowY: 'auto', border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                  <table className="hh-table" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f2ece4" }}>
                        <th style={{ padding: "10px 15px", textAlign: "left", color: "#6d645e", fontSize: "12px", borderBottom: "1px solid #e5e7eb" }}>GROUP CODE</th>
                        <th style={{ padding: "10px 15px", textAlign: "left", color: "#6d645e", fontSize: "12px", borderBottom: "1px solid #e5e7eb" }}>GROUP NAME</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dishGroups.filter(g => (g.name || "").toLowerCase().includes(searchText.toLowerCase()) || (g.code || "").toLowerCase().includes(searchText.toLowerCase())).map((g, i) => (
                        <tr key={i} onClick={() => {
                          setDishGroup(g.name);
                          setSelectedGroupId(g.id);
                          setShowPopup(false);
                          setSearchText("");
                        }} style={{ cursor: 'pointer', borderBottom: "1px solid #f3f4f6" }} className="hh-row-hover">
                          <td style={{ padding: "10px 15px", color: "#374151", fontSize: "12px", fontWeight: "600" }}>{g.code}</td>
                          <td style={{ padding: "10px 15px", color: "#374151", fontSize: "12px" }}>{g.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HappyHours;