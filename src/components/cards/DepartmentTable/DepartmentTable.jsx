import { useNavigate } from "react-router-dom";
import { DeleteOutlined, EditOutlined, ArrowRightOutlined } from "@ant-design/icons";
import "./DepartmentTable.css";

const DepartmentTable = ({ departments, onAddClick, onDelete, onEdit }) => {
  const navigate = useNavigate();

  return (
    <div className="department-table-wrapper">
      <table className="department-table">
        <thead>
          <tr>
            <th>Department Name</th>
            <th>Projects</th>
            <th>Machines</th>
            <th>Active Alerts</th>
            <th>Overall Status</th>
            <th>Tags</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {departments.map((department, index) => (
            <tr
              key={index}
              className="department-row-click"
              onClick={() => navigate(`/departments/${department.title}`)}
            >
              <td className="department-name-cell">
                <span className="department-icon">{department.icon}</span>
                {department.title}
              </td>
              <td>{department.projects}</td>
              <td>{department.machines}</td>
              <td>{department.alerts}</td>
              <td>
                <span
                  className={`status-badge ${
                    department.status === "Critical"
                      ? "critical"
                      : department.status === "Warning"
                        ? "warning"
                        : department.status?.toLowerCase() === "no machines"
                          ? "no-machines"
                          : "healthy"
                  }`}
                >
                  {department.status}
                </span>
              </td>
              <td>
                <div className="table-tags-cell">
                  {(() => {
                    const raw = department.tags;
                    const tags = Array.isArray(raw)
                      ? raw.filter(Boolean)
                      : raw
                        ? String(raw).split(",").map((t) => t.trim()).filter(Boolean)
                        : [];

                    return tags.length > 0 ? (
                      tags.map((tag, i) => (
                        <span key={i} className="table-tag">{tag}</span>
                      ))
                    ) : (
                      <span className="table-tag-empty">—</span>
                    );
                  })()}
                </div>
              </td>
              <td>
                <div className="department-actions">
                  <button
                    className="department-view-btn"
                    title="View"
                    onClick={() => navigate(`/departments/${department.title}`)}
                  >
                    <ArrowRightOutlined />
                  </button>
                  {onEdit && (
                    <button
                      className="department-edit-btn"
                      title="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(department);
                      }}
                    >
                      <EditOutlined />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="department-delete-btn"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(department);
                      }}
                    >
                      <DeleteOutlined />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentTable;