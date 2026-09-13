import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HabitCheckItem from "../HabitCheckItem";

const baseItem = {
  id: "h1",
  name: "Gym",
  icon: "dumbbell",
  color: "#f97316",
  type: "boolean" as const,
  priority: "medium" as const,
  status: "pending" as const,
};

const noop = () => {};

describe("HabitCheckItem", () => {
  it("calls onComplete when the empty circle is clicked", async () => {
    const onComplete = vi.fn();
    render(
      <HabitCheckItem item={baseItem} onComplete={onComplete} onUndo={noop} onSkip={noop} onMiss={noop} onIncrement={noop} />
    );

    await userEvent.click(screen.getByRole("button", { name: /mark done/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls onUndo instead of onComplete once the habit is already done", async () => {
    const onComplete = vi.fn();
    const onUndo = vi.fn();
    render(
      <HabitCheckItem
        item={{ ...baseItem, status: "completed" }}
        onComplete={onComplete}
        onUndo={onUndo}
        onSkip={noop}
        onMiss={noop}
        onIncrement={noop}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /mark not done/i }));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("disables interaction and shows a status label for inert days (paused/rest/not scheduled)", () => {
    render(
      <HabitCheckItem
        item={{ ...baseItem, status: "rest_day" }}
        onComplete={noop}
        onUndo={noop}
        onSkip={noop}
        onMiss={noop}
        onIncrement={noop}
      />
    );

    expect(screen.getByText("Rest day")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark done/i })).toBeDisabled();
  });

  it("renders a progress bar and calls onIncrement for numeric habits", async () => {
    const onIncrement = vi.fn();
    render(
      <HabitCheckItem
        item={{ ...baseItem, type: "numeric", status: "pending", value: 3, targetValue: 8, unit: "glasses" }}
        onComplete={noop}
        onUndo={noop}
        onSkip={noop}
        onMiss={noop}
        onIncrement={onIncrement}
      />
    );

    expect(screen.getByText("3 / 8 glasses")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /increase/i }));
    expect(onIncrement).toHaveBeenCalledWith(1);
  });
});
