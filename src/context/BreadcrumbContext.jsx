import { createContext, useContext } from "react";

const BreadcrumbContext = createContext(() => {});

export const BreadcrumbProvider = ({ value, children }) => (
  <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useSetBreadcrumb = () => useContext(BreadcrumbContext);