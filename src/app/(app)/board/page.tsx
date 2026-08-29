import KanbanBoard from "@/components/KanbanBoard";
import LeadsStatsBar from "@/components/LeadsStatsBar";

export default function BoardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-fg">Board</h1>
      <LeadsStatsBar refreshKey={0} />
      <KanbanBoard />
    </div>
  );
}
