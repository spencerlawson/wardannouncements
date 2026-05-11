import { db } from "@/lib/db";
import { organizations, users, announcements } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [[{ wardCount }], [{ userCount }], [{ pendingCount }]] = await Promise.all([
    db.select({ wardCount: count() }).from(organizations).where(eq(organizations.type, "ward")),
    db.select({ userCount: count() }).from(users),
    db.select({ pendingCount: count() }).from(announcements).where(eq(announcements.status, "submitted")),
  ]);

  const stats = [
    { label: "Wards", value: wardCount, href: "/admin/organizations" },
    { label: "Users", value: userCount, href: "/admin/users" },
    { label: "Pending Approvals", value: pendingCount, href: "/dashboard/announcements" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Super Admin Overview</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
