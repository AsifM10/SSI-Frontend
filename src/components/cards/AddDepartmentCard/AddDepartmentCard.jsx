import { PlusOutlined } from "@ant-design/icons";

import "./AddDepartmentCard.css";

const AddDepartmentCard = ({ onClick }) => {
  return (
    <div className="add-department-card" onClick={onClick}>
      <div className="add-department-icon">
        <PlusOutlined />
      </div>

      <p>Add new department</p>
    </div>
  );
};

export default AddDepartmentCard;
