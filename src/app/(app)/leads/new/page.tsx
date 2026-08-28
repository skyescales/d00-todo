import LeadForm from "@/components/LeadForm";

export default function NewLeadPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Add Lead</h1>
      <LeadForm />
    </div>
  );
}
