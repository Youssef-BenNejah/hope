import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cabinet/Page";
import { JournalView } from "@/features/admin/JournalView";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Hope" },
      { name: "description", content: "Journal d'activité de toute la plateforme, avec export CSV." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Journal d'activité" subtitle="Tous les événements, tous les cabinets" />
      <JournalView />
    </>
  ),
});
