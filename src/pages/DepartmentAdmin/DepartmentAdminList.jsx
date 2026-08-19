// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { selectUser } from "../../store/slices/authSlice";

// import {
//   EyeOutlined,
//   DeleteOutlined,
//   UserOutlined,
// } from "@ant-design/icons";

// import { message } from "antd";

// import api from "../../services/api";
// import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal/DeleteConfirmationModal";

// import "./DepartmentAdmin.css";

// const DepartmentAdminList = () => {
//   const navigate = useNavigate();
//   const loggedInUser = useSelector(selectUser) || {};
//   const isCentralAdmin = loggedInUser.role === "CENTRAL_ADMIN";

//   const [admins, setAdmins] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [deleteModal, setDeleteModal] = useState({ open: false, admin: null });

//   useEffect(() => {
//     getDepartmentAdmins();
//   }, []);

//   const getDepartmentAdmins = async () => {
//     try {
//       setLoading(true);
//       const response = await api.get(`/api/users`);
//       if (response.data.success) {
//         setAdmins(response.data.data);
//       }
//     } catch (err) {
//       message.error({ content: "Unable to fetch Department Admins", className: "toast-error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const viewAdmin = (admin) => {
//     navigate("/departmentAdminView", {
//       state: admin,
//     });
//   };

//   return (
//     <div className="department-admin-page">
//       <div className="department-admin-header animate-in animate-in-d1">
//         <div>
//           <h2>Central Admin Management</h2>
//           <p>List of all Department Admins.</p>
//         </div>
//       </div>

//       <div className="department-admin-table">
//         <div className="table-heading">
//           <div>Name</div>
//           <div>Email</div>
//           <div>Department</div>
//           <div>Actions</div>
//         </div>

//         {loading ? (
//           <div className="loading">Loading...</div>
//         ) : admins.filter((a) => a.role === "DEPT_ADMIN").length === 0 ? (
//           <div className="loading">No Department Admins Found</div>
//         ) : (
//           admins
//             .filter((admin) => admin.role === "DEPT_ADMIN")
//             .map((admin, i) => (
//               <div className="table-row animate-in" key={admin.userId} style={{ animationDelay: `${i * 0.05}s` }}>
//                 <div className="name">
//                   <span className="name-icon"><UserOutlined /></span>
//                   <span>{admin.personName}</span>
//                 </div>
//                 <div>{admin.email}</div>
//                 <div>{admin.deptName}</div>
//                 <div className="actions">
//                   <button className="view-btn" onClick={() => viewAdmin(admin)}>
//                     <EyeOutlined />
//                     View
//                   </button>
//                   {isCentralAdmin && (
//                     <button
//                       className="delete-btn"
//                       onClick={() => setDeleteModal({ open: true, admin })}
//                     >
//                       <DeleteOutlined />
//                       Delete
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))
//         )}
//       </div>

//       <DeleteConfirmationModal
//         open={deleteModal.open}
//         title="Delete Department Admin?"
//         entityName={deleteModal.admin?.personName}
//         description="This action cannot be undone. This will permanently delete the department admin and remove all associated data."
//         details={
//           deleteModal.admin
//             ? [
//               { label: "Email", value: deleteModal.admin.email },
//               { label: "Department", value: deleteModal.admin.deptName },
//             ]
//             : []
//         }
//         deleteApi={`/api/users/${deleteModal.admin?.userId}`}
//         onSuccess={() => {
//           message.success({ content: "Admin deleted successfully", className: "toast-success" });
//           setDeleteModal({ open: false, admin: null });
//           getDepartmentAdmins();
//         }}
//         onCancel={() => setDeleteModal({ open: false, admin: null })}
//       />
//     </div>
//   );
// };

// export default DepartmentAdminList;






// added status feature in code below


// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { selectUser } from "../../store/slices/authSlice";

// import {
//   EyeOutlined,
//   DeleteOutlined,
//   UserOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
// } from "@ant-design/icons";

// import { message } from "antd";

// import api from "../../services/api";
// import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal/DeleteConfirmationModal";

// import "./DepartmentAdmin.css";

// const DepartmentAdminList = () => {
//   const navigate = useNavigate();

//   const loggedInUser = useSelector(selectUser) || {};
//   const isCentralAdmin = loggedInUser.role === "CENTRAL_ADMIN";

//   const [admins, setAdmins] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [statusMap, setStatusMap] = useState({});

