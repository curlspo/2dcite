/** Skip navigation link — first focusable element for keyboard users */
export function SkipLink({
  href = "#main-content",
  children = "Skip to main content",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a href={href} className="skip-link">
      {children}
    </a>
  );
}
