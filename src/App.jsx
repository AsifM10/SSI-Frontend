import { ConfigProvider, theme } from "antd";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import AppRoutes from "./routes/AppRoutes";

function AppContent() {
  const { dark } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#0047AB",
          borderRadius: 10,
          colorBgContainer: dark ? "#0F172A" : "#FFFFFF",
          colorBgElevated: dark ? "#1E293B" : "#FFFFFF",
          colorBorder: dark ? "#334155" : "#CBD5E1",
          colorText: dark ? "#F1F5F9" : "#0F172A",
          colorTextSecondary: dark ? "#94A3B8" : "#334155",
          colorBgMask: "rgba(0, 0, 0, 0.6)",
        },
      }}
    >
      <AppRoutes />
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}





//new code with D-

// function App() {

//   return (

//     <ThemeProvider>

//       <SessionWatcher />

//       <AppRoutes />

//     </ThemeProvider>

//   );

// }

export default App;
