import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import { Link } from "react-router-dom";
import DepartmentAdminList from "../DepartmentAdmin/DepartmentAdminList";
import DepartmentViewerList from "../DepartmentViewer/DepartmentViewerList";

import MainLayout from "../../layouts/MainLayout/MainLayout";

const User = () => {
  const authUser = useSelector(selectUser) || {};

  const isDeptRole = authUser.role === "DEPT_ADMIN" || authUser.role === "DEPT_VIEWER";

  return (
    <MainLayout
      title="Users"
      breadcrumb={
        <>
          <Link to="/dashboard" className="bc-link">Dashboard</Link>
          <span className="bc-sep">›</span>
          <span className="bc-current">Users</span>
        </>
      }
    >
      <div className="user-page">
        {isDeptRole ? <DepartmentViewerList /> : <DepartmentAdminList />}
      </div>
    </MainLayout>
  );
};

export default User;
