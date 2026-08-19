import api from "./api";

export const getStorageMetrics = async (
  machineId,
  range = "15m"
) => {
  const response = await api.get(
    `/api/machines/${machineId}/metrics/storage`,
    {
      params: { range },
    }
  );

  return response.data.data;
};