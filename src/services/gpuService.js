import api from "./api";

export const getGpuMetrics = async (
  machineId,
  range = "15m"
) => {
  const response = await api.get(
    `/api/machines/${machineId}/metrics/gpu?range=${range}`
  );

  return response.data.data;
};