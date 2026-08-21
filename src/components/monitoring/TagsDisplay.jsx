import { useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import useProjectsTags from "../../hooks/useProjectsTags";

const TagsDisplay = () => {
  const { tags, loading } = useProjectsTags();

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredTags = tags
    ? tags.filter((t) => t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  if (loading) {
    return null;
  }

  return (
    <div className="project-tags-section">
      <div className="project-tags-search">
        <SearchOutlined className="search-icon" />
        <input
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {filteredTags.length > 0 ? (
        <div className="project-tags-chip-list">
          {filteredTags.map((tag) => (
            <span
              key={tag.tag}
              className="project-tag-chip"
              style={{
                background: "#EFF8FF",
                border: "1px solid #B8DAFF",
                borderRadius: 12,
                padding: "4px 8px",
                marginRight: 4,
                marginBottom: 4,
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {tag.tag} <span style={{ fontSize: 10, color: "#525FEF", marginLeft: 4 }}>({tag.count})</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="project-tags-empty">
          <SearchOutlined style={{ fontSize: 16, color: "#8C8C8C" }} />
          <span>No tags found</span>
        </div>
      )}
    </div>
  );
};

export default TagsDisplay;