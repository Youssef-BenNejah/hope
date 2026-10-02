import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cabinet/Page";
import { DashboardView } from "@/features/admin/DashboardView";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Hope" },
      { name: "description", content: "Vue d'ensemble de la plateforme : cabinets, médecins, croissance et alertes." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de la plateforme" />
      <DashboardView />
    </>
  ),
});
