import { Card } from "@/components/cabinet/Page";
import { ActivityBars, GrowthChart, SpecialtyBars } from "./charts";
import { AttentionPanel } from "./AttentionPanel";
import { useCabinetActivity, useGrowth, useAttention, usePlatformOverview, usePlatformSpecialties } from "./queries";

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
);

export function DashboardView() {
  const overview = usePlatformOverview();
  const growth = useGrowth(6);
  const busiest = useCabinetActivity("desc", 5);
  const quietest = useCabinetActivity("asc", 5);
  const specialties = usePlatformSpecialties();
  const attention = useAttention();
  const o = overview.data;

  const tiles: { label: string; value: number | undefined; hint?: string | undefined }[] = [
    { label: "Cabinets actifs", value: o?.activeCabinets, hint: o ? `${o.suspendedCabinets} suspendu(s)` : undefined },
    { label: "Médecins actifs", value: o?.doctors },
    { label: "Secrétaires actifs", value: o?.secretaries },
    { label: "Patients", value: o?.patients },
    { label: "RDV (30 jours)", value: o?.appointmentsLast30Days },
    { label: "Nouveaux cabinets (30 j)", value: o?.newCabinetsLast30Days },
    { label: "Nouveaux médecins (30 j)", value: o?.newDoctorsLast30Days },
    { label: "Premières connexions en attente", value: o?.pendingOnboardings },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <p className="label-caps">{t.label}</p>
            {t.value === undefined ? (
              <Skeleton className="mt-3 h-8 w-16" />
            ) : (
              <>
                <p className="num mt-2 text-3xl font-semibold text-twilight dark:text-frost">{t.value}</p>
                {t.hint && <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>}
              </>
            )}
          </Card>
        ))}
      </div>

      <AttentionPanel data={attention.data} loading={attention.isPending} />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-4 font-semibold">Croissance de la plateforme (6 mois)</p>
          {growth.data ? <GrowthChart data={growth.data} /> : <Skeleton className="h-52 w-full" />}
        </Card>
        <Card>
          <p className="mb-4 font-semibold">Médecins par spécialité</p>
          {specialties.data ? <SpecialtyBars data={specialties.data} /> : <Skeleton className="h-40 w-full" />}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-4 font-semibold">Cabinets les plus actifs (30 jours)</p>
          {busiest.data ? <ActivityBars data={busiest.data} /> : <Skeleton className="h-40 w-full" />}
        </Card>
        <Card>
          <p className="mb-4 font-semibold">Cabinets les moins actifs (30 jours)</p>
          {quietest.data ? <ActivityBars data={quietest.data} /> : <Skeleton className="h-40 w-full" />}
        </Card>
      </div>
    </>
  );
}
