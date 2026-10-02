import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/cabinet/Page";
import { CabinetsView } from "@/features/admin/CabinetsView";

export const Route = createFileRoute("/cabinets")({
  // ?open=<cabinetId> opens the detail panel (used by the dashboard's "à surveiller" links)
  validateSearch: (search: Record<string, unknown>): { open?: string } =>
    typeof search["open"] === "string" && search["open"] ? { open: search["open"] } : {},
  head: () => ({
    meta: [
      { title: "Cabinets — Hope" },
      { name: "description", content: "Annuaire des cabinets et de leurs médecins." },
    ],
  }),
  component: CabinetsPage,
});

function CabinetsPage() {
  const { open } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <>
      <PageHeader title="Cabinets" subtitle="Annuaire des cabinets, médecins et comptes" />
      <CabinetsView
        openId={open}
        onOpen={(id) => void navigate({ search: id ? { open: id } : {}, replace: true })}
      />
    </>
  );
}
