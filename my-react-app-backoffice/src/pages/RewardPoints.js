import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";
import "./RewardPoints.css";

function RewardPoints() {

  const [message, setMessage] = useState("");
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [form, setForm] = useState({
    startMonth: null,
    endMonth: null,
    amount: "",
    discount: "",
    points: "",
    redeem: "",
    bday: ""
  });

  // ================= LOAD =================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:3001/rewardpoints");

      const mapped = res.data.map(r => ({
        startMonth: r.FromDate ? new Date(r.FromDate) : null,
        endMonth: r.ToDate ? new Date(r.ToDate) : null,
        amount: r.Amount,
        points: r.PointsUsage,
        discount: r.Discount,
        redeem: r.DefaultPoint,
        bday: r.DefaultDisc
      }));

      setData(mapped);

    } catch (err) {
      console.error("FETCH ERROR:", err);
      alert("Fetch error");
    }
  };

  // ================= MESSAGE =================
  useEffect(() => {
    if (message) {
      setTimeout(() => setMessage(""), 1500);
    }
  }, [message]);

  // ================= INPUT =================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ================= NEW =================
  const handleNew = () => {
    setEditIndex(null);
    setForm({
      startMonth: null,
      endMonth: null,
      amount: "",
      discount: "",
      points: "",
      redeem: "",
      bday: ""
    });
    setShowModal(true);
  };

  // ================= EDIT =================
  const handleEdit = (row, index) => {
    setEditIndex(index);
    setForm({ ...row });
    setShowModal(true);
  };

  // ================= SAVE =================
  const handleSave = async () => {
    try {
      // Validation: Check if at least one meaningful field is entered
      const { amount, discount, points, redeem, bday, startMonth, endMonth } = form;
      const hasData = amount || discount || points || redeem || bday || startMonth || endMonth;

      if (!hasData) {
        alert("Please enter at least one field before saving.");
        return;
      }

      const payload = {
        ...form,
        startMonth: form.startMonth
          ? new Date(form.startMonth).toISOString()
          : null,
        endMonth: form.endMonth
          ? new Date(form.endMonth).toISOString()
          : null
      };

      console.log("PAYLOAD:", payload);

      if (editIndex === null) {
        // 🔥 INSERT
        const res = await axios.post("http://localhost:3001/rewardpoints", payload);
        console.log("POST RESPONSE:", res.data);

        alert("Saved Successfully ✅");

        await fetchData();
      } else {
        // 🔥 EDIT LOCAL
        const updated = [...data];
        updated[editIndex] = form;
        setData(updated);

        alert("Updated Successfully ✏️");
      }

      setShowModal(false);
      setMessage("Saved Successfully");

    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert("Error saving data ❌");
    }
  };

  return (
    <div className="rp-page1">

      {message && <div className="rp-topMsg1">{message}</div>}

      <h1 className="rp-title1">Reward Points</h1>

      <div className="rp-topBar1">
        <button className="rp-btn1 new1" onClick={handleNew}>New</button>
      </div>

      {/* TABLE */}
      <div className="rp-tableBox1">
        <table className="rp-table1">
          <thead>
            <tr>
              <th>StartMonth</th>
              <th>End Month</th>
              <th>Amount</th>
              <th>Points</th>
              <th>Discount</th>
              <th>Redeem</th>
              <th>BDAY</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="7" className="rp-noData1">No data</td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} onClick={() => handleEdit(row, i)} style={{ cursor: "pointer" }}>
                  <td>{row.startMonth?.toISOString().slice(0,7)}</td>
                  <td>{row.endMonth?.toISOString().slice(0,7)}</td>
                  <td>{row.amount}</td>
                  <td>{row.points}</td>
                  <td>{row.discount}</td>
                  <td>{row.redeem}</td>
                  <td>{row.bday}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="rp-modalOverlay1">
          <div className="rp-mainBox1">

            <h1 className="rp-title1">
              {editIndex === null ? "Add Reward Points" : "Edit Reward Points"}
            </h1>

            <div className="rp-formGrid1">

              <div className="rp-row1">
                <label>Start Month</label>
                <DatePicker
                  className="rp-input1"
                  selected={form.startMonth}
                  onChange={(date) => setForm({ ...form, startMonth: date })}
                  dateFormat="yyyy-MM"
                  showMonthYearPicker
                />
              </div>

              <div className="rp-row1">
                <label>End Month</label>
                <DatePicker
                  className="rp-input1"
                  selected={form.endMonth}
                  onChange={(date) => setForm({ ...form, endMonth: date })}
                  dateFormat="yyyy-MM"
                  showMonthYearPicker
                />
              </div>

              <div className="rp-row1">
                <label>Amount</label>
                <input name="amount" value={form.amount} onChange={handleChange}/>
              </div>

              <div className="rp-row1">
                <label>Redeem Points</label>
                <input name="redeem" value={form.redeem} onChange={handleChange}/>
              </div>

              <div className="rp-row1">
                <label>Discount %</label>
                <input name="discount" value={form.discount} onChange={handleChange}/>
              </div>

              <div className="rp-row1">
                <label>BDAY Discount</label>
                <input name="bday" value={form.bday} onChange={handleChange}/>
              </div>

              <div className="rp-row1">
                <label>Reward Points</label>
                <input name="points" value={form.points} onChange={handleChange}/>
              </div>

            </div>

            <div className="rp-btns1">
              <button className="rp-btn1 save1" onClick={handleSave}>Save</button>
              <button className="rp-btn1 clear1" onClick={() => setShowModal(false)}>Cancel</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default RewardPoints;