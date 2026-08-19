import api from "./api";

export const createDepartment = async (deptName) => {
  const response = await api.post("/api/departments", {
    deptName,
  });

  return response.data.data;
};

export const updateDepartment = async (deptId, deptName) => {
  const response = await api.put(`/api/departments/${deptId}`, {
    deptName,
  });

  return response.data.data;
};