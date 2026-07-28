/**
 * Site-wide copyright — 2dcite LLC
 */
export const COPYRIGHT_TEXT = "© 2026 2dcite LLC. All rights reserved.";

export function CopyrightNotice({
  className = "text-xs text-muted",
}: {
  className?: string;
}) {
  return (
    <p className={className}>
      <span className="sr-only">Copyright </span>
      {COPYRIGHT_TEXT}
    </p>
  );
}
