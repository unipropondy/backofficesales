import { API_BASE_URL } from "../config/config";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./Organization.css";

const Organization = ({ sidebarOpen }) => {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.UserId || null;
  
  const [activeTab, setActiveTab] = useState("Master");
  const [searchTermCode, setSearchTermCode] = useState("");
  const [searchTermType, setSearchTermType] = useState("");
  const [tempValueType, setTempValueType] = useState("");
  const [formData, setFormData] = useState({});
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State for Additional Settings
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  
  // Modern edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSetting, setEditSetting] = useState(null);

  // Header popup state
  const [isHeaderPopupOpen, setIsHeaderPopupOpen] = useState(false);

const fetchData = useCallback(async () => {
  try {
    console.log("📥 Loading Organization data...");
    const orgRes = await axios.get(API_BASE_URL + "/api/organization");
    
      // DEBUG: Check DisplayMessage
    console.log("🔍 DisplayMessage from backend:", orgRes.data.DisplayMessage);
    
    console.log("📥 Loading Settings from MasterSettings...");
    const settingsRes = await axios.get(API_BASE_URL + "/api/organization/settings");
    
    // Start with organization data
    const finalData = { ...orgRes.data };
    
    // ========== LOAD MASTER TAB VALUES ==========
    finalData.BusinessUnitCode = finalData.BusinessUnitCode || "";
    finalData.Name = finalData.Name || "";
    finalData.CompanyNameInRcptLine1 = finalData.CompanyNameInRcptLine1 || "";
    finalData.CompanyNameInRcptLine2 = finalData.CompanyNameInRcptLine2 || "";
    finalData.Address1_Line1 = finalData.Address1_Line1 || "";
    finalData.Address1_Line2 = finalData.Address1_Line2 || "";
    finalData.Address1_City = finalData.Address1_City || "";
    finalData.Address1_State = finalData.Address1_State || "";
    finalData.Address1_Country = finalData.Address1_Country || "";
    finalData.Address1_PostalCode = finalData.Address1_PostalCode || "";
    finalData.Address1_Telephone1 = finalData.Address1_Telephone1 || "";
    finalData.Address1_Fax1 = finalData.Address1_Fax1 || "";
    finalData.Address1_EmailId1 = finalData.Address1_EmailId1 || "";
    finalData.WebSite = finalData.WebSite || "";
    finalData.LocationName = finalData.LocationName || "";
    finalData.DisplayMessage = finalData.DisplayMessage || "";
    
    // ========== LOAD SERVICE TAB VALUES ==========
    finalData.GstRegno = finalData.GstRegno || "";
    finalData.GstPercentage = finalData.GstPercentage || 0;
    finalData.GstType = finalData.GstType || "E";
    finalData.BillCopy = finalData.BillCopy || 1;
    finalData.MAX_INV_SPLIT = finalData.MAX_INV_SPLIT || 0;
    finalData.ServiceChargePerc = finalData.ServiceChargePerc || 0;
    
    finalData.TableValidation = finalData.TableValidation == 1;
    finalData.ForceModifier = finalData.ForceModifier == 1;
    finalData.DisplayCode = finalData.DisplayCode == 1;
    finalData.isActive = finalData.IsActive == 1;
    finalData.isServiceChargeAllowed = finalData.IsServiceChargeAllowed == 1;
    finalData.isOrderPrint = finalData.IsOrderPrint == 1;
    finalData.CheckoutPrint = finalData.CheckoutPrint == 1;
    finalData.ReceiptPrint = finalData.ReceiptPrint == 1;
    finalData.iskitchenPrint = finalData.IsKitchenPrint == 1;
    finalData.isCallerPrinter = finalData.IsCallerPrinter == 1;
    finalData.MessageOption = (finalData.MessageOption === 'Y' || finalData.MessageOption == 1);
    
    // ========== LOAD TRANSACTION TAB VALUES ==========
    finalData.InvoicePrefix = finalData.InvoicePrefix || "";
    finalData.QuotePrefix = finalData.QuotePrefix || "";
    finalData.CustomerPreFix = finalData.CustomerPreFix || "";
    finalData.BookingPrefix = finalData.BookingPrefix || "";
    finalData.OrderPrefix = finalData.OrderPrefix || "";
    finalData.UserPrefix = finalData.UserPrefix || "";
    finalData.DoorDeliveryOrderPrefix = finalData.DoorDeliveryOrderPrefix || "";
    finalData.WriteInDishPrefix = finalData.WriteInDishPrefix || "";
    finalData.TranPrefix = finalData.TranPrefix || "";
    finalData.DishPrefix = finalData.DishPrefix || "";
    finalData.DishGroupPrefix = finalData.DishGroupPrefix || "";
    finalData.BillPrefix = finalData.BillPrefix || "";
    
    finalData.NextInvoiceNumber = finalData.NextInvoiceNumber || 0;
    finalData.NextQuoteNumber = finalData.NextQuoteNumber || 0;
    finalData.NextCustomerNumber = finalData.NextCustomerNumber || 0;
    finalData.NextBookingNumber = finalData.NextBookingNumber || 0;
    finalData.NextOrderNumber = finalData.NextOrderNumber || 0;
    finalData.NextUserNumber = finalData.NextUserNumber || 0;
    finalData.NextDoorDeliveryOrderNumber = finalData.NextDoorDeliveryOrderNumber || 0;
    finalData.NextWriteInDishNumber = finalData.NextWriteInDishNumber || 0;
    finalData.NextTranNumber = finalData.NextTranNumber || 0;
    finalData.NextDishNumber = finalData.NextDishNumber || 0;
    finalData.NextDishGroupNumber = finalData.NextDishGroupNumber || 0;
    finalData.NextBillNumber = finalData.NextBillNumber || 0;
    
    // ========== LOAD SETTINGS TAB VALUES FROM MASTERSETTINGS ==========
    const settingsData = {};
    
    settingsRes.data.forEach(setting => {
      const paramCode = setting.ParamCode;
      if (setting.ParamValueType === 'B') {
       settingsData[paramCode] = setting.ParamBitValue == 1;
      } else if (setting.ParamValueType === 'N') {
        settingsData[paramCode] = setting.ParamNumericValue || 0;
      } else if (setting.ParamValueType === 'S') {
        settingsData[paramCode] = setting.ParamStringValue || "";
      }
    });
    
    finalData.MaxDiscount = settingsData.MaxDiscount !== undefined ? settingsData.MaxDiscount : 0;
    finalData.DefaultDiscount = settingsData.DefaultDiscount !== undefined ? settingsData.DefaultDiscount : 0;
    finalData.CustDispMsg1 = settingsData.CustDispMsg1 || "";
    finalData.CustDispMsg2 = settingsData.CustDispMsg2 || "";
    finalData.isPDAAttached = settingsData.isPDAAttached === true || settingsData.isPDAAttached === 1 || settingsData.isPDAAttached === true;
    finalData.isTerminalTableValidation = settingsData.isTerminalTableValidation === true;
    finalData.isPaymentFromtable = settingsData.isPaymentFromtable === true;
    finalData.AdditionOrderSymbol = settingsData.AdditionOrderSymbol || "";
    finalData.NameMaxlength = settingsData.NameMaxlength || 40;
    finalData.OtherLanguageMaxlength = settingsData.OtherLanguageMaxlength || 60;
    
    console.log("✅ SETTINGS TAB VALUES:");
    console.log("   MaxDiscount:", finalData.MaxDiscount);
    console.log("   isPDAAttached:", finalData.isPDAAttached);
    console.log("   isTerminalTableValidation:", finalData.isTerminalTableValidation);
    console.log("   isPaymentFromtable:", finalData.isPaymentFromtable);
    
    
    setFormData(finalData);
    setSettings(settingsRes.data);
    setLoading(false);
  } catch (error) {
    console.error("❌ Fetch error:", error);
    alert(`Error loading data: ${error.message}`);
    setLoading(false);
  }
}, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshSettings = async () => {
    try {
      console.log("🔄 Refreshing settings data...");
      const settingsRes = await axios.get(API_BASE_URL + "/api/organization/settings");
      console.log("✅ Settings refreshed:", settingsRes.data);
      setSettings(settingsRes.data);
      // Apply the temporary value type to actual filter when refresh clicked
      setSearchTermType(tempValueType);
      // No alert message
    } catch (error) {
      console.error("❌ Refresh error:", error);
      alert(`Refresh failed: ${error.message}`);
    }
  };

  // This will show ALL data initially (when no filters are set)
  const filteredSettings = settings.filter(s => {
    // If no search term and no type selected, show all
    if (!searchTermCode && !searchTermType) return true;
    
    // Apply param code filter if entered
    const matchesCode = searchTermCode === "" || s.ParamCode?.toLowerCase().startsWith(searchTermCode.toLowerCase());
    
    // Apply value type filter if selected
    const matchesType = searchTermType === "" || s.ParamValueType === searchTermType;
    
    return matchesCode && matchesType;
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

const saveOrganizationData = async () => {
  try {
    console.log("📤 Saving organization data:", formData);
    console.log("📌 Active Tab:", activeTab);
    
    // Master tab fields
   const masterFields = [
  'BusinessUnitCode', 'Name', 'CompanyNameInRcptLine1', 'CompanyNameInRcptLine2',
  'Address1_Line1', 'Address1_Line2', 'Address1_City', 'Address1_State', 'Address1_Country', 
  'Address1_PostalCode', 'Address1_Telephone1', 'Address1_Fax1', 'Address1_EmailId1', 
  'WebSite', 'LocationName', 'DisplayMessage'  // Changed from MessageOption
];
    
   
// Service tab fields - Add 'MessageOption'
// Service tab fields - Remove MessageOption temporarily
const serviceFields = [
  'GstRegno', 'GstPercentage', 'GstType', 'MessageOption', 'BillCopy', 'MAX_INV_SPLIT',
  'TableValidation', 'ForceModifier', 'DisplayCode', 'isActive', 
  'isServiceChargeAllowed', 'ServiceChargePerc', 'isOrderPrint', 
  'CheckoutPrint', 'ReceiptPrint', 'iskitchenPrint', 'isCallerPrinter'
];
    // Transaction tab fields
    const transactionFields = [
      'InvoicePrefix', 'QuotePrefix', 'CustomerPreFix', 'NextInvoiceNumber', 'NextQuoteNumber',
      'NextCustomerNumber', 'BookingPrefix', 'OrderPrefix', 'UserPrefix', 'NextBookingNumber',
      'NextOrderNumber', 'NextUserNumber', 'DoorDeliveryOrderPrefix', 'WriteInDishPrefix',
      'NextDoorDeliveryOrderNumber', 'NextWriteInDishNumber', 'TranPrefix', 'NextTranNumber',
      'DishPrefix', 'DishGroupPrefix', 'BillPrefix', 'NextDishNumber', 'NextDishGroupNumber',
      'NextBillNumber'
    ];
    
    // Settings tab fields - Only checkbox fields exist
    const settingsFields = [
      'isPDAAttached', 'TableValidation'
    ];
    
    // System fields to skip
    const systemFields = ['BusinessUnitId', 'CreatedBy', 'CreatedOn', 'ModifiedBy', 'ModifiedOn', 
                          'LastUploadHQDate', 'LastDownloadDate', 'LastUploadDate', 'ResVersion', 'POSVersion'];
    
    let payload = {};
    
    if (activeTab === "Master") {
      // MASTER TAB - Check mandatory fields
      const mandatoryFields = [
        { field: 'BusinessUnitCode', label: 'Business Unit Code' },
        { field: 'Name', label: 'Company Name' },
        { field: 'CompanyNameInRcptLine1', label: 'Co. Name In Receipt (L1)' },
        { field: 'Address1_Line1', label: 'Address Line 1' }
      ];
      
      for (const mandatory of mandatoryFields) {
        const value = formData[mandatory.field];
        if (!value || value.trim() === '') {
          alert(`❌ ${mandatory.label} is mandatory! Please fill this field.`);
          return false;
        }
      }
      
      // Send all master fields (including empty)
      for (const field of masterFields) {
        const value = formData[field];
        payload[field] = (value === undefined || value === null) ? "" : value;
      }
    } 
 else if (activeTab === "Service") {
  for (const field of serviceFields) {
    let value = formData[field];
    
    if (value === undefined || value === null) {
      if (field === 'isActive' || field === 'TableValidation' || field === 'ForceModifier' || 
          field === 'DisplayCode' || field === 'isServiceChargeAllowed' || field === 'isOrderPrint' ||
          field === 'CheckoutPrint' || field === 'ReceiptPrint' || field === 'iskitchenPrint' || 
          field === 'isCallerPrinter') {
        payload[field] = false;
      } else if (field === 'MessageOption') {
        payload[field] = 'N';  // Default to No
      } else if (field === 'GstPercentage' || field === 'ServiceChargePerc' || field === 'BillCopy' || field === 'MAX_INV_SPLIT') {
        payload[field] = 0;
      } else if (field === 'GstType') {
        payload[field] = 'E';
      } else {
        payload[field] = "";
      }
    } else {
      if (field === 'isActive' || field === 'TableValidation' || field === 'ForceModifier' || 
          field === 'DisplayCode' || field === 'isServiceChargeAllowed' || field === 'isOrderPrint' ||
          field === 'CheckoutPrint' || field === 'ReceiptPrint' || field === 'iskitchenPrint' || 
          field === 'isCallerPrinter') {
        payload[field] = value === true || value === 'true' || value === 1 || value === '1';
      } else if (field === 'MessageOption') {
        // Convert boolean to 'Y' or 'N'
        if (value === true || value === 'true' || value === 1 || value === '1' || value === 'Y' || value === 'Yes') {
          payload[field] = 'Y';
        } else {
          payload[field] = 'N';
        }
      } else if (field === 'GstPercentage' || field === 'ServiceChargePerc' || field === 'BillCopy' || field === 'MAX_INV_SPLIT') {
        payload[field] = (value === '' || value === null) ? 0 : parseFloat(value) || 0;
      } else if (field === 'GstType') {
        payload[field] = (value === 'Inclusive' || value === 'I') ? 'I' : 'E';
      } else {
        payload[field] = value;
      }
    }
  }
}
    else if (activeTab === "Transaction") {
      // TRANSACTION TAB - Allow empty values
      for (const field of transactionFields) {
        let value = formData[field];
        
        if (typeof value === 'boolean') {
          payload[field] = value;
        }
        else if (field.includes('Number') || field === 'NextInvoiceNumber' || field === 'NextQuoteNumber' ||
                 field === 'NextCustomerNumber' || field === 'NextBookingNumber' || field === 'NextOrderNumber' ||
                 field === 'NextUserNumber' || field === 'NextDoorDeliveryOrderNumber' || 
                 field === 'NextWriteInDishNumber' || field === 'NextTranNumber' || field === 'NextDishNumber' ||
                 field === 'NextDishGroupNumber' || field === 'NextBillNumber') {
          payload[field] = (value === undefined || value === null || value === '') ? 0 : parseFloat(value) || 0;
        }
        else {
          payload[field] = (value === undefined || value === null) ? "" : value;
        }
      }
    }
else if (activeTab === "Settings") {
  console.log("🔍 Saving Settings tab to MasterSettings...");
  
  // Save ALL settings to MasterSettings table
  const settingsToSave = [
    { field: 'MaxDiscount', type: 'N', label: 'Max Discount' },
    { field: 'DefaultDiscount', type: 'N', label: 'Default Discount' },
    { field: 'CustDispMsg1', type: 'S', label: 'Cust Display 1' },
    { field: 'CustDispMsg2', type: 'S', label: 'Cust Display 2' },
    { field: 'isPDAAttached', type: 'B', label: 'Waiter Enable' },
    { field: 'isTerminalTableValidation', type: 'B', label: 'Table Layout Enable' },
    { field: 'isPaymentFromtable', type: 'B', label: 'Payment From Table' },
    { field: 'AdditionOrderSymbol', type: 'S', label: 'Additional Order #' },
    { field: 'NameMaxlength', type: 'N', label: 'Name Text Length' },
    { field: 'OtherLanguageMaxlength', type: 'N', label: 'Other Language Length' }
  ];
  
  // Save each setting to MasterSettings table
  for (const setting of settingsToSave) {
    let value = formData[setting.field];
    
    if (setting.type === 'B') {
      value = (value === true || value === 1 || value === '1' || value === 'true') ? 1 : 0;
    } else if (setting.type === 'N') {
      value = (value === undefined || value === null || value === '') ? 0 : parseFloat(value) || 0;
    } else {
      value = (value === undefined || value === null) ? "" : String(value);
    }
    
    try {
      await axios.post(API_BASE_URL + "/api/organization/settings", {
        ParamCode: setting.field,
        Description: setting.label,
        ParamValueType: setting.type,
        Value: value
      });
      console.log(`✅ Saved ${setting.field}: ${value}`);
    } catch (err) {
      console.error(`❌ Error saving ${setting.field}:`, err);
    }
  }
  
  console.log("✅ All Settings saved to MasterSettings!");
  // DO NOT return true here - let it continue to add metadata
  // Remove the return true statement
}
 // Add metadata
     payload.CreatedBy = userId;
    payload.CreatedOn = new Date().toISOString();
    
    console.log("📤 Payload being sent:", payload);
    
    const orgRes = await axios.post(API_BASE_URL + "/api/organization", payload);
    console.log("✅ ORG SUCCESS:", orgRes.data);
    return true;
  } catch (err) {
    console.error("❌ ORG FAILED:", err.response?.data || err.message);
    return false;
  }
};
  const saveAdditionalSettings = async () => {
    const valid = settings.filter(
      s =>
        s.ParamCode &&
        s.ParamCode.toString().trim() !== "" &&
        s.Description &&
        s.Description.toString().trim() !== ""
    );

    if (valid.length === 0) return true;

    let failedItems = 0;

    for (let i = 0; i < valid.length; i++) {
      const s = valid[i];
      
      try {
        let safeValue = null;

        if (s.ParamValueType === "B") {
          safeValue = s.ParamBitValue ? 1 : 0;
        } 
        else if (s.ParamValueType === "N") {
          const num = Number(s.ParamNumericValue);
          safeValue = isNaN(num) ? 0 : num;
        } 
        else if (s.ParamValueType === "S") {
          safeValue = s.ParamStringValue ? String(s.ParamStringValue) : "";
        } 
        else if (s.ParamValueType === "G") {
          safeValue = null;
        } 
        else {
          safeValue = "";
        }

        const payload = {
          ParamCode: s.ParamCode,
          Description: s.Description || "",
          ParamValueType: s.ParamValueType || "S",
          Value: safeValue !== null ? safeValue : ""
        };
        
        const res = await axios.post(API_BASE_URL + "/api/organization/settings", payload);

        if (!res.data.success) {
          failedItems++;
        }
        
      } catch (err) {
        console.error(`❌ Error saving ${s.ParamCode}:`, err);
        failedItems++;
      }
    }

    return failedItems === 0;
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const success = await saveOrganizationData();
      if (success) {
        alert(`✅ ${activeTab} tab data saved successfully!`);
        await fetchData();
      } else {
        alert(`❌ ${activeTab} tab save failed!`);
      }
    } catch (err) {
      alert("Save failed!");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAdditionalSettings = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const success = await saveAdditionalSettings();
      if (success) {
        console.log("✅ Additional Settings saved successfully!");
        await refreshSettings();
      } else {
        alert("⚠️ Some settings failed to save!");
      }
    } catch (err) {
      alert("Save failed!");
    } finally {
      setSaving(false);
    }
  };

  // Modern edit modal functions
 const openEditModal = (setting) => {
  setEditSetting({ 
    ...setting,
    isNew: false  // Existing record - Param Code read-only
  });
  setIsEditModalOpen(true);
};

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditSetting(null);
  };

  const handleValueTypeChange = (type) => {
    setEditSetting(prev => ({ 
      ...prev, 
      ParamValueType: type,
      ParamStringValue: type === 'S' ? (prev.ParamStringValue || "") : "",
      ParamBitValue: type === 'B' ? (prev.ParamBitValue || 0) : 0,
      ParamNumericValue: type === 'N' ? (prev.ParamNumericValue || 0) : 0,
    }));
  };

 const handleEditSave = async () => {
  if (!editSetting) return;
  
  // For new records, validate Param Code
  if (editSetting.isNew && !editSetting.ParamCode) {
    alert("Param Code is required");
    return;
  }
  
  if (!editSetting.Description) {
    alert("Description is required");
    return;
  }
  
  try {
    let valueToSave;
    
    if (editSetting.ParamValueType === "B") {
      valueToSave = editSetting.ParamBitValue ? 1 : 0;
    } else if (editSetting.ParamValueType === "N") {
      valueToSave = editSetting.ParamNumericValue || 0;
    } else if (editSetting.ParamValueType === "G") {
      valueToSave = null;
    } else {
      valueToSave = editSetting.ParamStringValue || "";
    }

    const payload = {
      ParamCode: editSetting.ParamCode,
      Description: editSetting.Description,
      ParamValueType: editSetting.ParamValueType,
      Value: valueToSave
    };

    await axios.post(API_BASE_URL + "/api/organization/settings", payload);
    alert(`✅ Setting "${editSetting.ParamCode}" saved successfully!`);
    await refreshSettings();
    closeEditModal();
  } catch (error) {
    console.error("❌ SAVE ERROR:", error);
    alert(`Save failed: ${error.response?.data?.error || error.message}`);
  }
};
  const handleEditInputChange = (field, value) => {
    setEditSetting(prev => ({ ...prev, [field]: value }));
  };

  const openSettingModal = (setting = null) => {
  if (setting) {
    setSelectedSetting({ ...setting });
  } else {
    // This creates a NEW empty setting - all fields are cleared!
    setSelectedSetting({
      AutoNumber: null,
      _internalId: `id-${Date.now()}-${Math.random()}`,
      ParamCode: "",           // Empty
      Description: "",         // Empty
      ParamValueType: "S",     // Default to String
      ParamBitValue: 0,        // Default 0
      ParamNumericValue: 0,    // Default 0
      ParamStringValue: "",    // Empty
      isNew: true
    });
  }
  setIsSettingModalOpen(true);
};

  const handleModalInputChange = (field, value) => {
    setSelectedSetting(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveModalSetting = async () => {
  try {
    if (!selectedSetting.ParamCode) {
      alert("Param Code is required");
      return;
    }

    if (!selectedSetting.Description) {
      alert("Description is required");
      return;
    }

    let valueToSave;
    
    if (selectedSetting.ParamValueType === "B") {
      valueToSave = selectedSetting.ParamBitValue ? 1 : 0;
    } else if (selectedSetting.ParamValueType === "N") {
      valueToSave = selectedSetting.ParamNumericValue || 0;
    } else if (selectedSetting.ParamValueType === "G") {
      valueToSave = null;
    } else {
      valueToSave = selectedSetting.ParamStringValue || "";
    }

    const payload = {
      ParamCode: selectedSetting.ParamCode,
      Description: selectedSetting.Description,
      ParamValueType: selectedSetting.ParamValueType,
      Value: valueToSave
    };

    await axios.post(API_BASE_URL + "/api/organization/settings", payload);

    alert(`✅ Setting "${selectedSetting.ParamCode}" saved successfully!`);
    await refreshSettings();  // This will refresh data after save
    setIsSettingModalOpen(false);

  } catch (error) {
    console.error("❌ SAVE ERROR:", error);
    alert(`Save failed: ${error.response?.data?.error || error.message}`);
  }
};

// Header popup render function
const renderHeaderPopup = () => {
  if (!isHeaderPopupOpen) return null;

  return (
    <div className="header-popup-overlay" onClick={() => setIsHeaderPopupOpen(false)}>
      <div className="header-popup" onClick={(e) => e.stopPropagation()}>
        <div className="header-popup-header">
          <h3>Organization Details</h3>
          <button className="header-popup-close" onClick={() => setIsHeaderPopupOpen(false)}>×</button>
        </div>
        <div className="header-popup-body">
          <div className="header-popup-row">
            <span className="header-popup-label">Business Unit Code:</span>
            <span className="header-popup-value">{formData.BusinessUnitCode || "N/A"}</span>
          </div>
          <div className="header-popup-row">
            <span className="header-popup-label">Company Name:</span>
            <span className="header-popup-value">{formData.Name || "N/A"}</span>
          </div>
          <div className="header-popup-row">
            <span className="header-popup-label">Location:</span>
            <span className="header-popup-value">{formData.LocationName || "N/A"}</span>
          </div>
          <div className="header-popup-row">
            <span className="header-popup-label">Email:</span>
            <span className="header-popup-value">{formData.Address1_EmailId1 || "N/A"}</span>
          </div>
          <div className="header-popup-row">
            <span className="header-popup-label">Phone:</span>
            <span className="header-popup-value">{formData.Address1_Telephone1 || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

 const renderSettingModal = () => {
  if (!isSettingModalOpen || !selectedSetting) return null;

  return (
    <div className="org-modal-overlay" onClick={() => setIsSettingModalOpen(false)}>
      <div className="org-modal" onClick={(e) => e.stopPropagation()}>
        <div className="org-modal-header">
          <h3 style={{ margin: 0 }}>{selectedSetting.isNew ? "NEW MASTER SETTING" : "EDIT MASTER SETTING"}</h3>
          <button 
            className="org-modal-close" 
            onClick={() => setIsSettingModalOpen(false)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
        <div className="org-modal-body" style={{ padding: '20px' }}>
          {/* PARAM CODE */}
          <div className="org-field" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Param Code</label>
            <input 
              type="text" 
              value={selectedSetting.ParamCode || ""} 
              onChange={(e) => handleModalInputChange('ParamCode', e.target.value)}
              placeholder="Enter param code"
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              autoFocus
            />
          </div>
          
          {/* DESCRIPTION */}
          <div className="org-field" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
            <input 
              type="text" 
              value={selectedSetting.Description || ""} 
              onChange={(e) => handleModalInputChange('Description', e.target.value)}
              placeholder="Enter description"
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          {/* VALUE TYPE BADGES */}
          <div className="org-field" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Value Type</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div 
                className={`modern-badge ${selectedSetting.ParamValueType === 'S' ? 'active' : ''}`}
                onClick={() => handleModalInputChange('ParamValueType', 'S')}
                style={{ 
                  padding: '8px 15px', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  backgroundColor: selectedSetting.ParamValueType === 'S' ? '#4CAF50' : '#f0f0f0',
                  color: selectedSetting.ParamValueType === 'S' ? 'white' : '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>S</span>
                <span>String</span>
              </div>
              <div 
                className={`modern-badge ${selectedSetting.ParamValueType === 'B' ? 'active' : ''}`}
                onClick={() => handleModalInputChange('ParamValueType', 'B')}
                style={{ 
                  padding: '8px 15px', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  backgroundColor: selectedSetting.ParamValueType === 'B' ? '#4CAF50' : '#f0f0f0',
                  color: selectedSetting.ParamValueType === 'B' ? 'white' : '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>B</span>
                <span>Bit</span>
              </div>
              <div 
                className={`modern-badge ${selectedSetting.ParamValueType === 'N' ? 'active' : ''}`}
                onClick={() => handleModalInputChange('ParamValueType', 'N')}
                style={{ 
                  padding: '8px 15px', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  backgroundColor: selectedSetting.ParamValueType === 'N' ? '#4CAF50' : '#f0f0f0',
                  color: selectedSetting.ParamValueType === 'N' ? 'white' : '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>N</span>
                <span>Numeric</span>
              </div>
              <div 
                className={`modern-badge ${selectedSetting.ParamValueType === 'G' ? 'active' : ''}`}
                onClick={() => handleModalInputChange('ParamValueType', 'G')}
                style={{ 
                  padding: '8px 15px', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  backgroundColor: selectedSetting.ParamValueType === 'G' ? '#4CAF50' : '#f0f0f0',
                  color: selectedSetting.ParamValueType === 'G' ? 'white' : '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>G</span>
                <span>GUID</span>
              </div>
            </div>
          </div>
          
          <hr style={{ margin: '15px 0' }} />
          
          {/* VALUE FIELD BASED ON TYPE */}
          <div className="org-field" style={{ marginBottom: '15px' }}>
            {selectedSetting.ParamValueType === 'S' && (
              <>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>String Value</label>
                <input 
                  type="text" 
                  value={selectedSetting.ParamStringValue || ""} 
                  onChange={(e) => handleModalInputChange('ParamStringValue', e.target.value)}
                  placeholder="Enter string value"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </>
            )}
            {selectedSetting.ParamValueType === 'B' && (
              <>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bit Value</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={!!selectedSetting.ParamBitValue} 
                    onChange={(e) => handleModalInputChange('ParamBitValue', e.target.checked ? 1 : 0)}
                  />
                  <span>{selectedSetting.ParamBitValue ? 'Yes' : 'No'}</span>
                </label>
              </>
            )}
            {selectedSetting.ParamValueType === 'N' && (
              <>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Numeric Value</label>
                <input 
                  type="number" 
                  value={selectedSetting.ParamNumericValue || 0} 
                  onChange={(e) => handleModalInputChange('ParamNumericValue', parseFloat(e.target.value) || 0)}
                  placeholder="Enter numeric value"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </>
            )}
            {selectedSetting.ParamValueType === 'G' && (
              <>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Guid Value</label>
                <input 
                  type="text" 
                  value={selectedSetting.ParamStringValue || ""} 
                  onChange={(e) => handleModalInputChange('ParamStringValue', e.target.value)}
                  placeholder="Enter GUID"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </>
            )}
          </div>
        </div>
        
        {/* BUTTONS */}
        <div className="org-modal-footer" style={{ padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button 
            className="org-btn-save" 
            onClick={handleSaveModalSetting}
            style={{ padding: '8px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            SAVE (F4)
          </button>
          <button 
            className="org-btn-exit" 
            onClick={() => setIsSettingModalOpen(false)}
            style={{ padding: '8px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            EXIT (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
const handleNewInEditModal = () => {
  setEditSetting({
    AutoNumber: null,
    _internalId: `id-${Date.now()}-${Math.random()}`,
    ParamCode: "",           
    Description: "",         
    ParamValueType: "S",     
    ParamBitValue: 0,        
    ParamNumericValue: 0,    
    ParamStringValue: "",    
    isNew: true 
  });
};
  // Render modern edit modal - With full form value type badges and locked numeric field
// Render modern edit modal - READ ONLY for existing, EDITABLE for NEW
const renderEditModal = () => {
  if (!isEditModalOpen || !editSetting) return null;

  const isNewRecord = editSetting.isNew === true;

  return (
    <div className="modern-modal-overlay" onClick={closeEditModal}>
      <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modern-modal-header">
          <div className="modern-modal-title">
            <h3>{isNewRecord ? "NEW MASTER SETTING" : "MASTER SETTINGS"}</h3>
          </div>
          <button className="modern-modal-close" onClick={closeEditModal}>×</button>
        </div>
        <div className="modern-modal-body">
          {/* PARAM CODE - READ ONLY for existing, EDITABLE for NEW */}
          <div className="modern-field">
            <label>Param Code</label>
            {isNewRecord ? (
              <input 
                type="text" 
                value={editSetting.ParamCode || ""} 
                onChange={(e) => handleEditInputChange('ParamCode', e.target.value)}
                placeholder="Enter param code"
                autoFocus
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            ) : (
              <div className="modern-field-value" style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', color: '#333' }}>
                {editSetting.ParamCode}
              </div>
            )}
          </div>
          
          {/* DESCRIPTION - READ ONLY for existing, EDITABLE for NEW */}
          <div className="modern-field">
            <label>Description</label>
            {isNewRecord ? (
              <input 
                type="text" 
                value={editSetting.Description || ""} 
                onChange={(e) => handleEditInputChange('Description', e.target.value)}
                placeholder="Enter description"
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            ) : (
              <div className="modern-field-value" style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', color: '#333' }}>
                {editSetting.Description}
              </div>
            )}
          </div>
          
          {/* VALUE TYPE BADGES - READ ONLY for existing, CLICKABLE for NEW */}
          <div className="modern-field">
            <label>Value Type</label>
            <div className="modern-value-badges">
              <div 
                className={`modern-badge ${editSetting.ParamValueType === 'S' ? 'active' : ''}`}
                onClick={() => isNewRecord && handleValueTypeChange('S')}
                style={{ 
                  cursor: isNewRecord ? 'pointer' : 'default',
                  opacity: isNewRecord ? 1 : 0.7
                }}
              >
                <span className="badge-letter">S</span>
                <span className="badge-text">String</span>
              </div>
              <div 
                className={`modern-badge ${editSetting.ParamValueType === 'B' ? 'active' : ''}`}
                onClick={() => isNewRecord && handleValueTypeChange('B')}
                style={{ 
                  cursor: isNewRecord ? 'pointer' : 'default',
                  opacity: isNewRecord ? 1 : 0.7
                }}
              >
                <span className="badge-letter">B</span>
                <span className="badge-text">Bit</span>
              </div>
              <div 
                className={`modern-badge ${editSetting.ParamValueType === 'N' ? 'active' : ''}`}
                onClick={() => isNewRecord && handleValueTypeChange('N')}
                style={{ 
                  cursor: isNewRecord ? 'pointer' : 'default',
                  opacity: isNewRecord ? 1 : 0.7
                }}
              >
                <span className="badge-letter">N</span>
                <span className="badge-text">Numeric</span>
              </div>
              <div 
                className={`modern-badge ${editSetting.ParamValueType === 'G' ? 'active' : ''}`}
                onClick={() => isNewRecord && handleValueTypeChange('G')}
                style={{ 
                  cursor: isNewRecord ? 'pointer' : 'default',
                  opacity: isNewRecord ? 1 : 0.7
                }}
              >
                <span className="badge-letter">G</span>
                <span className="badge-text">GUID</span>
              </div>
            </div>
          </div>
          
          <div className="modern-divider"></div>
          
          {/* VALUE FIELD BASED ON TYPE - READ ONLY for existing, EDITABLE for NEW */}
          <div className="modern-field">
            {editSetting.ParamValueType === 'S' && (
              <>
                <label>String Value</label>
                {isNewRecord ? (
                  <input 
                    type="text" 
                    value={editSetting.ParamStringValue || ""} 
                    onChange={(e) => handleEditInputChange('ParamStringValue', e.target.value)}
                    placeholder="Enter string value"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                ) : (
                  <div className="modern-field-value" style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', color: '#333' }}>
                    {editSetting.ParamStringValue || "-"}
                  </div>
                )}
              </>
            )}
            {editSetting.ParamValueType === 'B' && (
              <>
                <label>Bit Value</label>
                {isNewRecord ? (
                  <div className="modern-checkbox-field">
                    <label className="modern-checkbox">
                      <input 
                        type="checkbox" 
                        checked={!!editSetting.ParamBitValue} 
                        onChange={(e) => handleEditInputChange('ParamBitValue', e.target.checked ? 1 : 0)}
                      />
                      <span>{editSetting.ParamBitValue ? 'Yes' : 'No'}</span>
                    </label>
                  </div>
                ) : (
                  <div className="modern-field-value" style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', color: '#333' }}>
                    {editSetting.ParamBitValue ? 'Yes' : 'No'}
                  </div>
                )}
              </>
            )}
            {editSetting.ParamValueType === 'N' && (
              <>
                <label>Numeric Value</label>
                {isNewRecord ? (
                  <input 
                    type="number" 
                    value={editSetting.ParamNumericValue || 0} 
                    onChange={(e) => handleEditInputChange('ParamNumericValue', parseFloat(e.target.value) || 0)}
                    placeholder="Enter numeric value"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                ) : (
                  <div className="modern-field-value" style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', color: '#333' }}>
                    {editSetting.ParamNumericValue || 0}
                  </div>
                )}
              </>
            )}
            {editSetting.ParamValueType === 'G' && (
              <>
                <label>Guid Value</label>
                {isNewRecord ? (
                  <input 
                    type="text" 
                    value={editSetting.ParamStringValue || ""} 
                    onChange={(e) => handleEditInputChange('ParamStringValue', e.target.value)}
                    placeholder="Enter GUID"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                ) : (
                  <div className="modern-field-value" style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', color: '#333' }}>
                    {editSetting.ParamStringValue || "-"}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* BUTTONS */}
        <div className="modern-modal-footer">
          <button className="modern-btn-new" onClick={handleNewInEditModal}>
            NEW <span className="btn-shortcut">(F6)</span>
          </button>
          {isNewRecord && (
            <button className="modern-btn-save" onClick={handleEditSave}>
              SAVE <span className="btn-shortcut">(F4)</span>
            </button>
          )}
          <button className="modern-btn-delete" disabled>
            DELETE
          </button>
          <button className="modern-btn-exit" onClick={closeEditModal}>
            EXIT <span className="btn-shortcut">(Esc)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
  
  if (loading) return <div className="loader">Loading...</div>;

  return (
    <div className={`organization ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="organization-card">
        <div className="organization-header">
          <h1 onClick={() => setIsHeaderPopupOpen(true)} style={{ cursor: "pointer" }} title="Click to view details">Organization</h1>
          <div className="organization-actions-top">
            {activeTab === "Additional Settings" ? (
              <button className="org-btn-save" onClick={handleSaveAdditionalSettings} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button className="org-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            )}
           <button className="org-btn-close" onClick={() => window.history.back()}>
  Close
</button>
          </div>
        </div>

        <div className="organization-tabs">
          {["Master", "Service", "Transaction", "Settings", "Additional Settings"].map((tab) => (
            <button key={tab} className={`org-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <div className="organization-tab-content">
          {/* MASTER TAB */}
          {activeTab === "Master" && (
            <div className="org-form-grid">
              <div className="org-input-group"><label>Business Unit Code</label><input name="BusinessUnitCode" value={formData.BusinessUnitCode || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label>Company Name</label><input name="Name" value={formData.Name || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label>Co. Name In Receipt (L1)</label><input name="CompanyNameInRcptLine1" value={formData.CompanyNameInRcptLine1 || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label>Co. Name In Receipt (L2)</label><input name="CompanyNameInRcptLine2" value={formData.CompanyNameInRcptLine2 || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label>Address Line 2</label><input name="Address1_Line2" value={formData.Address1_Line2 || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label>State</label><input name="Address1_State" value={formData.Address1_State || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label>Postal Code</label><input name="Address1_PostalCode" value={formData.Address1_PostalCode || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label>Fax</label><input name="Address1_Fax1" value={formData.Address1_Fax1 || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label>URL</label><input name="WebSite" value={formData.WebSite || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label className="move-left-label">HQ</label><input name="LocationName" value={formData.LocationName || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label className="move-left-label">Location</label><input name="Location" value={formData.Location || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label className="move-left-label">Address Line 1</label><input name="Address1_Line1" value={formData.Address1_Line1 || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label className="move-left-label">City</label><input name="Address1_City" value={formData.Address1_City || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label className="move-left-label">Country</label><input name="Address1_Country" value={formData.Address1_Country || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label className="move-left-label">Phone</label><input name="Address1_Telephone1" value={formData.Address1_Telephone1 || ""} onChange={handleChange} /></div>
              <div className="org-input-group"><label className="move-left-label">E-mail</label><input name="Address1_EmailId1" value={formData.Address1_EmailId1 || ""} onChange={handleChange} /></div>
              <div className="org-input-group org-full-row org-textarea-row">
  <label>Display Message</label>
 <textarea name="DisplayMessage" value={formData.DisplayMessage || ""} onChange={handleChange} rows="3" />
</div>
            </div>
          )}

{/* SERVICE TAB */}
{activeTab === "Service" && (
  <div className="service-tab-grid">
    {/* GST Reg. No */}
    <div className="service-row">
      <label className="service-label">GST Reg. No.</label>
      <input className="service-input" name="GstRegno" value={formData.GstRegno || ""} onChange={handleChange} />
    </div>
    
    {/* GST Percentage */}
    <div className="service-row">
      <label className="service-label">GST Percentage</label>
      <input className="service-number" type="number" step="0.01" name="GstPercentage" value={formData.GstPercentage || "0"} onChange={handleChange} />
    </div>
    
    {/* GST Type */}
    <div className="service-row">
      <label className="service-label">GST Type</label>
      <div className="service-radio-group">
        <label>
          <input type="radio" name="GstType" value="I" checked={formData.GstType === "I"} onChange={handleChange} /> Inclusive
        </label>
        <label>
          <input type="radio" name="GstType" value="E" checked={formData.GstType === "E"} onChange={handleChange} /> Exclusive
        </label>
      </div>
    </div>
    
    {/* Message Option */}
    <div className="service-row">
      <label className="service-label">Message Option</label>
      <div className="service-radio-group">
        <label>
          <input type="radio" name="MessageOption" value="Y" checked={formData.MessageOption === true || formData.MessageOption === 'Y'} onChange={() => setFormData({...formData, MessageOption: true})} /> Yes
        </label>
        <label>
          <input type="radio" name="MessageOption" value="N" checked={formData.MessageOption === false || formData.MessageOption === 'N'} onChange={() => setFormData({...formData, MessageOption: false})} /> No
        </label>
      </div>
    </div>
    
    {/* Bill Copy */}
    <div className="service-row">
      <label className="service-label">Bill Copy</label>
      <input className="service-number" type="number" name="BillCopy" value={formData.BillCopy || "1"} onChange={handleChange} />
    </div>
    
    {/* Max.Invoice Split */}
    <div className="service-row">
      <label className="service-label">Max.Invoice Split</label>
      <input className="service-number" type="number" name="MAX_INV_SPLIT" value={formData.MAX_INV_SPLIT || "0"} onChange={handleChange} />
    </div>
    
    {/* Table Validation */}
    <div className="service-row">
      <label className="service-label">Table Validation</label>
      <input className="service-checkbox" type="checkbox" name="TableValidation" checked={formData.TableValidation === true} onChange={(e) => setFormData({...formData, TableValidation: e.target.checked})} />
    </div>
    
    {/* Force Modifier */}
    <div className="service-row">
      <label className="service-label">Force Modifier</label>
      <input className="service-checkbox" type="checkbox" name="ForceModifier" checked={formData.ForceModifier === true} onChange={(e) => setFormData({...formData, ForceModifier: e.target.checked})} />
    </div>
    
    {/* Display Modifier Code */}
    <div className="service-row">
      <label className="service-label">Display Modifier Code</label>
      <input className="service-checkbox" type="checkbox" name="DisplayCode" checked={formData.DisplayCode === true} onChange={(e) => setFormData({...formData, DisplayCode: e.target.checked})} />
    </div>
    
    {/* Active */}
    <div className="service-row">
      <label className="service-label">Active</label>
      <input className="service-checkbox" type="checkbox" name="isActive" checked={formData.isActive === true} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} />
    </div>
    
    {/* Service Charge Allowed */}
    <div className="service-row">
      <label className="service-label">Service Charge Allowed</label>
      <input className="service-checkbox" type="checkbox" name="isServiceChargeAllowed" checked={formData.isServiceChargeAllowed === true} onChange={(e) => setFormData({...formData, isServiceChargeAllowed: e.target.checked})} />
    </div>
    
    {/* Service Charge % */}
    <div className="service-row">
      <label className="service-label">Service Charge %</label>
      <input className="service-number" type="number" step="0.01" name="ServiceChargePerc" value={formData.ServiceChargePerc || "0"} onChange={handleChange} />
    </div>
    
    {/* Order print */}
    <div className="service-row">
      <label className="service-label">Order print</label>
      <input className="service-checkbox" type="checkbox" name="isOrderPrint" checked={formData.isOrderPrint === true} onChange={(e) => setFormData({...formData, isOrderPrint: e.target.checked})} />
    </div>
    
    {/* Check out print */}
    <div className="service-row">
      <label className="service-label">Check out print</label>
      <input className="service-checkbox" type="checkbox" name="CheckoutPrint" checked={formData.CheckoutPrint === true} onChange={(e) => setFormData({...formData, CheckoutPrint: e.target.checked})} />
    </div>
    
    {/* Receipt print */}
    <div className="service-row">
      <label className="service-label">Receipt print</label>
      <input className="service-checkbox" type="checkbox" name="ReceiptPrint" checked={formData.ReceiptPrint === true} onChange={(e) => setFormData({...formData, ReceiptPrint: e.target.checked})} />
    </div>
    
    {/* Kitchen Print */}
    <div className="service-row">
      <label className="service-label">Kitchen Print</label>
      <input className="service-checkbox" type="checkbox" name="iskitchenPrint" checked={formData.iskitchenPrint === true} onChange={(e) => setFormData({...formData, iskitchenPrint: e.target.checked})} />
    </div>
    
    {/* Caller Print */}
    <div className="service-row">
      <label className="service-label">Caller Print</label>
      <input className="service-checkbox" type="checkbox" name="isCallerPrinter" checked={formData.isCallerPrinter === true} onChange={(e) => setFormData({...formData, isCallerPrinter: e.target.checked})} />
    </div>
  </div>
)}
          

          {/* TRANSACTION TAB */}
          {/* TRANSACTION TAB */}
{activeTab === "Transaction" && (
  <div className="org-form-grid-3col">
    <div className="org-legacy-section">
      <div className="org-section-header">Parameters</div>
      
      <div className="org-input-group">
        <label>Invoice Prefix</label>
        <input className="org-prefix-input" name="InvoicePrefix" value={formData.InvoicePrefix || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>Quote Prefix</label>
        <input className="org-prefix-input" name="QuotePrefix" value={formData.QuotePrefix || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>Customer Prefix</label>
        <input className="org-prefix-input" name="CustomerPreFix" value={formData.CustomerPreFix || ""} onChange={handleChange} />
      </div>
      
      <div className="org-input-group">
        <label>Next Invoice</label>
        <input className="org-number-input" type="number" name="NextInvoiceNumber" value={formData.NextInvoiceNumber || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>Next Quote No.</label>
        <input className="org-number-input" type="number" name="NextQuoteNumber" value={formData.NextQuoteNumber || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>Next Customer No.</label>
        <input className="org-number-input" type="number" name="NextCustomerNumber" value={formData.NextCustomerNumber || ""} onChange={handleChange} />
      </div>
      
      <div className="org-input-group">
        <label>Booking Prefix</label>
        <input className="org-prefix-input" name="BookingPrefix" value={formData.BookingPrefix || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>Order Prefix</label>
        <input className="org-prefix-input" name="OrderPrefix" value={formData.OrderPrefix || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>User prefix</label>
        <input className="org-prefix-input" name="UserPrefix" value={formData.UserPrefix || ""} onChange={handleChange} />
      </div>
      
      <div className="org-input-group">
        <label>Next Booking No.</label>
        <input className="org-number-input" type="number" name="NextBookingNumber" value={formData.NextBookingNumber || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>Next Order No.</label>
        <input className="org-number-input" type="number" name="NextOrderNumber" value={formData.NextOrderNumber || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>Next User No.</label>
        <input className="org-number-input" type="number" name="NextUserNumber" value={formData.NextUserNumber || ""} onChange={handleChange} />
      </div>
      
      <div className="org-input-group">
        <label>Door Delivery Order prefix</label>
        <input className="org-prefix-input" name="DoorDeliveryOrderPrefix" value={formData.DoorDeliveryOrderPrefix || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>WriteInDish Prefix</label>
        <input className="org-prefix-input" name="WriteInDishPrefix" value={formData.WriteInDishPrefix || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>Door Delivery Order No.</label>
        <input className="org-number-input" type="number" name="NextDoorDeliveryOrderNumber" value={formData.NextDoorDeliveryOrderNumber || ""} onChange={handleChange} />
      </div>
      
      <div className="org-input-group">
        <label>Next WriteInDish No.</label>
        <input className="org-number-input" type="number" name="NextWriteInDishNumber" value={formData.NextWriteInDishNumber || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>Transaction Prefix</label>
        <input className="org-prefix-input" name="TranPrefix" value={formData.TranPrefix || ""} onChange={handleChange} />
      </div>
      <div className="org-input-group">
        <label>Next Transaction No.</label>
        <input className="org-number-input" type="number" name="NextTranNumber" value={formData.NextTranNumber || ""} onChange={handleChange} />
      </div>
    </div>
    
    <div className="org-form-divider" />
    
    <div className="org-input-group">
      <label>Dish Prefix</label>
      <input className="org-prefix-input" name="DishPrefix" value={formData.DishPrefix || ""} onChange={handleChange} />
    </div>
    <div className="org-input-group">
      <label>Dish Group Prefix</label>
      <input className="org-prefix-input" name="DishGroupPrefix" value={formData.DishGroupPrefix || ""} onChange={handleChange} />
    </div>
    <div className="org-input-group">
      <label>Bill Prefix</label>
      <input className="org-prefix-input" name="BillPrefix" value={formData.BillPrefix || ""} onChange={handleChange} />
    </div>
    
    <div className="org-input-group">
      <label>Next Dish no.</label>
      <input className="org-number-input" type="number" name="NextDishNumber" value={formData.NextDishNumber || ""} onChange={handleChange} />
    </div>
    <div className="org-input-group">
      <label>Next Dish Group No.</label>
      <input className="org-number-input" type="number" name="NextDishGroupNumber" value={formData.NextDishGroupNumber || ""} onChange={handleChange} />
    </div>
    <div className="org-input-group">
      <label>Next Bill No.</label>
      <input className="org-number-input" type="number" name="NextBillNumber" value={formData.NextBillNumber || ""} onChange={handleChange} />
    </div>
  </div>
)}

{/* SETTINGS TAB */}
{activeTab === "Settings" && (
  <div className="org-settings-stack">
    <div className="org-input-group">
      <label>Max. Discount</label>
      <input type="number" step="any" name="MaxDiscount" value={formData.MaxDiscount || "0"} onChange={handleChange} />
    </div>
    <div className="org-input-group">
      <label>Default Discount</label>
      <input type="number" step="any" name="DefaultDiscount" value={formData.DefaultDiscount || "0"} onChange={handleChange} />
    </div>
    <div className="org-input-group">
      <label>Cust Display 1</label>
      <input type="text" name="CustDispMsg1" value={formData.CustDispMsg1 || ""} onChange={handleChange} />
    </div>
    <div className="org-input-group">
      <label>Cust Display 2</label>
      <input type="text" name="CustDispMsg2" value={formData.CustDispMsg2 || ""} onChange={handleChange} />
    </div>
<div className="org-input-group org-checkbox-row">
  <label>Waiter Enable</label>
  <input 
    type="checkbox" 
    name="isPDAAttached" 
    checked={formData.isPDAAttached === true} 
    onChange={(e) => setFormData({...formData, isPDAAttached: e.target.checked})} 
  />
</div>
<div className="org-input-group org-checkbox-row">
  <label>Table Layout Enable</label>
  <input 
    type="checkbox" 
    name="isTerminalTableValidation" 
    checked={formData.isTerminalTableValidation === true} 
    onChange={(e) => setFormData({...formData, isTerminalTableValidation: e.target.checked})} 
  />
</div>
<div className="org-input-group org-checkbox-row">
  <label>Payment From Table</label>
  <input 
    type="checkbox" 
    name="isPaymentFromtable" 
    checked={formData.isPaymentFromtable === true} 
    onChange={(e) => setFormData({...formData, isPaymentFromtable: e.target.checked})} 
  />
</div>
    <div className="org-input-group">
      <label>Additional Order #</label>
      <div className="org-combined-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <input 
          className="org-prefix-input" 
          type="text" 
          name="AdditionOrderSymbol" 
          value={formData.AdditionOrderSymbol || ""} 
          onChange={handleChange}
          style={{ width: '220px' }}

        />
        <span className="org-settings-helper" style={{ fontSize: '12px', color: '#666' }}>
          Symbol of additional order indicate in the kitchen print
        </span>
      </div>
    </div>
    
    <div className="org-input-group">
      <label>Name Text Length</label>
      <div className="org-combined-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <input 
          className="org-number-input" 
          type="number" 
          name="NameMaxlength" 
          value={formData.NameMaxlength || "40"} 
          onChange={handleChange}
          style={{ width: '100px' }}
        />
        <span className="org-settings-helper" style={{ fontSize: '12px', color: '#666' }}>
          Category, Dishgroup, Dish Name field length maximum size
        </span>
      </div>
    </div>
    
    <div className="org-input-group">
      <label>Other Language Length</label>
      <div className="org-combined-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <input 
          className="org-number-input" 
          type="number" 
          name="OtherLanguageMaxlength" 
          value={formData.OtherLanguageMaxlength || "60"} 
          onChange={handleChange}
          style={{ width: '100px' }}
        />
        <span className="org-settings-helper" style={{ fontSize: '12px', color: '#666' }}>
          OtherLanguage field length maximum size
        </span>
      </div>
    </div>
  </div>
)}
          {/* ADDITIONAL SETTINGS TAB - With Full Form Value Type */}
          {activeTab === "Additional Settings" && (
            <div className="additional-settings-container">
              <div className="additional-settings-card">
                
                {/* Filter Section - With Full Value Type Names */}
                <div className="org-settings-header">
                  <div className="org-filter-item">
                    <label>Param Code</label>
                    <input type="text" value={searchTermCode} onChange={(e) => setSearchTermCode(e.target.value)} placeholder="Enter code..." />
                  </div>
                  <div className="org-filter-item">
                    <label>Value Type</label>
                    <select value={tempValueType} onChange={(e) => setTempValueType(e.target.value)}>
                      <option value="">All</option>
                      <option value="S">String (S)</option>
                      <option value="B">Bit (B)</option>
                      <option value="N">Numeric (N)</option>
                      <option value="G">GUID (G)</option>
                    </select>
                  </div>
                  <button className="org-lookup-btn" onClick={refreshSettings} title="Refresh">⟳</button>
                </div>
                
                {/* Table Section - Compact Table */}
                <div className="org-settings-grid-wrapper">
                  <table className="org-settings-grid">
                    <thead>
                      <tr>
                        <th>Param Code</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSettings.map((s, index) => (
                        <tr key={s.AutoNumber || s._internalId || index} onClick={() => openEditModal(s)} className="org-clickable-row">
                          <td className="code-cell">{s.ParamCode}</td>
                          <td className="desc-cell">{s.Description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {renderSettingModal()}
      {renderEditModal()}
      {renderHeaderPopup()}
    </div>
  );
};

export default Organization;