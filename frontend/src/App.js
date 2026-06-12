import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";

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

function Layout() {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const isLoginPage = location.pathname === "/";
  const isFullWidthPage = ["/console-sales-report"].includes(location.pathname);
  const isOrgPage = location.pathname === "/Organization";

  return (
    <div className={`app-viewport ${isOrgPage ? "page-organization" : ""}`}>
      {!isLoginPage && <Sidebar open={open} setOpen={setOpen} />}

      <div
        className="main-content"
        style={{
          marginLeft: isLoginPage ? "0px" : open ? "220px" : "0px",
          width: isLoginPage ? "100%" : open ? "calc(100% - 220px)" : "100%",
          flex: 1,
          padding: isLoginPage ? "0" : "20px",
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