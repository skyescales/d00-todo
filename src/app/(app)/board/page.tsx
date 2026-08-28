import KanbanBoard from "@/components/KanbanBoard";

export default function BoardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-fg">Board</h1>
      <KanbanBoard />
    </div>
  );
}
