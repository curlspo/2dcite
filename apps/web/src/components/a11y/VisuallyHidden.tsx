/** Hide visually but keep available to assistive tech */
export function VisuallyHidden({
  children,
  as: Tag = "span",
}: {
  children: React.ReactNode;
  as?: "span" | "h1" | "h2" | "p" | "div";
}) {
  return <Tag className="sr-only">{children}</Tag>;
}
