import "./DataTable.css";

const DataTable = ({ columns = [], rows = [], onRowClick, rowKey = (_, i) => i }) => {
  if (columns.length === 0) return null;

  return (
    <div className="dt-wrap">
      <table className="dt-table">
        <colgroup>
          {columns.map((col, i) => (
            <col key={i} style={col.width ? { width: col.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={col.align === "center" ? "dt-center" : ""}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              className={onRowClick ? "dt-row-click" : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col, j) => (
                <td key={j} className={col.align === "center" ? "dt-center" : ""}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;