//   const [deleteModal, setDeleteModal] = useState({
//     open: false,
//     admin: null,
//   });

//   useEffect(() => {
//     getDepartmentAdmins();
//   }, []);

//   // ---------------------------------------------------------
//   // GET ALL USERS
//   // ---------------------------------------------------------
//   const getDepartmentAdmins = async () => {
//     try {
//       setLoading(true);

//       const response = await api.get(`/api/users`);

//       if (response.data.success) {
//         setAdmins(response.data.data);
//       }
//     } catch (err) {
//       console.error("Error fetching Department Admins:", err);

//       message.error({
//         content: "Unable to fetch Department Admins",
//         className: "toast-error",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------------------------------------------------
//   // VIEW ADMIN
//   // ---------------------------------------------------------
//   const viewAdmin = (admin) => {
//     navigate("/departmentAdminView", {
//       state: admin,
//     });
//   };

//   // ---------------------------------------------------------
//   // DELETE ADMIN
//   // ---------------------------------------------------------
//   const openDeleteModal = (admin) => {
//     setDeleteModal({
//       open: true,
//       admin: admin,
//     });
//   };

//   const closeDeleteModal = () => {
//     setDeleteModal({
//       open: false,
//       admin: null,
//     });
//   };

//   // ---------------------------------------------------------
//   // FRONTEND-ONLY STATUS (backend integration later)
//   // ---------------------------------------------------------
//   const resolveStatus = (admin) => {
//     if (statusMap[admin.userId]) {
//       return statusMap[admin.userId];
//     }

//     if (admin.status) {
//       return admin.status;
//     }

//     return admin.approved ? "ACTIVE" : "PENDING";
//   };

//   const approveAdmin = (admin) => {
//     setStatusMap((prev) => ({
//       ...prev,
//       [admin.userId]: "ACTIVE",
//     }));

//     message.success({
//       content: `${admin.personName} approved successfully`,
//       className: "toast-success",
//     });
//   };

//   const rejectAdmin = (admin) => {
//     setStatusMap((prev) => ({
//       ...prev,
//       [admin.userId]: "REJECTED",
//     }));

//     message.success({
//       content: `${admin.personName} rejected`,
//       className: "toast-success",
//     });
//   };

//   // ---------------------------------------------------------
//   // FILTER ONLY DEPARTMENT ADMINS
//   // ---------------------------------------------------------
//   const departmentAdmins = admins.filter(
//     (admin) => admin.role === "DEPT_ADMIN"
//   );

//   // ---------------------------------------------------------
//   // UI
//   // ---------------------------------------------------------
//   return (
//     <div className="department-admin-page">

//       {/* ================= HEADER ================= */}
//       <div className="department-admin-header animate-in animate-in-d1">
//         <div>
//           <h2>Central Admin Management</h2>
//           <p>List of all Department Admins.</p>
//         </div>
//       </div>

//       {/* ================= TABLE ================= */}
//       <div className="department-admin-table">

//         {/* TABLE HEADER */}
//         <div className="table-heading">
//           <div>Name</div>
//           <div>Email</div>
//           <div>Department</div>
//           <div>Status</div>
//           <div>Actions</div>
//         </div>

//         {/* LOADING */}
//         {loading ? (
//           <div className="loading">
//             Loading...
//           </div>
//         ) : departmentAdmins.length === 0 ? (
//           /* NO DATA */
//           <div className="loading">
//             No Department Admins Found
//           </div>
//         ) : (
//           /* TABLE ROWS */
//           departmentAdmins.map((admin, i) => (
//             <div
//               className="table-row animate-in"
//               key={admin.userId}
//               style={{
//                 animationDelay: `${i * 0.05}s`,
//               }}
//             >

//               {/* NAME */}
//               <div className="name">
//                 <span className="name-icon">
//                   <UserOutlined />
//                 </span>

//                 <span>
//                   {admin.personName}
//                 </span>
//               </div>

//               {/* EMAIL */}
//               <div>
//                 {admin.email}
//               </div>

//               {/* DEPARTMENT */}
//               <div>
//                 {admin.deptName}
//               </div>

//               {/* STATUS */}
//               <div>
//                 <span
//                   className={`status-badge status-${resolveStatus(
//                     admin
//                   ).toLowerCase()}`}
//                 >
//                   {resolveStatus(admin) === "ACTIVE" ? (
//                     <CheckCircleOutlined />
//                   ) : resolveStatus(admin) === "REJECTED" ? (
//                     <CloseCircleOutlined />
//                   ) : (
//                     <UserOutlined />
//                   )}
//                   {resolveStatus(admin).charAt(0) +
//                     resolveStatus(admin).slice(1).toLowerCase()}
//                 </span>
//               </div>

