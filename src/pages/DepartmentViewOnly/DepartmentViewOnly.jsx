// import { useEffect, useState } from "react";
// import { UserOutlined } from "@ant-design/icons";
// import { message } from "antd";
// import { useSelector } from "react-redux";
// import { selectUser } from "../../store/slices/authSlice";
// import api from "../../services/api";
// import "./DepartmentViewOnly.css";

// const DepartmentViewOnly = () => {

//     const loggedInUser = useSelector(selectUser) || {};

//     const [viewers, setViewers] = useState([]);
//     const [loading, setLoading] = useState(false);

//     useEffect(() => {
//         getDepartmentViewers();
//     }, []);

//     const getDepartmentViewers = async () => {

//         try {

//             setLoading(true);

//             const response = await api.get(
//                 `/api/users/department/${loggedInUser.deptId}`
//             );

//             if (response.data.success) {

//                 const departmentViewers = response.data.data.filter(
//                     (user) => user.role === "DEPT_VIEWER"
//                 );

//                 setViewers(departmentViewers);
//             }

//         } catch (error) {

//             console.log(error);

//             message.error("Unable to fetch Department Viewers");

//         } finally {

//             setLoading(false);

//         }

//     };

//     return (

//         <div className="department-view-page">

//             <div className="department-view-header">

//                 <h2>Department Viewers</h2>

//                 <p>

//                     Department :
//                     <strong> {loggedInUser.deptName}</strong>

//                 </p>

//             </div>

//             <div className="department-view-table">

//                 <div className="table-heading">

//                     <div>Name</div>

//                     <div>Email</div>

//                     <div>Designation</div>

//                     <div>Phone</div>

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

//                                     No Department Viewers Found

//                                 </div>

//                             )

//                             :

//                             viewers.map((viewer) => (

//                                 <div
//                                     className="table-row"
//                                     key={viewer.userId}
//                                 >

//                                     <div className="name">

//                                         <UserOutlined />

//                                         <span>{viewer.personName}</span>

//                                     </div>

//                                     <div>{viewer.email}</div>

//                                     <div>{viewer.designation}</div>

//                                     <div>{viewer.phoneNo}</div>

//                                 </div>

//                             ))

//                 }

//             </div>

//         </div>

//     );

// };

// export default DepartmentViewOnly;



//new code for view -


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppstoreOutlined } from "@ant-design/icons";
import { message } from "antd";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import api from "../../services/api";
import "./DepartmentViewOnly.css";

const DepartmentViewOnly = () => {

    const navigate = useNavigate();

    const loggedInUser = useSelector(selectUser);

    const [projects, setProjects] = useState([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getProjects();
    }, []);

    const getProjects = async () => {

        try {

            setLoading(true);
            const token = localStorage.getItem("token");

            // console.log("logged in user", loggedInUser);


            const response = await api.get(
                `/api/projects/department/${loggedInUser.deptId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            // console.log("userLogggggg", response.data);

            if (response.data.success) {

                setProjects(response.data.data);

            }

        } catch (error) {


            message.error("Unable to fetch Projects");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="department-view-page">

            <div className="department-view-header">

                <h2>{loggedInUser.deptName} Department</h2>

                <p>

                    Projects of your Department

                </p>

            </div>

            <div className="department-view-table">

                <div className="table-heading">

                    <div>Project</div>

                    <div>Machines</div>

                    <div>Status</div>

                    <div>Action</div>

                </div>

                {

                    loading ?

                        <div className="loading">

                            Loading...

                        </div>

                        :

                        projects.length === 0 ?

                            <div className="loading">

                                No Projects Found

                            </div>

                            :

                            projects.map(project => (

                                <div
                                    className="table-row"
                                    key={project.projectId}
                                >

                                    <div className="name">

                                        <AppstoreOutlined />

                                        <span>

                                            {project.projectName}

                                        </span>

                                    </div>

                                    <div>

                                        {project.machineCount}

                                    </div>

                                    <div>

                                        {project.status}

                                    </div>

                                    <div>

                                        <button
                                            className="view-btn"
                                            onClick={() =>
                                                navigate(
                                                    `/monitoring/${project.projectId}`
                                                )
                                            }
                                        >

                                            View

                                        </button>

                                    </div>

                                </div>

                            ))

                }

            </div>

        </div>

    );

};

export default DepartmentViewOnly;