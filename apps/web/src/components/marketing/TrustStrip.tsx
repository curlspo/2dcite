import Link from "next/link";

export function TrustStrip({
  text,
  href = "/disclaimer",
  linkLabel = "Read full disclaimer",
}: {
  text: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <p className="max-w-2xl text-sm leading-relaxed text-muted">
      {text}{" "}
      <Link
        href={href}
        className="font-medium text-accent underline underline-offset-2 hover:decoration-2"
      >
        {linkLabel}
      </Link>
    </p>
  );
}
