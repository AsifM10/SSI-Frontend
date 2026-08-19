import axios from "axios";

const API = "http://10.210.12.12:8080/api";

export const getPowerMetrics = async (machineId, range = "15m") => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${API}/machines/${machineId}/metrics/power?range=${range}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data;
};