import { useEffect, useState } from "react";
import { ApartmentOutlined } from "@ant-design/icons";
import { message } from "antd";
import api from "../../services/api";
import "./CentralViewer.css";

const CentralViewerView = () => {

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDepartments();
  }, []);

  const getDepartments = async () => {

    try {

      setLoading(true);

      const response = await api.get("/api/departments");

      if (response.data.success) {
        setDepartments(response.data.data);
      }

    } catch (error) {
      message.error("Unable to fetch Departments");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="central-viewer-page">

      <div className="central-viewer-header">

        <h2>All Departments</h2>

        <p>View all departments in the organization.</p>

      </div>

      <div className="central-viewer-table">

        <div className="table-heading">

          <div>Department Code</div>

          <div>Department Name</div>

          <div>Description</div>

        </div>

        {

          loading ?

          (

            <div className="loading-container">
              Loading...
            </div>

          )

          :

          departments.length === 0 ?

          (

            <div className="empty-state">
              <div className="empty-state-icon"><ApartmentOutlined /></div>
              <div className="empty-state-title">No Departments Found</div>
              <div className="empty-state-desc">There are no departments to display.</div>
            </div>

          )

          :

          departments.map((department) => (

            <div
              className="table-row"
              key={department.deptId}
            >

              <div className="department-name">

                <ApartmentOutlined />

                <span>{department.departmentCode}</span>

              </div>

              <div>{department.departmentName}</div>

              <div>{department.description || "-"}</div>

            </div>

          ))

        }

      </div>

    </div>

  );

};

export default CentralViewerView;