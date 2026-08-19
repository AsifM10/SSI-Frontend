import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
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
import "./DepartmentViewer.css";

const CreateDepartmentViewer = () => {

  const navigate = useNavigate();

  const loggedInUser = useSelector(selectUser) || {};

  const [loading, setLoading] = useState(false);

  const [viewer, setViewer] = useState({

    personName: "",

    email: "",

    phoneNo: "",

    designation: "",

    password: "",

    role: "DEPT_VIEWER",

    deptId: loggedInUser.deptId,

  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!viewer.personName || viewer.personName.trim().length < 2) {
      errs.personName = "Name must be at least 2 characters";
    }
    if (!viewer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(viewer.email)) {
      errs.email = "Enter a valid email address";
    }
    if (viewer.phoneNo && !/^(\+91)?[6-9][0-9]{9}$/.test(viewer.phoneNo)) {
      errs.phoneNo = "Enter a valid 10-digit Indian phone number";
    }
    if (!viewer.password || viewer.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const registerViewer = async (e) => {

    e.preventDefault();
    if (!validate()) return;

    try {

      setLoading(true);

      const response = await api.post("/api/users", {...viewer, phoneNo: viewer.phoneNo || undefined}
      );

      if (response.data) {

        message.success("Department Viewer Created Successfully");

        navigate("/users");

      }

    } catch (err) {

      message.error(err.response?.data?.message || "Registration Failed");

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

        <h2>Create Department Viewer</h2>

        <form onSubmit={registerViewer}>

          <div className={`input-box ${errors.personName ? "input-error" : ""}`}>

            <UserOutlined />

            <input
              placeholder="Full Name *"
              value={viewer.personName}
              onChange={(e) =>
                setViewer({
                  ...viewer,
                  personName: e.target.value,
                })
              }
            />
            {errors.personName && <div className="field-error">{errors.personName}</div>}

          </div>

          <div className={`input-box ${errors.email ? "input-error" : ""}`}>

            <MailOutlined />

            <input
              type="email"
              placeholder="Email *"
              value={viewer.email}
              onChange={(e) =>
                setViewer({
                  ...viewer,
                  email: e.target.value,
                })
              }
            />
            {errors.email && <div className="field-error">{errors.email}</div>}

          </div>

          <div className={`input-box ${errors.phoneNo ? "input-error" : ""}`}>

            <PhoneOutlined />

            <input
              placeholder="Phone (optional)"
              value={viewer.phoneNo}
              onChange={(e) =>
                setViewer({
                  ...viewer,
                  phoneNo: e.target.value,
                })
              }
            />
            {errors.phoneNo && <div className="field-error">{errors.phoneNo}</div>}

          </div>

          <div className="input-box">

            <UserOutlined />

            <input
              placeholder="Designation (optional)"
              value={viewer.designation}
              onChange={(e) =>
                setViewer({
                  ...viewer,
                  designation: e.target.value,
                })
              }
            />

          </div>

          <div className={`input-box ${errors.password ? "input-error" : ""}`}>

            <LockOutlined />

            <input
              type="password"
              placeholder="Password *"
              value={viewer.password}
              onChange={(e) =>
                setViewer({
                  ...viewer,
                  password: e.target.value,
                })
              }
            />
            {errors.password && <div className="field-error">{errors.password}</div>}
            <div className="field-hint">Min 8 characters</div>

          </div>

          <div className="input-box">

            <SafetyCertificateOutlined />

            <input

              value="DEPT_VIEWER"

              disabled

            />
            <div className="field-hint">Role</div>

          </div>

          <button
            className="register-btn"
            disabled={loading}
          >

            {loading ? "Creating..." : "Register"}

          </button>

        </form>

      </div>

    </div>

  );

};

export default CreateDepartmentViewer;
