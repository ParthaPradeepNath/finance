import { DataCharts } from "@/components/data-charts";
import { DataGrid } from "@/components/data-grid";
import { ErrorBoundary } from "@/components/error-boundary";

export default function DashboardPage() {
  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <ErrorBoundary label="summary cards">
        <DataGrid />
      </ErrorBoundary>
      <ErrorBoundary label="charts">
        <DataCharts />
      </ErrorBoundary>
    </div>
  );
}
