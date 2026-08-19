import api from "./api";

export const getProjectsByDepartment = async (deptId) => {
  const response = await api.get(
    `/api/projects/department/${deptId}/summary`
  );

  return response.data.data;
};

export const getProjectSummary = async (projectId) => {
  const response = await api.get(
    `/api/projects/${projectId}/summary`
  );

  return response.data.data;
};

export const createProject = async (payload) => {
  const response = await api.post(
    "/api/projects",
    payload
  );

  return response.data.data;
};

export const updateProject = async (projectId, payload) => {
  const response = await api.put(
    `/api/projects/${projectId}`,
    payload
  );

  return response.data.data;
};

export const getDepartmentById = async (deptId) => {
  const response = await api.get(
    `/api/departments/${deptId}`
  );

  return response.data.data;
};

export const getProjectsForUser = async (user = {}) => {
  const isCentral =
    user.role === "CENTRAL_ADMIN" || user.role === "CENTRAL_VIEWER";

  if (isCentral) {
    const depRes = await api.get("/api/departments/summary");
    const raw = depRes.data?.data ?? [];
    const depts = Array.isArray(raw) ? raw : [raw].filter(Boolean);

    const deptPromises = depts.map(async (d) => {
      try {
        const res = await api.get(`/api/projects/department/${d.deptId}/summary`);
        const projects = res.data?.data ?? [];
        return (Array.isArray(projects) ? projects : [projects].filter(Boolean)).map(
          (p) => ({ ...p, deptName: d.deptName })
        );
      } catch (err) {
        console.error("Project fetch failed for dept", d.deptId, err);
        return [];
      }
    });

    const nested = await Promise.all(deptPromises);
    return nested.flat();
  }

  const res = await api.get(`/api/projects/department/${user.deptId}/summary`);
  const projects = res.data?.data ?? [];
  return Array.isArray(projects) ? projects : [projects].filter(Boolean);
};