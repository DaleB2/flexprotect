import { createContext, useContext } from "react";

export type TabKey = "Dashboard" | "Settings";

export type TabsContextValue = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
};

export const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabs must be used within TabsContext provider");
  return ctx;
}
