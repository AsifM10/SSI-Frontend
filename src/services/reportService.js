import api from "./api";

const extractReport = (response) => ({
  ...response.data.data,
  generatedAt: response.data.timestamp,
});

export const getSystemReport = async (period, month, year) => {
  const response = await api.get("/api/reports/system", {
    params: { period, month, year },
  });
  return extractReport(response);
};

export const getDepartmentReport = async (deptId, period, month, year) => {
  const response = await api.get(`/api/reports/departments/${deptId}`, {
    params: { period, month, year },
  });
  return extractReport(response);
};

export const getProjectReport = async (projectId, period, month, year) => {
  const response = await api.get(`/api/reports/projects/${projectId}`, {
    params: { period, month, year },
  });
  return extractReport(response);
};

export const getMachineReport = async (machineId, period, month, year) => {
  const response = await api.get(`/api/reports/machines/${machineId}`, {
    params: { period, month, year },
  });
  return extractReport(response);
};
