import OrgForm from "@/components/admin/OrgForm";

export default function NewOrgPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">New Organization</h1>
      <OrgForm />
    </div>
  );
}