//               {/* ACTIONS */}
//               <div className="actions">

//                 {/* VIEW */}
//                 <button
//                   className="view-btn"
//                   onClick={() => viewAdmin(admin)}
//                 >
//                   <EyeOutlined />
//                   View
//                 </button>

//                 {/* APPROVE / REJECT - frontend only */}
//                 {isCentralAdmin &&
//                   resolveStatus(admin) !== "ACTIVE" && (
//                     <button
//                       className="approve-approval-btn"
//                       onClick={() => approveAdmin(admin)}
//                     >
//                       <CheckCircleOutlined />
//                       Approve
//                     </button>
//                   )}

//                 {isCentralAdmin &&
//                   resolveStatus(admin) === "PENDING" && (
//                     <button
//                       className="reject-approval-btn"
//                       onClick={() => rejectAdmin(admin)}
//                     >
//                       <CloseCircleOutlined />
//                       Reject
//                     </button>
//                   )}

//                 {/* DELETE */}
//                 {isCentralAdmin && (
//                   <button
//                     className="delete-btn"
//                     onClick={() =>
//                       openDeleteModal(admin)
//                     }
//                   >
//                     <DeleteOutlined />
//                     Delete
//                   </button>
//                 )}
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* ================= DELETE MODAL ================= */}
//       <DeleteConfirmationModal
//         open={deleteModal.open}
//         title="Delete Department Admin?"
//         entityName={deleteModal.admin?.personName}
//         description="This action cannot be undone. This will permanently delete the department admin and remove all associated data."
//         details={
//           deleteModal.admin
//             ? [
//               {
//                 label: "Email",
//                 value: deleteModal.admin.email,
//               },
//               {
//                 label: "Department",
//                 value: deleteModal.admin.deptName,
//               },
//             ]
//             : []
//         }
//         deleteApi={`/api/users/${deleteModal.admin?.userId}`}
//         onSuccess={() => {
//           message.success({
//             content: "Admin deleted successfully",
//             className: "toast-success",
//           });

//           setDeleteModal({
//             open: false,
//             admin: null,
//           });

//           getDepartmentAdmins();
//         }}
//         onCancel={closeDeleteModal}
//       />
//     </div>
//   );
// };

// export default DepartmentAdminList;






//code changed by Dhanshree 1

// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { selectUser } from "../../store/slices/authSlice";

// import {
//   EyeOutlined,
//   DeleteOutlined,
//   UserOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
// } from "@ant-design/icons";

// import { message } from "antd";

// import api from "../../services/api";
// import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal/DeleteConfirmationModal";

// import "./DepartmentAdmin.css";


// const DepartmentAdminList = () => {
//   const navigate = useNavigate();

//   // =========================================================
//   // LOGGED-IN USER
//   // =========================================================

//   const loggedInUser = useSelector(selectUser) || {};

//   const isCentralAdmin =
//     loggedInUser.role === "CENTRAL_ADMIN";


//   // =========================================================
//   // STATES
//   // =========================================================

//   const [admins, setAdmins] = useState([]);

//   const [loading, setLoading] = useState(false);

//   const [statusLoading, setStatusLoading] = useState(null);


//   const [deleteModal, setDeleteModal] = useState({
//     open: false,
//     admin: null,
//   });


//   // =========================================================
//   // LOAD DEPARTMENT ADMINS
//   // =========================================================

//   useEffect(() => {
//     getDepartmentAdmins();
//   }, []);


//   const getDepartmentAdmins = async () => {
//     try {
//       setLoading(true);

//       const response = await api.get("/api/users");

//       console.log(
//         "GET /api/users response:",
//         response.data
//       );


//       if (response.data.success) {
//         setAdmins(response.data.data);
//       }

//     } catch (error) {

//       console.error(
//         "Error fetching Department Admins:",
//         error
//       );

//       message.error({
//         content: "Unable to fetch Department Admins",
//         className: "toast-error",
//       });

//     } finally {

//       setLoading(false);

//     }
//   };


//   // =========================================================
//   // VIEW ADMIN
//   // =========================================================

//   const viewAdmin = (admin) => {

//     navigate("/departmentAdminView", {
//       state: admin,
//     });

