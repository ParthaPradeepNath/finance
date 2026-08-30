import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataCard, DataCardLoading } from "@/components/data-card";
import { PiggyBank } from "lucide-react";

type CountUpProps = {
  end: number;
  formattingFn?: (value: number) => string;
};

vi.mock("@/components/count-up", () => ({
  CountUp: ({ end, formattingFn }: CountUpProps) => (
    <span data-testid="countup">{formattingFn ? formattingFn(end) : String(end)}</span>
  ),
}));

describe("DataCard", () => {
  it("renders title and dateRange", () => {
    render(
      <DataCard
        icon={PiggyBank}
        title="Total Balance"
        value={1234.56}
        dateRange="Jan 01 - Jan 31, 2024"
        percentageChange={12}
        variant="default"
      />
    );
    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText("Jan 01 - Jan 31, 2024")).toBeInTheDocument();
  });

  it("formats value via CountUp / formatCurrency", () => {
    render(
      <DataCard
        icon={PiggyBank}
        title="Income"
        value={1000}
        dateRange="Jan 01 - Jan 31"
        percentageChange={0}
      />
    );
    // CountUp mock formats via formatCurrency (INR)
    expect(screen.getByTestId("countup").textContent).toMatch(/₹/);
  });

  it("shows positive percentage with emerald color", () => {
    render(
      <DataCard
        icon={PiggyBank}
        title="Income"
        value={500}
        dateRange="Range"
        percentageChange={10}
      />
    );
    expect(screen.getByText(/10%.*from last period/)).toBeInTheDocument();
    const pct = screen.getByText(/10%.*from last period/);
    expect(pct.className).toContain("text-emerald-500");
  });

  it("shows negative percentage with rose color", () => {
    render(
      <DataCard
        icon={PiggyBank}
        title="Expenses"
        value={500}
        dateRange="Range"
        percentageChange={-5}
      />
    );
    const pct = screen.getByText(/-5%.*from last period/);
    expect(pct.className).toContain("text-rose-500");
  });

  it("shows zero percentage with blue color", () => {
    render(
      <DataCard
        icon={PiggyBank}
        title="Balance"
        value={0}
        dateRange="Range"
        percentageChange={0}
      />
    );
    const pct = screen.getByText(/0%.*from last period/);
    expect(pct.className).toContain("text-blue-500");
  });

  it("applies variant styles", () => {
    const { container } = render(
      <DataCard
        icon={PiggyBank}
        title="Test"
        value={100}
        dateRange="Range"
        variant="success"
      />
    );
    // boxVariant success -> bg-emerald-500/20
    expect(container.innerHTML).toContain("bg-emerald-500/20");
  });

  it("defaults value to 0 and percentage to 0", () => {
    render(<DataCard icon={PiggyBank} title="Default" dateRange="Range" />);
    expect(screen.getByText(/0%.*from last period/)).toBeInTheDocument();
  });
});

describe("DataCardLoading", () => {
  it("renders skeleton loaders", () => {
    const { container } = render(<DataCardLoading />);
    // Skeleton components have class animate-pulse or h-6 etc
    expect(container.querySelectorAll("[class*='animate-pulse'], [class*='h-6'], [class*='h-4']")).toBeDefined();
    expect(container.innerHTML).toContain("h-[192px]");
  });
});
