import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { programs, programItems, userOrganizationRoles, organizations } from "@/lib/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import ProgramBuilder from "@/components/programs/ProgramBuilder";
import ProgramView from "@/components/programs/ProgramView";
import { deleteProgram } from "@/lib/actions/programs";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default async function ProgramEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const [program] = await db.select().from(programs).where(eq(programs.id, id));
  if (!program) notFound();

  const memberships = await db
    .select({ org: organizations })
    .from(userOrganizationRoles)
    .innerJoin(organizations, eq(userOrganizationRoles.organizationId, organizations.id))
    .where(
      and(
        eq(userOrganizationRoles.userId, session.user.id),
        inArray(userOrganizationRoles.role, ["ward_leader", "stake_leader"])
      )
    );

  if (memberships.length === 0 && !session.user.isSuperAdmin) redirect("/dashboard");

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, program.organizationId));

  const items = await db
    .select()
    .from(programItems)
    .where(eq(programItems.programId, id))
    .orderBy(asc(programItems.sortOrder));

  const orgs = memberships.map((m) => ({ id: m.org.id, name: m.org.name }));

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Program</h1>
        <form
          action={async () => {
            "use server";
            await deleteProgram(id);
          }}
        >
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </form>
      </div>

      <ProgramBuilder
        orgs={orgs}
        existing={program}
        existingItems={items}
      />

      {program.status === "published" && org && (
        <div id="preview" className="space-y-3 pt-4 border-t">
          <h2 className="text-lg font-semibold text-stone-700">Preview</h2>
          <ProgramView
            program={program}
            items={items}
            wardName={org.name}
            primaryColor={org.primaryColor}
          />
        </div>
      )}
    </div>
  );
}
