import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/serverAuth";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!isAdmin(user.uid)) {
    return (
      <div className="min-h-screen bg-pure-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="font-mono tracking-mono text-[12px] uppercase">Access denied</p>
          <p className="text-[32px] leading-none">Not an admin.</p>
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            UID: {user.uid}
          </p>
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            Add this UID to NEXT_PUBLIC_ADMIN_UIDS in .env.local
          </p>
          <a href="/dashboard" className="inline-block mt-4 font-mono tracking-mono text-[12px] uppercase px-6 py-2 border border-absolute-black rounded-[3px] hover:bg-absolute-black hover:text-pure-white transition-colors">
            ← Back to dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pure-white text-absolute-black flex">
      <AdminSidebar adminEmail={user.email ?? user.uid} />
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
