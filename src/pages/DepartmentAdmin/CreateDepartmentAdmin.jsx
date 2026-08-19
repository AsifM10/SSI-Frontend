import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    LockOutlined,
    SafetyCertificateOutlined,
    ArrowLeftOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import api from "../../services/api";
import "./DepartmentAdmin.css";

const CreateDepartmentAdmin = () => {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [departments, setDepartments] = useState([]);

    const [admin, setAdmin] = useState({
        personName: "",
        email: "",
        phoneNo: "",
        designation: "",
        password: "",
        role: "DEPT_ADMIN",
        deptId: "",
    });

    useEffect(() => {
        getDepartments();
    }, []);

    const getDepartments = async () => {

        try {

            const response = await api.get("/api/departments");

            if (response.data.success) {
                setDepartments(response.data.data);
            }

        } catch (error) {

        }

    };

    const registerAdmin = async (e) => {

        e.preventDefault();

        try {

            setLoading(true);

            const response = await api.post("/api/users", admin);

            if (response.data.success) {

                message.success("Department Admin Created Successfully");

                navigate("/users");

            }

        } catch (error) {

            message.error("Registration Failed");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="register-viewer-page">

            <button
                className="back-btn"
                onClick={() => navigate(-1)}
            >
                <ArrowLeftOutlined />
                Back
            </button>

            <div className="viewer-card">

                <h2>Create Department Admin</h2>

                <form onSubmit={registerAdmin}>

                    <div className="input-box">

                        <UserOutlined />

                        <input
                            placeholder="Full Name"
                            value={admin.personName}
                            onChange={(e) =>
                                setAdmin({
                                    ...admin,
                                    personName: e.target.value,
                                })
                            }
                            required
                        />

                    </div>

                    <div className="input-box">

                        <MailOutlined />

                        <input
                            type="email"
                            placeholder="Email"
                            value={admin.email}
                            onChange={(e) =>
                                setAdmin({
                                    ...admin,
                                    email: e.target.value,
                                })
                            }
                            required
                        />

                    </div>

                    <div className="input-box">

                        <PhoneOutlined />

                        <input
                            placeholder="Phone Number"
                            value={admin.phoneNo}
                            onChange={(e) =>
                                setAdmin({
                                    ...admin,
                                    phoneNo: e.target.value,
                                })
                            }
                            required
                        />

                    </div>

                    <div className="input-box">

                        <UserOutlined />

                        <input
                            placeholder="Designation"
                            value={admin.designation}
                            onChange={(e) =>
                                setAdmin({
                                    ...admin,
                                    designation: e.target.value,
                                })
                            }
                        />

                    </div>

                    <div className="input-box">

                        <LockOutlined />

                        <input
                            type="password"
                            placeholder="Password"
                            value={admin.password}
                            onChange={(e) =>
                                setAdmin({
                                    ...admin,
                                    password: e.target.value,
                                })
                            }
                            required
                        />

                    </div>

                    {/* Department */}

                    <div className="input-box">

                        <select
                            value={admin.deptId}
                            onChange={(e) =>
                                setAdmin({
                                    ...admin,
                                    deptId: Number(e.target.value),
                                })
                            }
                            required
                        >

                            <option value="">
                                Select Department
                            </option>

                            {

                                departments.map((dept) => (

                                    <option
                                        key={dept.deptId}
                                        value={dept.deptId}
                                    >

                                        {dept.deptName}

                                    </option>

                                ))

                            }

                        </select>

                    </div>

                    {/* Role */}

                    <div className="input-box">

                        <SafetyCertificateOutlined />

                        <input
                            value="DEPT_ADMIN"
                            disabled
                        />

                    </div>

                    <button
                        className="register-btn"
                        disabled={loading}
                    >

                        {loading ? "Creating..." : "Create Department Admin"}

                    </button>

                </form>

            </div>

        </div>

    );

};

export default CreateDepartmentAdmin;