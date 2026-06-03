import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import About from "./pages/About";
import DishGroup from "./pages/DishGroup";
import Dish from "./pages/Dish";
import Modifier from "./pages/Modifier";
import Inventory from "./pages/Inventory";
import Settlement from "./pages/Settlement";
import SalesReport from "./pages/SalesReport";
import SltReport from "./pages/SltReport";
import Member from "./pages/Member";
import MasterSettings from "./pages/MasterSettings";
import VendorMaster from "./pages/VendorMaster";
import RewardPoints from "./pages/RewardPoints";
import UserGroup from "./pages/usergroup";
import PrinterSettings from "./pages/PrinterSettings";
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

  // Login page la sidebar hide
  const isLoginPage = location.pathname === "/";
  const isOrgPage = location.pathname === "/Organization";

  return (
    <div className={`app-viewport ${isOrgPage ? "page-organization" : ""}`}>
      {!isLoginPage && <Sidebar open={open} setOpen={setOpen} />}

      <div
        className="main-content"
        style={{
          width: "100%",
          marginLeft: "0px",
          flex: 1,
          padding: isLoginPage ? "0" : "20px",
          background: "#ecf0f1",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          transition: "none",
        }}
      >
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/About" element={<About />} />
          <Route path="/DishGroup" element={<DishGroup />} />
          <Route path="/Dish" element={<Dish />} />
          <Route path="/Modifier" element={<Modifier />} />
          <Route path="/Inventory" element={<Inventory />} />
          <Route path="/Settlement" element={<Settlement />} />
          <Route path="/SalesReport" element={<SalesReport />} />
          <Route path="/SltReport" element={<SltReport />} />
          <Route path="/Member" element={<Member />} />
          <Route path="/MasterSettings" element={<MasterSettings />} />
          <Route path="/VendorMaster" element={<VendorMaster />} />
          <Route path="/HappyHours" element={<HappyHours sidebarOpen={open} />} />
          <Route path="/RewardPoints" element={<RewardPoints />} />
          <Route path="/UserGroup" element={<UserGroup />} />
          <Route path="/PrinterSettings" element={<PrinterSettings />} />
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