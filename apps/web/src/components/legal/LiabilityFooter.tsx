import { LIABILITY_FOOTER } from "@2dcite/shared";

export function LiabilityFooter({
  className = "text-xs leading-relaxed text-muted",
}: {
  className?: string;
}) {
  return <p className={className}>{LIABILITY_FOOTER}</p>;
}