//   };


//   // =========================================================
//   // APPROVE ADMIN
//   // =========================================================

//   const approveAdmin = async (admin) => {

//     try {

//       setStatusLoading(admin.userId);


//       console.log(
//         "Approving user:",
//         admin.userId
//       );


//       await api.post(
//         `/api/users/${admin.userId}/approve`
//       );


//       message.success({
//         content:
//           `${admin.personName} approved successfully`,
//         className: "toast-success",
//       });


//       // Get updated status from backend
//       await getDepartmentAdmins();


//     } catch (error) {

//       console.error(
//         "Approve error:",
//         error
//       );


//       message.error({
//         content:
//           "Failed to approve Department Admin",
//         className: "toast-error",
//       });

//     } finally {

//       setStatusLoading(null);

//     }

//   };


//   // =========================================================
//   // REJECT ADMIN
//   // =========================================================

//   const rejectAdmin = async (admin) => {

//     try {

//       setStatusLoading(admin.userId);


//       console.log(
//         "Rejecting user:",
//         admin.userId
//       );


//       await api.post(
//         `/api/users/${admin.userId}/reject`
//       );


//       message.success({
//         content:
//           `${admin.personName} rejected successfully`,
//         className: "toast-success",
//       });


//       // Get updated status from backend
//       await getDepartmentAdmins();


//     } catch (error) {

//       console.error(
//         "Reject error:",
//         error
//       );


//       message.error({
//         content:
//           "Failed to reject Department Admin",
//         className: "toast-error",
//       });

//     } finally {

//       setStatusLoading(null);

//     }

//   };


//   // =========================================================
//   // DELETE ADMIN
//   // =========================================================

//   const openDeleteModal = (admin) => {

//     setDeleteModal({
//       open: true,
//       admin: admin,
//     });

//   };


//   const closeDeleteModal = () => {

//     setDeleteModal({
//       open: false,
//       admin: null,
//     });

//   };


//   // =========================================================
//   // RESOLVE STATUS
//   // =========================================================

//   const resolveStatus = (admin) => {

//     if (!admin.status) {
//       return "PENDING";
//     }


//     const status =
//       String(admin.status).toUpperCase();


//     if (status === "APPROVED") {
//       return "APPROVED";
//     }


//     if (status === "REJECTED") {
//       return "REJECTED";
//     }


//     if (status === "PENDING") {
//       return "PENDING";
//     }


//     return "PENDING";
//   };


//   // =========================================================
//   // FILTER DEPARTMENT ADMINS
//   // =========================================================

//   const departmentAdmins = admins.filter(
//     (admin) => admin.role === "DEPT_ADMIN"
//   );


//   // =========================================================
//   // UI
//   // =========================================================

//   return (

//     <div className="department-admin-page">


//       {/* =====================================================
//           HEADER
//       ===================================================== */}

//       <div className="department-admin-header animate-in animate-in-d1">

//         <div>

//           <h2>
//             Central Admin Management
//           </h2>

//           <p>
//             List of all Department Admins.
//           </p>

//         </div>

//       </div>


//       {/* =====================================================
//           TABLE
//       ===================================================== */}

//       <div className="department-admin-table">


//         {/* ===================================================
//             TABLE HEADER
//         =================================================== */}

//         <div className="table-heading">

//           <div>
//             Name
//           </div>

//           <div>
//             Email
//           </div>

//           <div>
//             Department
//           </div>

//           <div>
//             Status
//           </div>

//           <div>
//             Action
//           </div>

//           <div>
//             Approval
//           </div>

//         </div>


//         {/* ===================================================
//             LOADING
//         =================================================== */}

//         {loading ? (

//           <div className="loading">
//             Loading...
//           </div>

//         ) : departmentAdmins.length === 0 ? (

//           <div className="loading">
//             No Department Admins Found
//           </div>

//         ) : (

//           departmentAdmins.map((admin, index) => {

//             const currentStatus =
//               resolveStatus(admin);


//             const isUpdating =
//               statusLoading === admin.userId;


//             return (

//               <div
//                 className="table-row animate-in"
//                 key={admin.userId}
//                 style={{
//                   animationDelay:
//                     `${index * 0.05}s`,
//                 }}
//               >


//                 {/* =================================================
//                     NAME
//                 ================================================= */}

//                 <div className="name">

//                   <span className="name-icon">

//                     <UserOutlined />

//                   </span>


//                   <span className="name-text">

