import { createContext, useContext } from "react";

const BreadcrumbContext = createContext(() => {});

export const BreadcrumbProvider = ({ value, children }) => (
  <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
);

export const useSetBreadcrumb = () => useContext(BreadcrumbContext);