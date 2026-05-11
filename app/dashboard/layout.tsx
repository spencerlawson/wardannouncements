import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userOrganizationRoles, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Megaphone, Settings, Users, LayoutDashboard, Shield } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Get user's ward memberships
  const memberships = await db
    .select({
      role: userOrganizationRoles.role,
      orgId: userOrganizationRoles.organizationId,
      orgName: organizations.name,
      orgSlug: organizations.slug,
    })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id))
    .where(eq(userOrganizationRoles.userId, session.user.id));

  const isLeader = memberships.some(
    (m) => m.role === "ward_leader" || m.role === "stake_leader"
  );
  const initials = (session.user.name ?? session.user.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-lg">
            Ward Announcements
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/announcements">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Megaphone className="h-4 w-4" />
                Announcements
              </Button>
            </Link>
            {isLeader && (
              <>
                <Link href="/dashboard/users">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Users className="h-4 w-4" />
                    Users
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </>
            )}
            {session.user.isSuperAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full focus:outline-none">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium truncate">{session.user.name}</p>
                <p className="text-muted-foreground truncate text-xs">{session.user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                  }}
                  className="w-full"
                >
                  <button type="submit" className="w-full text-left">
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
