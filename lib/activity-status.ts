/**
 * Activity Status Utilities
 *
 * Calculate and display project activity status based on timestamps.
 * Used across profile and projects pages to show whether a project
 * is actively maintained, recently updated, or archived.
 */

export type ActivityStatus = "active" | "recent" | "archived" | "new";

/**
 * Calculate activity status based on timestamps
 *
 * Status logic:
 * - "new": Created within last 7 days → Blue badge
 * - "active": Updated within last 30 days → Green badge
 * - "recent": Updated 30-90 days ago → Yellow/amber badge
 * - "archived": Updated 90+ days ago → Gray badge
 *
 * Priority: "new" takes precedence over other statuses
 */
export function getActivityStatus(
  updatedAt: string | null | undefined,
  createdAt?: string | null | undefined,
): ActivityStatus {
  const now = new Date();

  // Check if newly created (within 7 days)
  if (createdAt) {
    const created = new Date(createdAt);
    const daysSinceCreated = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceCreated <= 7) {
      return "new";
    }
  }

  // Check update status
  if (!updatedAt) return "archived";

  const updated = new Date(updatedAt);
  const daysSinceUpdate = Math.floor(
    (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceUpdate <= 30) return "active";
  if (daysSinceUpdate <= 90) return "recent";
  return "archived";
}

/**
 * Get human-readable label for activity status
 */
export function getActivityLabel(status: ActivityStatus): string {
  const labels: Record<ActivityStatus, string> = {
    new: "New",
    active: "Active",
    recent: "Recently Updated",
    archived: "Archived",
  };
  return labels[status];
}

/**
 * Get badge styling classes for activity status
 * Returns Tailwind classes for background and text color
 */
export function getActivityBadgeClasses(status: ActivityStatus): string {
  const classes: Record<ActivityStatus, string> = {
    new: "bg-blue-500/15 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400",
    active:
      "bg-green-500/15 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    recent:
      "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    archived:
      "bg-gray-500/10 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400",
  };
  return classes[status];
}
