// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import ProjectDetails from "../pages/ProjectDetails/ProjectDetails";
// import Dashboard from "../pages/Dashboard/Dashboard";
// import Login from "../pages/Login/Login";
// import Register from "../pages/Register/Register";
// import DepartmentDetails from "../pages/DepartmentDetails/DepartmentDetails";
// import MonitoringDetails from "../pages/MonitoringDetails/MonitoringDetails";
// import CpuPage from "../pages/Monitoring/CPU/CpuPage";
// import GpuPage from "../pages/Monitoring/GPU/GpuPage";
// import MemoryPage from "../pages/Monitoring/Memory/MemoryPage";
// import StoragePage from "../pages/Monitoring/Storage/StoragePage";
// import PowerPage from "../pages/Monitoring/Power/PowerPage";
// import CarbonPage from "../pages/Monitoring/Carbon/CarbonPage";
// import CarbonEmissionPage from "../pages/Monitoring/CarbonEmission/CarbonEmissionPage";
// import Alerts from "../pages/Alerts/Alerts";
// import User from "../pages/Users/Users";
// import Reports from "../pages/Reports/Reports";
// // import DepartmentAdmin from "../pages/DepartmentAdmin/DepartmentAdminList";
// import DepartmentViewerView from "../pages/DepartmentViewer/DepartmentViewerView";
// import CreateDepartmentViewer from "../pages/DepartmentViewer/CreateDepartmentViewer";
// import DepartmentAdminView from "../pages/DepartmentAdmin/DepartmentAdminView";

// import CentralViewerView from "../pages/CentralViewer/CentralViewerView";
// //import DepartmentViewOnly from "../pages/DepartmentViewOnly/DepartmentViewOnly";


// export default function AppRoutes() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/dashboard" element={<Dashboard />} />
//         {/* <Route path="/monitoring" element={<Dashboard />} /> */}
//         <Route path="/projects/:projectId" element={<ProjectDetails />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/" element={<Login />} />
//         <Route path="/departments/:departmentCode" element={<DepartmentDetails />} />
//         <Route path="/monitoring/:projectId" element={<MonitoringDetails />} />
//         <Route path="/monitoring/:projectId/cpu" element={<CpuPage />} />
//         <Route path="/monitoring/:projectId/gpu" element={<GpuPage />} />
//         <Route path="/monitoring/:projectId/memory" element={<MemoryPage />} />
//         <Route path="/monitoring/:projectId/storage" element={<StoragePage />} />
//         <Route path="/monitoring/:projectId/power" element={<PowerPage />} />

//         <Route path="/monitoring/:projectId/carbon" element={<CarbonPage />} />

//         <Route path="/reports" element={<Reports />} />
//         <Route path="/alerts" element={<Alerts />} />
//         <Route path="/users" element={<User />} />
//         <Route path="/departmentViewerView" element={<DepartmentViewerView />} />
//         <Route path="/createDepartmentViewer" element={<CreateDepartmentViewer />} />
//         <Route path="/departmentAdminView" element={<DepartmentAdminView />} />

//         <Route path="/centralviewerView" element={<CentralViewerView />} />
//         {/* <Route path="/DepartmentViewOnly" element={<DepartmentViewOnly />} /> */}

//       </Routes>
//     </BrowserRouter>
//   );
// }



//new code with D-


import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProjectDetails from "../pages/ProjectDetails/ProjectDetails";
import Dashboard from "../pages/Dashboard/Dashboard";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import DepartmentDetails from "../pages/DepartmentDetails/DepartmentDetails";
import Departments from "../pages/Departments/Departments";
import ProjectMachines from "../pages/ProjectMachines/ProjectMachines";
import MonitoringDetails from "../pages/MonitoringDetails/MonitoringDetails";
import CpuPage from "../pages/Monitoring/CPU/CpuPage";
import GpuPage from "../pages/Monitoring/GPU/GpuPage";
import MemoryPage from "../pages/Monitoring/Memory/MemoryPage";
import StoragePage from "../pages/Monitoring/Storage/StoragePage";
import PowerPage from "../pages/Monitoring/Power/PowerPage";
import CarbonPage from "../pages/Monitoring/Carbon/CarbonPage";
import Alerts from "../pages/Alerts/Alerts";
import User from "../pages/Users/Users";
import UserProfile from "../pages/UserProfile/UserProfile";
import Reports from "../pages/Reports/Reports";

import DepartmentViewerView from "../pages/DepartmentViewer/DepartmentViewerView";
import CreateDepartmentViewer from "../pages/DepartmentViewer/CreateDepartmentViewer";
import DepartmentAdminView from "../pages/DepartmentAdmin/DepartmentAdminView";
import CentralViewerView from "../pages/CentralViewer/CentralViewerView";


import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========================= */}
        {/* Public Routes */}
        {/* ========================= */}

        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />
        

        {/* ========================= */}
        {/* Protected Routes */}
        {/* ========================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <ProtectedRoute>
              <Departments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments/:departmentCode"
          element={
            <ProtectedRoute>
              <DepartmentDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/machines/:projectId"
          element={
            <ProtectedRoute>
              <ProjectMachines />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring/:projectId"
          element={
            <ProtectedRoute>
              <MonitoringDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring/:projectId/cpu"
          element={
            <ProtectedRoute>
              <CpuPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring/:projectId/gpu"
          element={
            <ProtectedRoute>
              <GpuPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring/:projectId/memory"
          element={
            <ProtectedRoute>
              <MemoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring/:projectId/storage"
          element={
            <ProtectedRoute>
              <StoragePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring/:projectId/power"
          element={
            <ProtectedRoute>
              <PowerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring/:projectId/carbon"
          element={
            <ProtectedRoute>
              <CarbonPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["CENTRAL_ADMIN", "DEPT_ADMIN"]}>
                <Reports />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <User />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user-profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departmentViewerView"
          element={
            <ProtectedRoute>
              <DepartmentViewerView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/createDepartmentViewer"
          element={
            <ProtectedRoute>
              <CreateDepartmentViewer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departmentAdminView"
          element={
            <ProtectedRoute>
              <DepartmentAdminView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/centralviewerView"
          element={
            <ProtectedRoute>
              <CentralViewerView />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}