//                     {admin.personName}

//                   </span>

//                 </div>


//                 {/* =================================================
//                     EMAIL
//                 ================================================= */}

//                 <div
//                   className="email-column"
//                   title={admin.email}
//                 >

//                   {admin.email}

//                 </div>


//                 {/* =================================================
//                     DEPARTMENT
//                 ================================================= */}

//                 <div
//                   className="department-column"
//                   title={admin.deptName}
//                 >

//                   {admin.deptName}

//                 </div>


//                 {/* =================================================
//                     STATUS
//                 ================================================= */}

//                 <div className="status-column">


//                   {currentStatus === "APPROVED" && (

//                     <span className="status-badge status-approved">

//                       <CheckCircleOutlined />

//                       Approved

//                     </span>

//                   )}


//                   {currentStatus === "REJECTED" && (

//                     <span className="status-badge status-rejected">

//                       <CloseCircleOutlined />

//                       Rejected

//                     </span>

//                   )}


//                   {currentStatus === "PENDING" && (

//                     <span className="status-badge status-pending">

//                       <UserOutlined />

//                       Pending

//                     </span>

//                   )}

//                 </div>


//                 {/* =================================================
//                     ACTIONS - VIEW / DELETE
//                 ================================================= */}

//                 <div className="actions">

//                   {/* VIEW (icon only) */}

//                   <button
//                     type="button"
//                     className="action-btn icon-btn view-btn"
//                     aria-label="View"
//                     title="View"
//                     onClick={() =>
//                       viewAdmin(admin)
//                     }
//                   >

//                     <EyeOutlined />

//                   </button>

//                   {/* DELETE (icon only) */}

//                   {isCentralAdmin && (

//                     <button
//                       type="button"
//                       className="action-btn icon-btn delete-btn"
//                       aria-label="Delete"
//                       title="Delete"
//                       onClick={() =>
//                         openDeleteModal(admin)
//                       }
//                     >

//                       <DeleteOutlined />

//                     </button>

//                   )}

//                 </div>


//                 {/* =================================================
//                     APPROVAL - APPROVE / REJECT
//                 ================================================= */}

//                 <div className="approval-actions">

//                   {/* APPROVE */}

//                   {isCentralAdmin &&
//                     currentStatus !== "APPROVED" && (

//                       <button
//                         type="button"
//                         className="action-btn approve-approval-btn"
//                         disabled={isUpdating}
//                         onClick={() =>
//                           approveAdmin(admin)
//                         }
//                       >

//                         <CheckCircleOutlined />

//                         <span>
//                           {isUpdating
//                             ? "Updating..."
//                             : "Approve"}
//                         </span>

//                       </button>

//                     )}

//                   {/* REJECT */}

//                   {isCentralAdmin &&
//                     currentStatus !== "REJECTED" && (

//                       <button
//                         type="button"
//                         className="action-btn reject-approval-btn"
//                         disabled={isUpdating}
//                         onClick={() =>
//                           rejectAdmin(admin)
//                         }
//                       >

//                         <CloseCircleOutlined />

//                         <span>
//                           {isUpdating
//                             ? "Updating..."
//                             : "Reject"}
//                         </span>

//                       </button>

//                     )}

//                 </div>

//               </div>

//             );

//           })

//         )}

//       </div>


//       {/* =====================================================
//           DELETE CONFIRMATION MODAL
//       ===================================================== */}

//       <DeleteConfirmationModal

//         open={deleteModal.open}

//         title="Delete Department Admin?"

//         entityName={
//           deleteModal.admin?.personName
//         }

//         description={
//           "This action cannot be undone. This will permanently delete the department admin and remove all associated data."
//         }

//         details={
//           deleteModal.admin
//             ? [
//               {
//                 label: "Email",
//                 value:
//                   deleteModal.admin.email,
//               },
//               {
//                 label: "Department",
//                 value:
//                   deleteModal.admin.deptName,
//               },
//             ]
//             : []
//         }

//         deleteApi={
//           `/api/users/${deleteModal.admin?.userId}`
//         }

//         onSuccess={() => {

//           message.success({
//             content:
//               "Admin deleted successfully",
//             className: "toast-success",
//           });


//           setDeleteModal({
//             open: false,
//             admin: null,
//           });


//           getDepartmentAdmins();

//         }}

//         onCancel={
//           closeDeleteModal
//         }

//       />

//     </div>

//   );
// };


// export default DepartmentAdminList;



