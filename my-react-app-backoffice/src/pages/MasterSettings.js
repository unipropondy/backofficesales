import React, { useState } from "react";
import "./MasterSettings.css";

function MasterSettings({ onClose }) {

  const [isVisible, setIsVisible] = useState(true);
  const [showMsg, setShowMsg] = useState(false);

  // 🔥 NEW: message text
  const [msgText, setMsgText] = useState("");

  const [form, setForm] = useState({
    business_unit_code: "UPS",
    branch: "HQ",
    company_name: "",
    receipt_line1: "",
    receipt_line2: "",
    location: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    phone: "",
    fax: "",
    email: "",
    url: "",
    display_message: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 UPDATED SAVE LOGIC (ONLY HERE SAVE HAPPENS)
  const handleSave = () => {
    // Check if all fields are empty
    const isEmpty = Object.values(form).every(val => !val || val.toString().trim() === "");
    if (isEmpty) {
      alert("Please enter at least one setting value before saving.");
      return;
    }
    
    // 🔥 FRONTEND SAVE
    if (!form.company_name || !form.location || !form.city) {
      setMsgText("Please fill required fields");
      setShowMsg(true);
      return;
    }

    console.log("Saved Data:", form);

    setMsgText("Updated Successfully");
    setShowMsg(true);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="ms-wrapper1">

      <div className="ms-box1">

        {/* HEADER */}
        <div className="ms-top1">
          <h2>Master Settings</h2>

          <div className="ms-btns1">
            <button className="btn-standard btn-success" onClick={handleSave}>Save</button>
            <button className="btn-standard btn-danger" onClick={handleClose}>Close</button>
          </div>
        </div>

        {/* FORM */}
        <div className="ms-form1">

          <div className="f-row1">
            <label>Business Unit Code</label>

            <div className="split-two1">
              <input
                value={form.business_unit_code}
                name="business_unit_code"
                onChange={handleChange}
              />

              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
              >
                <option>HQ</option>
                <option>Branch</option>
              </select>
            </div>
          </div>

          <div className="f-row1">
            <label>Company Name</label>
            <input name="company_name" value={form.company_name} onChange={handleChange}/>
          </div>

          <div className="f-row1">
            <label>Company Name In Receipt</label>
            <input name="receipt_line1" value={form.receipt_line1} onChange={handleChange}/>
          </div>

          <div className="f-row1">
            <label>Line 2</label>
            <input name="receipt_line2" value={form.receipt_line2} onChange={handleChange}/>
          </div>

          <div className="f-row1">
            <label>Location</label>
            <input name="location" value={form.location} onChange={handleChange}/>
          </div>

          <div className="f-row1">
            <label>Address1</label>
            <input name="address1" value={form.address1} onChange={handleChange}/>
          </div>

          <div className="f-row1">
            <label>Address2</label>
            <input name="address2" value={form.address2} onChange={handleChange}/>
          </div>

          <div className="f-row1 split1">
            <div>
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange}/>
            </div>

            <div>
              <label>State</label>
              <input name="state" value={form.state} onChange={handleChange}/>
            </div>
          </div>

          <div className="f-row1 split1">
            <div>
              <label>Country</label>
              <input name="country" value={form.country} onChange={handleChange}/>
            </div>

            <div>
              <label>Postal Code</label>
              <input name="postal_code" value={form.postal_code} onChange={handleChange}/>
            </div>
          </div>

          <div className="f-row1 split1">
            <div>
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}/>
            </div>

            <div>
              <label>Fax</label>
              <input name="fax" value={form.fax} onChange={handleChange}/>
            </div>
          </div>

          <div className="f-row1">
            <label>E-mail</label>
            <input name="email" value={form.email} onChange={handleChange}/>
          </div>

          <div className="f-row1">
            <label>URL</label>
            <input name="url" value={form.url} onChange={handleChange}/>
          </div>

          <div className="f-row1">
            <label>Display Message</label>
            <textarea name="display_message" value={form.display_message} onChange={handleChange}/>
          </div>

        </div>

      </div>

      {/* 🔥 MESSAGE POPUP */}
      {showMsg && (
        <div className="msg-overlay1">
          <div className="msg-box1">
            <h4>Message</h4>
            <p>{msgText}</p>   {/* 🔥 dynamic message */}

            <div className="msg-actions1">
              <button className="btn-standard btn-success" onClick={() => {
                setShowMsg(false);
                handleClose();
              }}>
                ✔ OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MasterSettings;