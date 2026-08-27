import { useNavigate } from "react-router-dom";
import { DeleteOutlined, EditOutlined, ArrowRightOutlined } from "@ant-design/icons";
import DataTable from "../../DataTable/DataTable";

const DepartmentTable = ({ departments, onAddClick, onDelete, onEdit }) => {
  const navigate = useNavigate();

  const columns = [
    {
      title: "Department Name",
      width: "32%",
      render: (department) => (
        <span className="dt-name">
          <span className="dt-icon">{department.icon}</span>
          <span className="dt-name-text">{department.title}</span>
        </span>
      ),
    },
    { title: "Projects", width: "14%", align: "center", render: (d) => d.projects },
    { title: "Machines", width: "14%", align: "center", render: (d) => d.machines },
    { title: "Active Alerts", width: "16%", align: "center", render: (d) => d.alerts },
    {
      title: "",
      width: "24%",
      render: (department) => (
        <div className="dt-actions">
          <button
            className="dt-action-btn dt-action-view"
            title="View"
            onClick={() => navigate(`/departments/${department.title}`)}
          >
            <ArrowRightOutlined />
          </button>
          {onEdit && (
            <button
              className="dt-action-btn dt-action-edit"
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
              className="dt-action-btn dt-action-delete"
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
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={departments}
      onRowClick={(department) => navigate(`/departments/${department.title}`)}
    />
  );
};

export default DepartmentTable;