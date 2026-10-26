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
          colorPrimary: dark ? "#6366F1" : "#4F46E5",
          colorInfo: dark ? "#22D3EE" : "#06B6D4",
          colorSuccess: dark ? "#34D399" : "#10B981",
          colorWarning: dark ? "#FBBF24" : "#F59E0B",
          colorError: dark ? "#F87171" : "#EF4444",
          borderRadius: 12,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          colorBgContainer: dark ? "#131B2E" : "#FFFFFF",
          colorBgElevated: dark ? "#1A243B" : "#FFFFFF",
          colorBorder: dark ? "#1F293D" : "#E2E8F0",
          colorBorderSecondary: dark ? "#1A243B" : "#F1F5F9",
          colorText: dark ? "#F8FAFC" : "#0F172A",
          colorTextSecondary: dark ? "#94A3B8" : "#475569",
          colorBgMask: "rgba(11, 15, 25, 0.65)",
        },
        components: {
          Table: {
            headerBg: dark ? "#1A243B" : "#F8FAFC",
            headerColor: dark ? "#F8FAFC" : "#0F172A",
            rowHoverBg: dark ? "rgba(99, 102, 241, 0.08)" : "rgba(79, 70, 229, 0.04)",
            borderColor: dark ? "#1F293D" : "#E2E8F0",
          },
          Button: {
            borderRadius: 10,
            controlHeight: 38,
            fontWeight: 600,
          },
          Modal: {
            contentBg: dark ? "#131B2E" : "#FFFFFF",
            headerBg: dark ? "#131B2E" : "#FFFFFF",
            titleFontSize: 18,
          },
          Card: {
            colorBgContainer: dark ? "#131B2E" : "#FFFFFF",
            colorBorderSecondary: dark ? "#1F293D" : "#E2E8F0",
          },
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

export default App;
