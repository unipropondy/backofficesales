import { useState, useEffect } from "react";
import axios from "axios";
import "./VendorMaster.css";

function VendorMaster() {

  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    VendorCode: "",
    ContactPerson: "",
    CompanyName: "",
    EmailId: "",
    HandPhone: "",
    OfficeAddress: "",
    City: "",
    PostalCode: "",
    Phone: "",
    GstType: "IN",
    GST: "0",
    Active: true
  });

  // ================= LOAD =================
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/vendor");

      const mapped = res.data.map(v => ({
        VendorCode: v.VendorCode?.trim(),
        CompanyName: v.Name,
        ContactPerson: v.ContactPerson,
        EmailId: v.EmailId1,
        HandPhone: v.Address1_Telephone1,
        OfficeAddress: v.Address1_Line1,
        City: v.Address1_City,
        PostalCode: v.Address1_PostalCode,
        Phone: v.Address1_Telephone2,
        GstType: v.GstType,
        GST: v.GSTPercentage,
        Active: v.StatusCode === 1
      }));

      setEntries(mapped);

    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  // ================= AUTO HIDE =================
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // ================= CHANGE =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // ================= NEW =================
  const handleNew = () => {
    setForm({
      VendorCode: "",
      ContactPerson: "",
      CompanyName: "",
      EmailId: "",
      HandPhone: "",
      OfficeAddress: "",
      City: "",
      PostalCode: "",
      Phone: "",
      GstType: "IN",
      GST: "0",
      Active: true
    });
    setShowModal(true);
  };

  // ================= EDIT =================
  const handleEdit = (vendor) => {
    setForm(vendor);
    setShowModal(true);
  };

  // ================= SAVE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const VendorCode = form.VendorCode?.toString().trim();
    const CompanyName = form.CompanyName?.toString().trim();
    const ContactPerson = form.ContactPerson?.toString().trim();

    if (!VendorCode || !CompanyName || !ContactPerson) {
      alert("Please fill required fields: Vendor Code, Company Name, and Contact Person.");
      return;
    }

    try {
      const payload = {
        VendorCode,
        CompanyName,
        ContactPerson,
        EmailId: form.EmailId || "",
        HandPhone: form.HandPhone || "",
        OfficeAddress: form.OfficeAddress || "",
        City: form.City || "",
        PostalCode: form.PostalCode || "",
        Phone: form.Phone || "",
        GstType: ["IN", "EX"].includes(form.GstType) ? form.GstType : "IN", // 🔥 FIX
        GST: Number(form.GST) || 0,
        Active: form.Active
      };

      await axios.post("http://localhost:5000/vendor", payload);

      setSuccessMsg("Saved Successfully");
      setShowModal(false);
      fetchVendors();

    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Error saving data");
    }
  };

  return (
    <div className="vendor-page1">

      {successMsg && <div className="vendor-top-msg1">{successMsg}</div>}

      <h1 className="vendor-title1">Vendor</h1>

      <div className="vendor-btn-right1">
        <button className="vendor-new-btn1" onClick={handleNew}>New</button>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="vendor-modal-overlay1">
          <div className="vendor-modal1">

            <h2>Vendor</h2>

            <form onSubmit={handleSubmit} className="vendor-form1">

              <div className="vendor-buttons-top1">
                <button type="submit" className="vendor-save1">Save</button>
                <button
                  type="button"
                  className="vendor-cancel1"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>

              <div className="vendor-row1">
                <label>Vendor Code</label>
                <input name="VendorCode" value={form.VendorCode} onChange={handleChange}/>
              </div>

              <div className="vendor-row1">
                <label>Company Name</label>
                <input name="CompanyName" value={form.CompanyName} onChange={handleChange}/>
              </div>

              <div className="vendor-row1">
                <label>Contact Person</label>
                <input name="ContactPerson" value={form.ContactPerson} onChange={handleChange}/>
              </div>

              <div className="vendor-row1">
                <label>Email</label>
                <input name="EmailId" value={form.EmailId} onChange={handleChange}/>
              </div>

              <div className="vendor-row1">
                <label>Hand Phone</label>
                <input name="HandPhone" value={form.HandPhone} onChange={handleChange}/>
              </div>

              <div className="vendor-row1">
                <label>Office Address</label>
                <input name="OfficeAddress" value={form.OfficeAddress} onChange={handleChange}/>
              </div>

              <div className="vendor-row1">
                <label>City</label>
                <input name="City" value={form.City} onChange={handleChange}/>
              </div>

              <div className="vendor-row1">
                <label>Postal Code</label>
                <input name="PostalCode" value={form.PostalCode} onChange={handleChange}/>
              </div>

              <div className="vendor-row1">
                <label>Phone</label>
                <input name="Phone" value={form.Phone} onChange={handleChange}/>
              </div>

              <div className="vendor-row1">
                <label>GST Type</label>
                <select name="GstType" value={form.GstType} onChange={handleChange}>
  <option value="IN">IN</option>
  <option value="EX">EX</option>
</select>
              </div>

              <div className="vendor-row1">
                <label>GST</label>
                <input name="GST" value={form.GST} onChange={handleChange}/>
              </div>

              <div className="vendor-row1">
                <label>Active</label>
                <input type="checkbox" name="Active" checked={form.Active} onChange={handleChange}/>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* TABLE */}
      <table className="vendor-table1">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Contact</th>
            <th>City</th>
            <th>Phone</th>
            <th>GST</th>
          </tr>
        </thead>

        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan="6">No data</td>
            </tr>
          ) : (
            entries.map((v, i) => (
              <tr key={i} onClick={() => handleEdit(v)} style={{ cursor: "pointer" }}>
                <td>{v.VendorCode}</td>
                <td>{v.CompanyName}</td>
                <td>{v.ContactPerson}</td>
                <td>{v.City}</td>
                <td>{v.Phone}</td>
                <td>{v.GST}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

    </div>
  );
}

export default VendorMaster;