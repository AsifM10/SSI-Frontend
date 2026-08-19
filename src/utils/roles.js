export const WRITE_ROLES = ["CENTRAL_ADMIN", "DEPT_ADMIN"];

export const canWrite = (role) => WRITE_ROLES.includes(role);
