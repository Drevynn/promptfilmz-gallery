import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { useTheme } from "@/hooks/useTheme";

const AppLayout = ({ children }: { children: ReactNode }) => {
  useTheme(); // Initialize theme on mount
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
