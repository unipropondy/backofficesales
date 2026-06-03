import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./EmailSettings.css";

function EmailSettings() {

  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedReports, setSelectedReports] = useState([]);
  const [reports, setReports] = useState([]);

  /* =========================
     🔹 LOAD REPORTS
  ========================= */
  const loadReports = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/email-settings/reports"
      );
      setReports(res.data);
    } catch (err) {
      console.log("Report load error", err);
    }
  };

  /* =========================
     🔹 LOAD USER DATA
  ========================= */
  const loadData = async () => {
    if (!userName) return;

    try {
      const res = await axios.get(
        `http://localhost:5000/api/email-settings/${userName}`
      );

      const formatted = res.data.map((r) => ({
        ReportName: r.ReportName,
        Active: r.Active === true || r.Active === 1
      }));

      setSelectedReports(formatted);

    } catch (err) {
      console.log("Load error", err);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (userName.length >= 3) {
      loadData();
    }
  }, [userName]);

  /* =========================
     🔹 CHECKBOX
  ========================= */
  const handleCheckbox = (report) => {
    setSelectedReports((prev) => {
      const exists = prev.find((r) => r.ReportName === report);

      if (exists) {
        return prev.map((r) =>
          r.ReportName === report
            ? { ...r, Active: !r.Active }
            : r
        );
      } else {
        return [...prev, { ReportName: report, Active: true }];
      }
    });
  };

  const isChecked = (report) => {
    return selectedReports.some(
      (r) => r.ReportName === report && r.Active
    );
  };

  /* =========================
     🔹 NEW
  ========================= */
  const handleNew = () => {
    setUserName("");
    setEmail("");
    setSelectedReports([]);
  };

  /* =========================
     🔹 CLOSE
  ========================= */
  const handleClose = () => {
    navigate("/home");
  };

  /* =========================
     🔹 SAVE / UPDATE
  ========================= */
  const handleUpdate = async () => {
    const name = userName?.toString().trim();
    const emailAddr = email?.toString().trim();

    if (!name || name.length < 3) {
      alert("Please enter a valid User Name (at least 3 characters) ❌");
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailRegex.test(email)) {
      alert("Enter valid Gmail Id ❌");
      return;
    }

    // 🔥 CLEAN REPORTS (FINAL FIX)
    const cleanReports = selectedReports
      .filter(r => r.Active && r.ReportName)
      .map(r => r.ReportName.trim())
      .filter(name => name && name !== "null" && name !== "undefined");

    if (cleanReports.length === 0) {
      alert("Select at least one report ❌");
      return;
    }

    const payload = {
      userName: userName.trim(),
      email: email.trim(),
      reports: cleanReports   // 🔥 ONLY STRINGS
    };

    console.log("FINAL DATA 👉", payload);

    try {
      await axios.post(
        "http://localhost:5000/api/email-settings",
        payload,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      alert("Saved Successfully ✅");
      loadData();

    } catch (err) {
      console.log("❌ FULL ERROR:", err);
      console.log("❌ BACKEND ERROR:", err.response?.data);
      alert("Error saving ❌");
    }
  };

  /* =========================
     🔹 DELETE
  ========================= */
  const handleDelete = async () => {
    if (!userName) {
      alert("Enter UserName to delete ❌");
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/email-settings/${userName}`
      );

      setUserName("");
      setEmail("");
      setSelectedReports([]);

      alert("Deleted Successfully 🗑️");

    } catch (err) {
      console.log("DELETE ERROR:", err);
      alert("Delete failed ❌");
    }
  };

  return (
    <div className="em1-page1">

      <div className="em1-header1">
        <h1 className="em1-title1">Email Settings</h1>
      </div>

      <div className="em1-formBox1">

        <div className="em1-formTop1">

          <div className="em1-left1">

            <div className="em1-row1">
              <label>User Name</label>
              <input
                className="em1-input1"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div className="em1-row1">
              <label>Email Id</label>
              <input
                className="em1-input1"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
              />
            </div>

          </div>

          <div className="em1-right1">

            <div className="em1-topBtns1">
              <button className="em1-btn1 new1" onClick={handleNew}>New</button>
              <button className="em1-btn1 update1" onClick={handleUpdate}>Update</button>
              <button className="em1-btn1 delete1" onClick={handleDelete}>Delete</button>
              <button className="em1-btn1 exit1" onClick={handleClose}>Close</button>
            </div>

            <div className="em1-tableContainer1">
              <table className="em1-table1">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Report Name</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked(item.ReportName)}
                          onChange={() => handleCheckbox(item.ReportName)}
                        />
                      </td>
                      <td>{item.ReportName}</td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default EmailSettings;