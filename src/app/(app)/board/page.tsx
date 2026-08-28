import KanbanBoard from "@/components/KanbanBoard";

export default function BoardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Board</h1>
      <KanbanBoard />
    </div>
  );
}
