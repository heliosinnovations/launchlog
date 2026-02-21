import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard - LaunchLog",
  description: "Manage your LaunchLog profile and track your project visibility.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-layout">
      {/* Hide the header in dashboard via CSS since we have sidebar */}
      <style>{`
        header { display: none !important; }
      `}</style>
      {children}
    </div>
  )
}
