import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  cn,
  convertAmountFromMiliunits,
  convertAmountToMiliunits,
  formatCurrency,
  calculatePercentageChange,
  fillMissingDays,
  formatDateRange,
  formatPercentage,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("deduplicates tailwind conflicts via tailwind-merge", () => {
    // tailwind-merge should keep last conflicting class
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  it("handles objects and arrays via clsx", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo");
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});

describe("convertAmountFromMiliunits", () => {
  it("converts miliunits to currency units", () => {
    expect(convertAmountFromMiliunits(1000)).toBe(1);
    expect(convertAmountFromMiliunits(10500)).toBe(10.5);
    expect(convertAmountFromMiliunits(0)).toBe(0);
    expect(convertAmountFromMiliunits(-5000)).toBe(-5);
  });

  it("handles fractional miliunits", () => {
    expect(convertAmountFromMiliunits(1)).toBe(0.001);
    expect(convertAmountFromMiliunits(999)).toBe(0.999);
  });
});

describe("convertAmountToMiliunits", () => {
  it("converts currency units to miliunits", () => {
    expect(convertAmountToMiliunits(1)).toBe(1000);
    expect(convertAmountToMiliunits(10.5)).toBe(10500);
    expect(convertAmountToMiliunits(0)).toBe(0);
    expect(convertAmountToMiliunits(-5)).toBe(-5000);
  });

  it("rounds to nearest integer", () => {
    expect(convertAmountToMiliunits(1.2345)).toBe(1235);
    expect(convertAmountToMiliunits(1.2344)).toBe(1234);
    expect(convertAmountToMiliunits(0.0004)).toBe(0);
    expect(convertAmountToMiliunits(0.0005)).toBe(1);
  });

  it("is inverse of convertAmountFromMiliunits for clean values", () => {
    expect(convertAmountFromMiliunits(convertAmountToMiliunits(10.123))).toBeCloseTo(10.123);
    expect(convertAmountToMiliunits(convertAmountFromMiliunits(10000))).toBe(10000);
  });
});

describe("formatCurrency", () => {
  it("formats INR currency", () => {
    // en-US locale with INR currency: ₹ sign
    expect(formatCurrency(0)).toMatch(/₹.*0\.00/);
    expect(formatCurrency(10)).toMatch(/₹.*10\.00/);
    expect(formatCurrency(1234.56)).toMatch(/₹.*1,234\.56/);
  });

  it("formats negative values", () => {
    expect(formatCurrency(-100)).toMatch(/-.*₹|₹.*-/);
  });

  it("always shows 2 decimal places", () => {
    expect(formatCurrency(1)).toMatch(/1\.00/);
    expect(formatCurrency(1.1)).toMatch(/1\.10/);
  });
});

describe("calculatePercentageChange", () => {
  it("calculates positive change", () => {
    expect(calculatePercentageChange(150, 100)).toBe(50);
  });

  it("calculates negative change", () => {
    expect(calculatePercentageChange(50, 100)).toBe(-50);
  });

  it("returns 0 when both are 0", () => {
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });

  it("returns 100 when previous is 0 and current is non-zero", () => {
    expect(calculatePercentageChange(100, 0)).toBe(100);
    expect(calculatePercentageChange(-50, 0)).toBe(100);
  });

  it("handles same non-zero values", () => {
    expect(calculatePercentageChange(100, 100)).toBe(0);
  });

  it("handles decimal values", () => {
    expect(calculatePercentageChange(110, 100)).toBe(10);
    expect(calculatePercentageChange(33, 100)).toBe(-67);
  });
});

describe("fillMissingDays", () => {
  it("returns empty array when activeDays is empty", () => {
    expect(fillMissingDays([], new Date("2024-01-01"), new Date("2024-01-03"))).toEqual([]);
  });

  it("fills missing days with zeros", () => {
    const activeDays = [
      { date: new Date("2024-01-01"), income: 100, expenses: 50 },
      { date: new Date("2024-01-03"), income: 200, expenses: 80 },
    ];
    const result = fillMissingDays(activeDays, new Date("2024-01-01"), new Date("2024-01-03"));
    expect(result).toHaveLength(3);
    // Use date-string comparison to avoid TZ offsets (eachDayOfInterval is TZ-sensitive)
    expect(result[0].income).toBe(100);
    expect(result[0].expenses).toBe(50);
    expect(result[0].date.toDateString()).toBe(new Date("2024-01-01").toDateString());
    expect(result[1]).toMatchObject({ income: 0, expenses: 0 });
    expect(result[1].date.toDateString()).toBe(new Date("2024-01-02").toDateString());
    expect(result[2].income).toBe(200);
    expect(result[2].date.toDateString()).toBe(new Date("2024-01-03").toDateString());
  });

  it("returns all active days when no gaps", () => {
    const activeDays = [
      { date: new Date("2024-01-01"), income: 10, expenses: 5 },
      { date: new Date("2024-01-02"), income: 20, expenses: 10 },
    ];
    const result = fillMissingDays(activeDays, new Date("2024-01-01"), new Date("2024-01-02"));
    expect(result).toHaveLength(2);
    expect(result[0].income).toBe(10);
    expect(result[1].income).toBe(20);
  });

  it("handles single day interval", () => {
    const activeDays = [{ date: new Date("2024-01-01"), income: 50, expenses: 25 }];
    const result = fillMissingDays(activeDays, new Date("2024-01-01"), new Date("2024-01-01"));
    expect(result).toHaveLength(1);
    expect(result[0].income).toBe(50);
  });

  it("fills all days as zero when active day not in range", () => {
    // activeDays has a date outside interval — should still fill interval with zeros except no match
    const activeDays = [{ date: new Date("2024-02-01"), income: 100, expenses: 50 }];
    const result = fillMissingDays(activeDays, new Date("2024-01-01"), new Date("2024-01-02"));
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.income === 0 && d.expenses === 0)).toBe(true);
  });

  it("normalizes time component via isSameDay", () => {
    const activeDays = [
      { date: new Date("2024-01-01T15:30:00"), income: 100, expenses: 50 },
    ];
    const result = fillMissingDays(activeDays, new Date("2024-01-01"), new Date("2024-01-02"));
    // Even though active day has time, it should match day 1
    expect(result[0].income).toBe(100);
    expect(result[1].income).toBe(0);
  });
});

