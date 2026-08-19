import api from "./api";

export const getCpuMetrics = async (
  machineId,
  range = "15m"
) => {
  const response = await api.get(
    `/api/machines/${machineId}/metrics/cpu?range=${range}`
  );

  return response.data.data;
};