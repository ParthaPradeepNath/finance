import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    const classes = buttonVariants({ variant: "default" });
    expect(classes).toContain("bg-primary");
  });

  it("applies destructive variant", () => {
    const classes = buttonVariants({ variant: "destructive" });
    expect(classes).toContain("bg-destructive");
  });

  it("applies size variant", () => {
    const classes = buttonVariants({ size: "sm" });
    expect(classes).toContain("h-8");
    const iconClasses = buttonVariants({ size: "icon" });
    expect(iconClasses).toContain("size-9");
  });

  it("renders as child when asChild true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByText("Link Button");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/test");
  });

  it("forwards disabled prop", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText("Disabled")).toBeDisabled();
  });

  it("handles click handler", async () => {
    let clicked = false;
    render(<Button onClick={() => (clicked = true)}>Click</Button>);
    screen.getByText("Click").click();
    expect(clicked).toBe(true);
  });
});
