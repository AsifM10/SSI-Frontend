import { useState } from "react";
import {
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import { BreadcrumbProvider } from "../../context/BreadcrumbContext";
import "./DashboardLayout.css";

const DashboardLayout = ({ children, title = "SSI Dashboard", role, actions, breadcrumb }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => setCollapsed((prev) => !prev);

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        role={role}
      />

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