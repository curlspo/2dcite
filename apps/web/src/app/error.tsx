"use client";

/**
 * Route error boundary — never render stack traces or error.message in production UI.
 */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-serif text-2xl font-semibold text-ink">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm text-muted">
        Please try again later. If the problem continues, contact support.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="btn-primary mt-8"
        style={{ color: "#ffffff", backgroundColor: "#16325c" }}
      >
        Try again
      </button>
    </div>
  );
}
