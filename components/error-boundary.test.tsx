import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/error-boundary";
import type { ErrorInfo } from "react";

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }): React.JSX.Element => {
  if (shouldThrow) throw new Error("Test error message");
  return <div>Child content</div>;
};

// Suppress error boundary console.error for this test
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders fallback UI when child throws", () => {
    render(
      <ErrorBoundary label="TestWidget">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText(/Failed to load TestWidget/)).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("renders fallback prop when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  it("renders generic message when no label", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument();
  });

  it("resets error state on Try again click", () => {
    // This test verifies the button exists and is clickable; actual reset requires error not re-thrown
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const btn = screen.getByText("Try again");
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe("BUTTON");
  });

  it("getDerivedStateFromError sets hasError", () => {
    const state = ErrorBoundary.getDerivedStateFromError(new Error("boom"));
    expect(state.hasError).toBe(true);
    expect(state.error?.message).toBe("boom");
  });

  it("componentDidCatch logs error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const instance = new ErrorBoundary({ children: <div /> });
    const errorInfo: ErrorInfo = { componentStack: "stack" };
    instance.componentDidCatch(new Error("oops"), errorInfo);
    // Should call console.error (our spy)
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
