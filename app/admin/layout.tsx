import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { Building2, Users, LayoutDashboard } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-slate-900 text-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold">
              Super Admin
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/admin/organizations">
                <Button variant="ghost" size="sm" className="gap-1.5 text-white hover:text-white hover:bg-white/10">
                  <Building2 className="h-4 w-4" />
                  Organizations
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="gap-1.5 text-white hover:text-white hover:bg-white/10">
                  <Users className="h-4 w-4" />
                  Users
                </Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5 text-white hover:text-white hover:bg-white/10">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/10"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
