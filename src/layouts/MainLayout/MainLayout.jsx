import { useState } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import { BreadcrumbProvider } from "../../context/BreadcrumbContext";
import "./MainLayout.css";

const MainLayout = ({ children, title = "", showTopbar = true, actions, breadcrumb }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [prevBreadcrumb, setPrevBreadcrumb] = useState(breadcrumb);
  const [innerBreadcrumb, setInnerBreadcrumb] = useState(breadcrumb);

  if (breadcrumb !== prevBreadcrumb) {
    setPrevBreadcrumb(breadcrumb);
    setInnerBreadcrumb(breadcrumb);
  }

  const toggle = () => setCollapsed((prev) => !prev);

  return (
    <div className="main-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
      />
      <button
        className={`sidebar-toggle ${collapsed ? "collapsed" : ""}`}
        onClick={toggle}
      >
        {collapsed ? <RightOutlined /> : <LeftOutlined />}
      </button>
      <div className={`main-layout-content ${collapsed ? "collapsed" : ""}`}>
        {showTopbar && (
          <div className="topbar-wrapper">
            <Topbar title={title} actions={actions} breadcrumb={innerBreadcrumb} />
          </div>
        )}
        {showTopbar ? (
          <BreadcrumbProvider value={setInnerBreadcrumb}>
            <div className="page-content">{children}</div>
          </BreadcrumbProvider>
        ) : (
          <div className="page-content">{children}</div>
        )}
      </div>
    </div>
  );
};

export default MainLayout;