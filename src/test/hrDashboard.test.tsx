import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { HRDashboard } from "@/components/HRDashboard";

describe("HRDashboard", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserverStub {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterAll(() => vi.unstubAllGlobals());

  it("flags a high self-rating delta against the JDS cohort baseline", () => {
    render(<HRDashboard />);

    expect(
      screen.getByText("Review signal: rating is above the cohort threshold"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Delta \+3\.73 points/)).toBeInTheDocument();
  });

  it("updates weighted role-fit coverage when candidate skills change", () => {
    render(<HRDashboard />);

    expect(screen.getByText("56%", { exact: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "PYTHON" }));
    expect(screen.getByText("29%", { exact: true })).toBeInTheDocument();
  });
});
