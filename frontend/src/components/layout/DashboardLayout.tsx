import { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "./sidebar";
import Navbar from "./NavBar";

interface Props {
  title: string;
  children: ReactNode;
}

export default function DashboardLayout({ title, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
