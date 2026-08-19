import api from "./api";

export const getMachinesByProject = async (projectId) => {
  const response = await api.get(
    `/api/machines/project/${projectId}`
  );

  return response.data.data;
};

export const getMachineById = async (machineId) => {
  const response = await api.get(
    `/api/machines/${machineId}`
  );

  return response.data.data;
};

export const createMachine = async (machine) => {
  const response = await api.post(
    "/api/machines",
    machine
  );

  return response.data.data;
};

export const updateMachine = async (machineId, machine) => {
  const response = await api.put(
    `/api/machines/${machineId}`,
    machine
  );

  return response.data.data;
};

export const deleteMachine = async (machineId) => {
  const response = await api.delete(
    `/api/machines/${machineId}`
  );

  return response.data.data;
};