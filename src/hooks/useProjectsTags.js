import { useEffect, useState } from "react";
import { getProjectsTags } from "../services/projectService";

const useProjectsTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await getProjectsTags();
        if (data && data.length > 0) {
          const sorted = data.sort((a, b) => b.count - a.count);
          setTags(sorted.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to fetch project tags:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, loading };
};

export default useProjectsTags;