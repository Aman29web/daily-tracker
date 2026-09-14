import { AppColors } from "@/styles/colors";
import { DayStatus } from "@/types";

/**
 * 9-way DayStatus -> color, single source of truth reused by the habit
 * history strip (Phase 2) and the Calendar heatmap (Phase 3).
 */
export function dayStatusColor(status: DayStatus, colors: AppColors): string {
  switch (status) {
    case "completed":
      return colors.success;
    case "missed":
      return colors.danger;
    case "skipped":
      return colors.warning;
    case "paused":
      return "#60A5FA";
    case "rest_day":
      return colors.surfaceAlt;
    case "pending":
      return colors.primary;
    case "upcoming":
      return colors.border;
    case "not_scheduled":
    case "inactive":
    default:
      return colors.border;
  }
}
