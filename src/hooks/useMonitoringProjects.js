import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjectsForUser } from "../services/projectService";

const useMonitoringProjects = (projectId) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const fetchProjects = async () => {
      try {
        const data = await getProjectsForUser(user);
        if (!cancelled) setProjects(data || []);
      } catch (err) {
        console.error("Project list fetch error:", err);
      }
    };

    fetchProjects();
    return () => {
      cancelled = true;
    };
  }, []);

  const onProjectChange = (newProjectId) => {
    if (Number(newProjectId) !== Number(projectId)) {
      navigate(`/monitoring/${newProjectId}`);
    }
  };

  return { projects, onProjectChange };
};

export default useMonitoringProjects;
