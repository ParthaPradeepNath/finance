import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useConfirm } from "@/hooks/use-confirm";

function TestComponent({ title = "Are you sure?", message = "Please confirm" }: { title?: string; message?: string }) {
  const [Dialog, confirm] = useConfirm(title, message);
  return (
    <div>
      <Dialog />
      <button
        onClick={async () => {
          const result = await confirm();
          // Store result in DOM for assertion
          const el = document.getElementById("result");
          if (el) el.textContent = String(result);
        }}
      >
        Trigger
      </button>
      <div id="result" />
    </div>
  );
}

describe("useConfirm", () => {
  it("does not show dialog initially", () => {
    render(<TestComponent />);
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("shows dialog when confirm() is called", async () => {
    render(<TestComponent />);
    await userEvent.click(screen.getByText("Trigger"));
    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText("Please confirm")).toBeInTheDocument();
  });

  it("resolves true when Confirm clicked", async () => {
    render(<TestComponent />);
    await userEvent.click(screen.getByText("Trigger"));
    await userEvent.click(await screen.findByText("Confirm"));
    await waitFor(() => expect(document.getElementById("result")?.textContent).toBe("true"));
  });

  it("resolves false when Cancel clicked", async () => {
    render(<TestComponent />);
    await userEvent.click(screen.getByText("Trigger"));
    await userEvent.click(await screen.findByText("Cancel"));
    await waitFor(() => expect(document.getElementById("result")?.textContent).toBe("false"));
  });

  it("renders custom title and message", async () => {
    render(<TestComponent title="Delete?" message="This cannot be undone" />);
    await userEvent.click(screen.getByText("Trigger"));
    expect(await screen.findByText("Delete?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone")).toBeInTheDocument();
  });

  it("dialog closes after Confirm", async () => {
    render(<TestComponent />);
    await userEvent.click(screen.getByText("Trigger"));
    await userEvent.click(await screen.findByText("Confirm"));
    await waitFor(() => expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument());
  });

  it("dialog closes after Cancel", async () => {
    render(<TestComponent />);
    await userEvent.click(screen.getByText("Trigger"));
    await userEvent.click(await screen.findByText("Cancel"));
    await waitFor(() => expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument());
  });
});
