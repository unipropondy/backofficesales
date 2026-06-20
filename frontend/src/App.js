import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Sidebar from './components/Sidebar';
import SalesReport from "./pages/SalesReport";
import VendorMaster from "./pages/VendorMaster";
import RewardPoints from "./pages/RewardPoints";
import Paymode from "./pages/Paymode";
import Barcode from "./pages/Barcode";
import EmailSettings from "./pages/EmailSettings";
import Discount from "./pages/Discount";
import HappyHours from "./pages/HappyHours";
import ConsoleSalesReport from "./pages/ConsoleSalesReport";
import DishMovementReport from "./pages/DishMovementReport";
import DishMovement from "./pages/DishMovement";
import Organization from "./pages/Organization";
import DayEndReport from "./pages/DayEndReport";
import DishOrderItemShare from "./pages/DishOrderItemShare";
import ServerMaster from "./pages/ServerMaster";
import Login from "./pages/Login";

function Layout() {
  const [open, setOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("authToken"));
  const isOrgPage = window.location.pathname === "/Organization";

  // Watch for local storage updates (e.g. logouts)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("authToken"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUsername");
    localStorage.removeItem("authRole");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className={`app-viewport ${isOrgPage ? "page-organization" : ""}`}>
      <Sidebar open={open} setOpen={setOpen} onLogout={handleLogout} />

      <div
        className="main-content"
        style={{
          marginLeft: open ? "220px" : "0px",
          width: open ? "calc(100% - 220px)" : "100%",
          flex: 1,
          padding: "20px",
          background: "#ecf0f1",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          transition: "margin-left 0.3s ease, width 0.3s ease",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        <Routes>
          <Route path="/SalesReport" element={<SalesReport sidebarOpen={open} />} />
          <Route path="/VendorMaster" element={<VendorMaster />} />
          <Route path="/HappyHours" element={<HappyHours sidebarOpen={open} />} />
          <Route path="/RewardPoints" element={<RewardPoints />} />
          <Route path="/Paymode" element={<Paymode />} />
          <Route path="/Barcode" element={<Barcode sidebarOpen={open} />} />
          <Route path="/EmailSettings" element={<EmailSettings />} />
          <Route path="/discount" element={<Discount sidebarOpen={open} />} />
          <Route path="/console-sales-report" element={<ConsoleSalesReport sidebarOpen={open} />} />
          <Route path="/dish-movement-report" element={<DishMovementReport sidebarOpen={open} />} />
          <Route path="/dish-movement" element={<DishMovement sidebarOpen={open} />} />
          <Route path="/dish-order-item-share" element={<DishOrderItemShare sidebarOpen={open} />} />
          <Route path="/Organization" element={<Organization sidebarOpen={open} />} />
          <Route path="/dayend-report" element={<DayEndReport sidebarOpen={open} />} />
          <Route path="/Server" element={<ServerMaster sidebarOpen={open} />} />
          {/* Default redirect when logged in */}
          <Route path="*" element={<Navigate to="/console-sales-report" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;