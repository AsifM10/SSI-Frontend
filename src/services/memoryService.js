import api from "./api";

export const getMemoryMetrics = async (
  machineId,
  range = "15m"
) => {
  const response = await api.get(
    `/api/machines/${machineId}/metrics/memory?range=${range}`
  );

  return response.data.data;
};