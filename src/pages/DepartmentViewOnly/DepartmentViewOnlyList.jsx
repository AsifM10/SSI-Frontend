// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { selectUser } from "../../store/slices/authSlice";
// import {
//     UserOutlined,
//     EyeOutlined,
//     DeleteOutlined,
//     PlusOutlined,
// } from "@ant-design/icons";

// import { Popconfirm, message } from "antd";

// import api from "../../services/api";

// import "./DepartmentViewer.css";

// const DepartmentViewerList = () => {

//     const navigate = useNavigate();

//     const user = useSelector(selectUser) || {};

//     const [viewers, setViewers] = useState([]);

//     const [loading, setLoading] = useState(false);

//     useEffect(() => {

//         getDepartmentViewers();

//     }, []);

//     const getDepartmentViewers = async () => {

//         try {

//             setLoading(true);

//             const token = localStorage.getItem("token");

//             const response = await api.get(`/api/users/department/${user.deptId}`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             });

//             if (response.data.success) {

//                 setViewers(response.data.data);

//             }

//         } catch (err) {

//             console.log(err);

//             message.error("Unable to fetch Department Viewers");

//         } finally {

//             setLoading(false);

//         }

//     };

//     const deleteViewer = async (id) => {

//         try {

//             let response = await api.delete(`/api/users/${id}`);
//             console.log("delete response : ", response.data);
//             if (response.data) {
//                 message.success("Viewer Deleted");
//             }
//             getDepartmentViewers();

//         } catch {

//             message.error("Delete Failed");

//         }

//     };

//     const createDeptViewer = () => {
//         navigate("/createDepartmentViewer");
//     };

//     const viewViewer = (viewer) => {

//         navigate("/departmentViewerView", {

//             state: viewer,

//         });

//     };

//     return (

//         <div className="viewer-page">

//             <div className="viewer-header">

//                 <div>

//                     <h2>Department Admin Management</h2>

//                     <p>

//                         List of all Department Viewers.

//                         <strong> {user.departmentName}</strong>

//                     </p>

//                 </div>
//                 <button
//                     style={{
//                         background: "green",
//                         color: "white",
//                         padding: "10px 20px",
//                         border: "none",
//                         borderRadius: "5px",
//                         cursor: "pointer",
//                     }}
//                     onClick={() => createDeptViewer()}
//                 >
//                     Create Viewer
//                 </button>

//             </div>

//             <div className="viewer-table">

//                 <div className="viewer-heading">

//                     <div>Name</div>

//                     <div>Email</div>

//                     <div>Role</div>

//                     <div>Action</div>

//                 </div>

//                 {

//                     loading ?

//                         (

//                             <div className="loading">

//                                 Loading...

//                             </div>

//                         )

//                         :

//                         viewers.length === 0 ?

//                             (

//                                 <div className="loading">

//                                     No Department Viewers

//                                 </div>

//                             )

//                             :

//                             // viewers.map((viewer) => (
//                             viewers
//                                 .filter((viewer) => viewer.role === "DEPT_VIEWER")
//                                 .map((viewer) => (

//                                     <div

//                                         className="viewer-row"

//                                         key={viewer.userId}

//                                     >

//                                         <div className="viewer-name">

//                                             <UserOutlined />

//                                             {viewer.personName}

//                                         </div>

//                                         <div>

//                                             {viewer.email}

//                                         </div>

//                                         <div>

//                                             {viewer.role}

//                                         </div>

//                                         <div className="viewer-actions">

//                                             <button

//                                                 className="view-btn"

//                                                 onClick={() =>
//                                                     viewViewer(viewer)
//                                                 }

//                                             >

//                                                 <EyeOutlined />

//                                                 View

//                                             </button>

//                                             <Popconfirm

//                                                 title="Delete Viewer?"

//                                                 onConfirm={() =>
//                                                     deleteViewer(viewer.userId)
//                                                 }

//                                             >

//                                                 <button className="delete-btn">

//                                                     <DeleteOutlined />

//                                                     Delete

//                                                 </button>

//                                             </Popconfirm>

//                                         </div>

//                                     </div>

//                                 ))

//                 }

//             </div>

//         </div>

//     );

// };

// export default DepartmentViewerList;