//code changed by Dhanshree 2

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";

import {
  EyeOutlined,
  DeleteOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import { message, Modal } from "antd";

import api from "../../services/api";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal/DeleteConfirmationModal";
import RegistrationSuccessModal from "../../components/modals/RegistrationSuccessModal/RegistrationSuccessModal";

import "./DepartmentAdmin.css";

const DepartmentAdminList = () => {
  const navigate = useNavigate();

  const loggedInUser = useSelector(selectUser) || {};

  const isCentralAdmin =
    loggedInUser.role === "CENTRAL_ADMIN";

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);

  // Stores which user is currently being approved/rejected
  const [statusLoading, setStatusLoading] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    admin: null,
  });

  // View modal state
  const [viewModal, setViewModal] = useState({
    open: false,
    admin: null,
  });

  // Generic success notification modal
  const [notification, setNotification] = useState({ open: false, title: "", text: "" });

  // Active filter tab: ALL | PENDING | APPROVED | REJECTED
  const [activeFilter, setActiveFilter] = useState("ALL");


  // =========================================================
  // GET ALL USERS
  // =========================================================

  useEffect(() => {
    getDepartmentAdmins();
  }, []);


  const getDepartmentAdmins = async () => {
    try {
      setLoading(true);

      const response = await api.get("/api/users");

      if (response.data.success) {
        setAdmins(response.data.data || []);
      }

    } catch (err) {
      console.error(
        "Error fetching Department Admins:",
        err
      );

      message.error({
        content: "Unable to fetch Department Admins",
        className: "toast-error",
      });

    } finally {
      setLoading(false);
    }
  };


  // =========================================================
  // VIEW ADMIN (opens details modal)
  // =========================================================

  const viewAdmin = (admin) => {
    setViewModal({
      open: true,
      admin: admin,
    });
  };

  const closeViewModal = () => {
    setViewModal({
      open: false,
      admin: null,
    });
  };


  // =========================================================
  // APPROVE ADMIN
  // API:
  // POST /api/users/{userId}/approve
  // =========================================================

  const approveAdmin = async (admin) => {
    try {
      setStatusLoading(admin.userId);

      const response = await api.post(
        `/api/users/${admin.userId}/approve`
      );

      if (response.data.success) {
        message.success({
          content: `${admin.personName} approved successfully`,
          className: "toast-success",
        });

        // Get latest status from backend
        await getDepartmentAdmins();
      } else {
        message.error({
          content:
            response.data.message ||
            "Unable to approve Department Admin",
          className: "toast-error",
        });
      }

    } catch (err) {
      console.error(
        "Approve Department Admin error:",
        err
      );

      message.error({
        content:
          err.response?.data?.message ||
          "Failed to approve Department Admin",
        className: "toast-error",
      });

    } finally {
      setStatusLoading(null);
    }
  };


  // =========================================================
  // REJECT ADMIN
  // API:
  // POST /api/users/{userId}/reject
  // =========================================================

  const rejectAdmin = async (admin) => {
    try {
      setStatusLoading(admin.userId);

      const response = await api.post(
        `/api/users/${admin.userId}/reject`
      );

      if (response.data.success) {
        message.success({
          content: `${admin.personName} rejected successfully`,
          className: "toast-success",
        });

        // Get latest status from backend
        await getDepartmentAdmins();
      } else {
        message.error({
          content:
            response.data.message ||
            "Unable to reject Department Admin",
          className: "toast-error",
        });
      }

    } catch (err) {
      console.error(
        "Reject Department Admin error:",
        err
      );

      message.error({
        content:
          err.response?.data?.message ||
          "Failed to reject Department Admin",
        className: "toast-error",
      });

    } finally {
      setStatusLoading(null);
    }
  };


  // =========================================================
  // DELETE ADMIN
  // =========================================================

  const openDeleteModal = (admin) => {
    setDeleteModal({
      open: true,
      admin: admin,
    });
  };


  const closeDeleteModal = () => {
    setDeleteModal({
      open: false,
      admin: null,
    });
  };


  // =========================================================
  // GET STATUS FROM BACKEND
  // =========================================================

  const getStatus = (admin) => {

    // Backend returns accountStatus
    const status = admin.accountStatus;

    if (!status) {
      return "PENDING";
    }

    const normalized = status.toUpperCase();

    // Treat ACTIVE as APPROVED for display purposes
    if (normalized === "ACTIVE") {
      return "APPROVED";
    }

    // Treat INACTIVE as REJECTED for display purposes
    if (normalized === "INACTIVE") {
      return "REJECTED";
    }

    return normalized;
  };


  // =========================================================
  // FILTER DEPARTMENT ADMINS
  // =========================================================

  const departmentAdmins = admins.filter(
    (admin) => admin.role === "DEPT_ADMIN"
  );

  const adminCounts = ["PENDING", "APPROVED", "REJECTED"].reduce(
    (acc, status) => {
      acc[status] = departmentAdmins.filter(
        (a) => getStatus(a) === status
      ).length;
      return acc;
    },
    {}
  );

  const statusPriority = {
    PENDING: 0,
    APPROVED: 1,
    REJECTED: 2,
  };

  const filteredAdmins =
    activeFilter === "ALL"
      ? departmentAdmins
      : departmentAdmins.filter(
          (a) => getStatus(a) === activeFilter
        );

  const sortedAdmins = [...filteredAdmins].sort((a, b) => {
    const statusDiff =
      (statusPriority[getStatus(a)] ?? 3) -
      (statusPriority[getStatus(b)] ?? 3);

    if (statusDiff !== 0) return statusDiff;

    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    return bTime - aTime;
  });


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="department-admin-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="department-admin-header animate-in animate-in-d1">

        <div>
          <h2>Users Management</h2>

          <p>
            List of all Department Admins with their approval status.
          </p>
        </div>

      </div>


      {/* =====================================================
          FILTER TABS
      ===================================================== */}

      <div className="user-filter-tabs animate-in animate-in-d1">

        {[
          { key: "ALL", label: "All Users" },
          { key: "PENDING", label: "Pending Approvals" },
          { key: "APPROVED", label: "Approved" },
          { key: "REJECTED", label: "Rejected" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`user-filter-tab ${
              activeFilter === tab.key ? "active" : ""
            }`}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}

            {tab.key !== "ALL" && (
              <span className="filter-count">
                {adminCounts[tab.key] || 0}
              </span>
            )}

          </button>
        ))}

      </div>


      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="department-admin-table">

        {/* TABLE HEADER */}

        <div className="table-heading">

          <div>Name</div>

          <div>Email</div>

          <div>Department</div>

          <div>Status</div>

          <div>Approval</div>

          <div>Action</div>

        </div>


        {/* LOADING */}

        {loading ? (

          <div className="loading">
            Loading...
          </div>

        ) : sortedAdmins.length === 0 ? (

          <div className="loading">
            No Department Admins Found
          </div>

        ) : (

          sortedAdmins.map((admin, i) => {

            const status = getStatus(admin);

            const isUpdating =
              statusLoading === admin.userId;

            const isPending = status === "PENDING";

            return (

              <div
                className="table-row animate-in"
                key={admin.userId}
                style={{
                  animationDelay:
                    `${i * 0.05}s`,
                }}
              >

                {/* =================================================
                    NAME
                ================================================= */}

                <div className="name">

                  <span className="name-icon">
                    <UserOutlined />
                  </span>

                  <span
                    className="name-text"
                    title={admin.personName}
                  >
                    {admin.personName}
                  </span>

                </div>


                {/* =================================================
                    EMAIL
                ================================================= */}

                <div
                  className="email-column"
                  title={admin.email}
                >
                  {admin.email}
                </div>


                {/* =================================================
                    DEPARTMENT
                ================================================= */}

                <div
                  className="department-column"
                  title={admin.deptName}
                >
                  {admin.deptName}
                </div>


                {/* =================================================
                    STATUS
                ================================================= */}

                <div className="status-column">

                  {status === "APPROVED" && (

                    <span className="status-badge status-approved">

                      <CheckCircleOutlined />

                      Approved

                    </span>

                  )}


                  {status === "PENDING" && (

                    <span className="status-badge status-pending">

                      <UserOutlined />

                      Pending

                    </span>

                  )}


                  {status === "REJECTED" && (

                    <span className="status-badge status-rejected">

                      <CloseCircleOutlined />

                      Rejected

                    </span>

                  )}

                </div>


                {/* =================================================
                    APPROVAL - APPROVE / REJECT
                    (Central Admin only, and only for pending users)
                ================================================= */}

                <div className="approval-actions">

                  {isCentralAdmin && isPending && (

                    <>

                      {/* APPROVE BUTTON */}

                      <button
                        className="action-btn approve-approval-btn"
                        disabled={isUpdating}
                        onClick={() =>
                          approveAdmin(admin)
                        }
                      >

                        <CheckCircleOutlined />

                        {isUpdating
                          ? "Updating..."
                          : "Approve"}

                      </button>

                      {/* REJECT BUTTON */}

                      <button
                        className="action-btn reject-approval-btn"
                        disabled={isUpdating}
                        onClick={() =>
                          rejectAdmin(admin)
                        }
                      >

                        <CloseCircleOutlined />

                        {isUpdating
                          ? "Updating..."
                          : "Reject"}

                      </button>

                    </>

                  )}

                  {!isPending && (
                    <span className="approval-indicator">
                      {status === "APPROVED" ? (
                        <CheckCircleOutlined className="approval-indicator-check" />
                      ) : (
                        <CloseCircleOutlined className="approval-indicator-close" />
                      )}
                    </span>
                  )}

                </div>


                {/* =================================================
                    ACTION - VIEW / DELETE (icons last)
                ================================================= */}

                <div className="actions">

                  {/* VIEW (icon only) */}

                  <button
                    className="action-btn icon-btn view-btn"
                    aria-label="View"
                    title="View"
                    onClick={() =>
                      viewAdmin(admin)
                    }
                  >

                    <EyeOutlined />

                  </button>

                  {/* DELETE (Central Admin only) */}

                  {isCentralAdmin && (

                    <button
                      className="action-btn icon-btn delete-btn"
                      aria-label="Delete"
                      title="Delete"
                      onClick={() =>
                        openDeleteModal(admin)
                      }
                    >

                      <DeleteOutlined />

                    </button>

                  )}

                </div>

              </div>

            );

          })

        )}

      </div>


      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      <DeleteConfirmationModal

        open={deleteModal.open}

        title="Delete Department Admin?"

        entityName={
          deleteModal.admin?.personName
        }

        description={
          "This action cannot be undone. " +
          "This will permanently delete the " +
          "department admin and remove all " +
          "associated data."
        }

        details={
          deleteModal.admin
            ? [
              {
                label: "Email",
                value:
                  deleteModal.admin.email,
              },
              {
                label: "Department",
                value:
                  deleteModal.admin.deptName,
              },
            ]
            : []
        }

        deleteApi={
          `/api/users/${deleteModal.admin?.userId}`
        }

        onSuccess={() => {

          setDeleteModal({
            open: false,
            admin: null,
          });

          setNotification({
            open: true,
            title: "Admin Deleted Successfully!",
            text: `${deleteModal.admin?.personName || "The department admin"} has been deleted successfully.`,
          });

          getDepartmentAdmins();

        }}

        onCancel={closeDeleteModal}

      />

      {/* =====================================================
          SUCCESS NOTIFICATION MODAL
      ===================================================== */}

      <RegistrationSuccessModal
        open={notification.open}
        onClose={() => setNotification({ open: false, title: "", text: "" })}
        title={notification.title}
        text={notification.text}
        buttonText="Done"
      />

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      <Modal
        open={viewModal.open}
        onCancel={closeViewModal}
        footer={null}
        width={560}
        centered
        destroyOnClose
        className="admin-view-modal"
      >
        <div className="detail-card admin-view-card">

          <h2>Department Admin Details</h2>

          <div className="detail-body">

            <div className="detail-row">
              <div className="detail-icon"><UserOutlined /></div>
              <div className="detail-content">
                <div className="detail-label">Name</div>
                <div className="detail-value">{viewModal.admin?.personName || ""}</div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon"><MailOutlined /></div>
              <div className="detail-content">
                <div className="detail-label">Email</div>
                <div className="detail-value">{viewModal.admin?.email || ""}</div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon"><PhoneOutlined /></div>
              <div className="detail-content">
                <div className="detail-label">Phone</div>
                <div className="detail-value">{viewModal.admin?.phoneNo || "\u2014"}</div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon"><UserOutlined /></div>
              <div className="detail-content">
                <div className="detail-label">Department</div>
                <div className="detail-value">{viewModal.admin?.deptName || ""}</div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon"><SafetyCertificateOutlined /></div>
              <div className="detail-content">
                <div className="detail-label">Role</div>
                <div className="detail-value"><span className="viewer-role-badge">{viewModal.admin?.role || ""}</span></div>
              </div>
            </div>

          </div>

        </div>
      </Modal>

    </div>
  );
};


export default DepartmentAdminList;
