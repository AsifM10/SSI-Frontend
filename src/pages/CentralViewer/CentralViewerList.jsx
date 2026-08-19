// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// import {
//     EyeOutlined,
//     DeleteOutlined,
//     UserOutlined,
// } from "@ant-design/icons";

// import { message, Popconfirm } from "antd";

// import api from "../../services/api";

// import "./DepartmentAdmin.css";

// const DepartmentAdminList = () => {
//     const navigate = useNavigate();

//     const [admins, setAdmins] = useState([]);

//     const [loading, setLoading] = useState(false);

//     useEffect(() => {
//         getDepartmentAdmins();
//     }, []);

//     const getDepartmentAdmins = async () => {

//         try {

//             const token = localStorage.getItem("token");


//             setLoading(true);

//             const response = await api.get(`/api/users`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             });
//             console.log("dept admin list", response.data);
//             if (response.data.success) {
//                 setAdmins(response.data.data);
//             }

//         } catch (err) {

//             console.log(err);

//             message.error("Unable to fetch Department Admins");

//         } finally {

//             setLoading(false);

//         }

//     };



//     const deleteAdmin = async (id) => {

//         try {

//             let response = await api.delete(`/api/users/${id}`);
//             console.log("delete response : ", response.data);
//             if (response.data) {
//                 message.success("Admin Deleted");
//             }
//             getDepartmentAdmins();
//             // navigate("/users");

//         } catch (error) {
//             message.error("Delete Failed : ", error);
//             console.log("Delete failed : ", error);
//         }

//     };


//     const viewAdmin = (admin) => {

//         navigate("/departmentAdminView", {

//             state: admin,

//         });

//     };


//     return (

//         <div className="department-admin-page">

//             <div className="department-admin-header">

//                 <h2>Central Admin Management</h2>

//                 <p>

//                     List of all Department Admins.

//                 </p>

//             </div>

//             <div className="department-admin-table">

//                 <div className="table-heading">

//                     <div>Name</div>

//                     <div>Email</div>

//                     <div>Department</div>

//                     <div>Action</div>

//                 </div>

//                 {

//                     loading ?

//                         (

//                             <div className="loading">

//                                 Loading....

//                             </div>

//                         )

//                         :

//                         admins.length === 0 ?

//                             (

//                                 <div className="loading">

//                                     No Department Viewer Found

//                                 </div>

//                             )

//                             :
//                             // admins.map((admin) => (
//                             admins
//                                 .filter((admin) => admin.role === "DEPT_ADMIN")
//                                 .map((admin) => (

//                                     <div
//                                         className="table-row"
//                                         key={admin.userId}
//                                     >

//                                         <div className="name">

//                                             <UserOutlined />

//                                             <span>

//                                                 {admin.personName}

//                                             </span>

//                                         </div>

//                                         <div>

//                                             {admin.email}

//                                         </div>

//                                         <div>

//                                             {admin.deptName}

//                                         </div>

//                                         <div className="actions">

//                                             <button

//                                                 className="view-btn"

//                                                 onClick={() => viewAdmin(admin)}

//                                             >

//                                                 <EyeOutlined />

//                                                 View

//                                             </button>

//                                             <Popconfirm

//                                                 title="Delete Department Admin?"

//                                                 okText="Delete"

//                                                 cancelText="Cancel"

//                                                 onConfirm={() => deleteAdmin(admin.userId)}

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

// export default DepartmentAdminList;
