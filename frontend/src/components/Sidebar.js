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
        <Link className="menu" to="/Home" onClick={() => setOpen(false)}>Home</Link>
        <Link className="menu" to="/Contact" onClick={() => setOpen(false)}>Kitchen</Link>
        <Link className="menu" to="/About" onClick={() => setOpen(false)}>Category</Link>
        <Link className="menu" to="/DishGroup" onClick={() => setOpen(false)}>Dish Group</Link>
        <Link className="menu" to="/Dish" onClick={() => setOpen(false)}>Dish</Link>
        <Link className="menu" to="/Modifier" onClick={() => setOpen(false)}>Modifier</Link>
        <Link className="menu" to="/discount" onClick={() => setOpen(false)}>Discount</Link>
        <Link className="menu" to="/Inventory" onClick={() => setOpen(false)}>Inventory</Link>
        <Link className="menu" to="/Settlement" onClick={() => setOpen(false)}>Settlement</Link>
        <Link className="menu" to="/SalesReport" onClick={() => setOpen(false)}>Sales Report</Link>
        <Link className="menu" to="/SltReport" onClick={() => setOpen(false)}>Slt.. Report</Link>
        <Link className="menu" to="/Member" onClick={() => setOpen(false)}>Member</Link>
        <Link className="menu" to="/Organization" onClick={() => setOpen(false)}>Organization</Link>
        <Link className="menu" to="/console-sales-report" onClick={() => setOpen(false)}>Consolidated Business Performance Report</Link>
        <Link className="menu" to="/dish-movement-report" onClick={() => setOpen(false)}>Dish Movement Report</Link>
        <Link className="menu" to="/dish-movement" onClick={() => setOpen(false)}>Dish Movement</Link>
        <Link className="menu" to="/dish-order-item-share" onClick={() => setOpen(false)}>Dish Order Item Share</Link>
        <Link className="menu" to="/dayend-report" onClick={() => setOpen(false)}>Dayend Report</Link>
        <Link className="menu" to="/HappyHours" onClick={() => setOpen(false)}>Happy Hours</Link>
        <Link className="menu" to="/Server" onClick={() => setOpen(false)}>Server Master</Link>
      </div>
    </>
  );
}

export default Sidebar;
