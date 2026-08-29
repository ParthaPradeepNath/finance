import { DataCardLoading } from "@/components/data-card";
import { ChartLoading } from "@/components/chart";
import { SpendingPieLoading } from "@/components/spending-pie";

export default function DashboardLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-2 mb-8">
        <DataCardLoading />
        <DataCardLoading />
        <DataCardLoading />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        <div className="col-span-1 lg:col-span-3 xl:col-span-4">
          <ChartLoading />
        </div>
        <div className="col-span-1 lg:col-span-3 xl:col-span-2">
          <SpendingPieLoading />
        </div>
      </div>
    </div>
  );
}
