import { useState } from "react";
import { Drawer } from "antd";
import {
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import { BreadcrumbProvider } from "../../context/BreadcrumbContext";
import { useWebSocket } from "../../hooks/useWebSocket";
import "./DashboardLayout.css";

const DashboardLayout = ({ children, title = "SSI Dashboard", role, actions, breadcrumb }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  useWebSocket();

  const toggle = () => setCollapsed((prev) => !prev);

  return (
    <div className="dashboard-layout">
      {/* Desktop Fixed Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        role={role}
      />

      {/* Mobile Navigation Drawer */}
      <Drawer
        placement="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        width={260}
        styles={{ body: { padding: 0, height: "100%", overflow: "hidden" } }}
        className="mobile-sidebar-drawer"
      >
        <Sidebar
          collapsed={false}
          role={role}
          onNavClick={() => setMobileDrawerOpen(false)}
        />
      </Drawer>

      <button
        className={`sidebar-toggle ${collapsed ? "collapsed" : ""}`}
        onClick={toggle}
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <RightOutlined /> : <LeftOutlined />}
      </button>

      <div className={`dashboard-layout-content ${collapsed ? "collapsed" : ""}`}>
        <div className="topbar-wrapper">
          <Topbar
            title={title}
            role={role}
            actions={actions}
            breadcrumb={breadcrumb}
            onOpenMobileMenu={() => setMobileDrawerOpen(true)}
          />
        </div>

        <BreadcrumbProvider value={breadcrumb || []}>
          <div className="page-content">{children}</div>
        </BreadcrumbProvider>
      </div>
    </div>
  );
};

export default DashboardLayout;