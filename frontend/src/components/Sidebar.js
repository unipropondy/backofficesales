import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import "./Sidebar.css";

function Sidebar({ open, setOpen }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/"); // ✅ back to login page
  };

  return (
    <>
      <div className="topbar">
        {/* LEFT: open/close icon */}
        <button className="icon-btn" onClick={() => setOpen(!open)}>
          {open ? <FaTimes /> : <FaBars />}
        </button>

        {/* Dashboard title removed entirely as requested */}

        {/* RIGHT: logout icon */}
        <button className="logout-icon-btn" onClick={handleLogout}>
          <FaSignOutAlt />
        </button>
      </div>

      <div className={`sidebar ${open ? "open" : "close"}`}>
        
        
        <Link className="menu" to="/SalesReport" onClick={() => setOpen(false)}>Sales Report</Link>
        <Link className="menu" to="/console-sales-report" onClick={() => setOpen(false)}>Consolidated Business Performance Report</Link>
        <Link className="menu" to="/dish-movement-report" onClick={() => setOpen(false)}>Dish Movement Report</Link>
        <Link className="menu" to="/dish-movement" onClick={() => setOpen(false)}>Dish Movement</Link>
        <Link className="menu" to="/dish-order-item-share" onClick={() => setOpen(false)}>Dish Order Item Share</Link>
        <Link className="menu" to="/dayend-report" onClick={() => setOpen(false)}>Dayend Report</Link>
        <Link className="menu" to="/HappyHours" onClick={() => setOpen(false)}>Happy Hours</Link>
        <Link className="menu" to="/Server" onClick={() => setOpen(false)}>Server Master</Link>
        <Link className="menu" to="/Discount" onClick={() => setOpen(false)}>Discount</Link>
        <Link className="menu" to="/Paymode" onClick={() => setOpen(false)}>Paymode</Link>
        <Link className="menu" to="/Vendormaster" onClick={() => setOpen(false)}>Vendormaster</Link>
        <Link className="menu" to="/RewardPoints" onClick={() => setOpen(false)}>Reward Points</Link>
        <Link className="menu" to="/EmailSettings" onClick={() => setOpen(false)}>Email Settings</Link>
        <Link className="menu" to="/Organization" onClick={() => setOpen(false)}>Organization</Link>
      </div>
    </>
  );
}

export default Sidebar;
