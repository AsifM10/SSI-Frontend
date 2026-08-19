import {
  BankOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";

import StatCard from "./StatCard";
import "./StatCard.css";

const KpiStatsRow = ({ departments = [], showDepartments = true, counts = null }) => {
  const totalProjects =
    counts?.projects ??
    departments.reduce((sum, d) => sum + (d.projects || 0), 0);
  const totalMachines =
    counts?.machines ??
    departments.reduce((sum, d) => sum + (d.machines || 0), 0);
  const totalDepartments = counts?.departments ?? departments.length;

  const stats = [
    ...(showDepartments
      ? [
          {
            label: "Total",
            value: totalDepartments,
            title: "Departments",
            accent: {
              icon: <BankOutlined />,
              bg: "#E5EDF6",
              color: "#2F5D9F",
              grad: "linear-gradient(135deg, #2F5D9F, #5FA8A7)",
            },
          },
        ]
      : []),
    {
      label: "Total",
      value: totalProjects,
      title: "Projects",
      accent: {
        icon: <AppstoreOutlined />,
        bg: "#FDF1E3",
        color: "#DD6B20",
        grad: "linear-gradient(135deg, #DD6B20, #F6AD55)",
      },
    },
    {
      label: "Total",
      value: totalMachines,
      title: "Machines",
      accent: {
        icon: <CloudServerOutlined />,
        bg: "#E7F5EF",
        color: "#38A169",
        grad: "linear-gradient(135deg, #38A169, #68D391)",
      },
    },
  ];

  return (
    <div className={`kpi-stats-row ${showDepartments ? "" : "kpi-stats-row--two"}`}>
      {stats.map((s) => (
        <StatCard
          key={s.title}
          title={s.title}
          value={s.value}
          label={s.label}
          sub={s.sub}
          accent={s.accent}
        />
      ))}
    </div>
  );
};

export default KpiStatsRow;