describe("formatDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns default 30-day range when period is undefined", () => {
    const result = formatDateRange(undefined);
    // defaultFrom = 2024-05-16, defaultTo = 2024-06-15
    expect(result).toBe("May 16 - Jun 15, 2024");
  });

  it("returns default range when from is undefined", () => {
    const result = formatDateRange({ from: undefined, to: undefined });
    expect(result).toBe("May 16 - Jun 15, 2024");
  });

  it("formats range with both from and to", () => {
    const result = formatDateRange({
      from: new Date("2024-01-01"),
      to: new Date("2024-01-31"),
    });
    expect(result).toBe("Jan 01 - Jan 31, 2024");
  });

  it("accepts string dates", () => {
    const result = formatDateRange({
      from: "2024-03-01",
      to: "2024-03-15",
    });
    // format will parse ISO strings
    expect(result).toContain("Mar");
  });

  it("formats single from date when to is missing", () => {
    const result = formatDateRange({
      from: new Date("2024-01-15"),
      to: undefined,
    });
    expect(result).toBe("Jan 15, 2024");
  });

  it("handles from without to (string)", () => {
    const result = formatDateRange({
      from: "2024-12-25",
      to: undefined,
    });
    expect(result).toContain("Dec 25");
    expect(result).toContain("2024");
  });
});

describe("formatPercentage", () => {
  it("formats decimal as percent", () => {
    expect(formatPercentage(50)).toBe("50%");
    expect(formatPercentage(0)).toBe("0%");
    expect(formatPercentage(100)).toBe("100%");
    expect(formatPercentage(-50)).toBe("-50%");
  });

  it("handles fractional percentages (Intl rounds to nearest integer by default)", () => {
    // Intl.NumberFormat style:percent with default fraction digits rounds
    // value 12.5 => 12.5 /100 = 0.125 => "13%" (no decimal places by default)
    expect(formatPercentage(12.5)).toBe("13%");
    expect(formatPercentage(0.5)).toBe("1%"); // 0.5% -> rounds to 1% or 0%? actually 0.005 => 1%
  });

  it("adds prefix for positive when option set", () => {
    expect(formatPercentage(50, { addPrefix: true })).toBe("+50%");
    expect(formatPercentage(0, { addPrefix: true })).toBe("0%");
    expect(formatPercentage(-50, { addPrefix: true })).toBe("-50%");
  });

  it("does not add prefix for zero or negative", () => {
    expect(formatPercentage(0, { addPrefix: true })).not.toContain("+");
    expect(formatPercentage(-10, { addPrefix: true })).not.toContain("+");
  });

  it("defaults to no prefix", () => {
    expect(formatPercentage(50)).toBe("50%");
    expect(formatPercentage(50, {})).toBe("50%");
  });
});
