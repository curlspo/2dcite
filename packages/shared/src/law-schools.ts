/**
 * Top-ranked U.S. law schools for student reviewer eligibility.
 * A .edu email is necessary but not sufficient; school selection is part of
 * the application moat. Rankings shift over time — this is a curated list
 * of nationally competitive programs (alphabetical for the dropdown).
 *
 * Always include LAW_SCHOOL_NOT_LISTED as the final option.
 */

/** Stored when the applicant’s school is outside the curated list */
export const LAW_SCHOOL_NOT_LISTED = "Not listed" as const;

/**
 * Curated top-50-style U.S. law schools (alphabetical).
 * Used for student application dropdown only.
 */
export const TOP_LAW_SCHOOLS = [
  "Boston College Law School",
  "Boston University School of Law",
  "Brigham Young University J. Reuben Clark Law School",
  "Columbia Law School",
  "Cornell Law School",
  "Duke University School of Law",
  "Emory University School of Law",
  "Florida State University College of Law",
  "Fordham University School of Law",
  "George Mason University Antonin Scalia Law School",
  "George Washington University Law School",
  "Georgetown University Law Center",
  "Harvard Law School",
  "Indiana University Maurer School of Law",
  "New York University School of Law",
  "Northwestern University Pritzker School of Law",
  "Pepperdine Caruso School of Law",
  "Southern Methodist University Dedman School of Law",
  "Stanford Law School",
  "Texas A&M University School of Law",
  "The Ohio State University Moritz College of Law",
  "University of Alabama School of Law",
  "University of Arizona James E. Rogers College of Law",
  "University of California, Berkeley School of Law",
  "University of California, Davis School of Law",
  "University of California, Irvine School of Law",
  "University of California, Los Angeles School of Law",
  "University of Chicago Law School",
  "University of Colorado Law School",
  "University of Florida Levin College of Law",
  "University of Georgia School of Law",
  "University of Illinois College of Law",
  "University of Iowa College of Law",
  "University of Maryland Francis King Carey School of Law",
  "University of Michigan Law School",
  "University of Minnesota Law School",
  "University of North Carolina School of Law",
  "University of Notre Dame Law School",
  "University of Pennsylvania Carey Law School",
  "University of Southern California Gould School of Law",
  "University of Texas School of Law",
  "University of Utah S.J. Quinney College of Law",
  "University of Virginia School of Law",
  "University of Wisconsin Law School",
  "Vanderbilt Law School",
  "Wake Forest University School of Law",
  "Washington and Lee University School of Law",
  "Washington University School of Law",
  "William & Mary Law School",
  "Yale Law School",
] as const;

export type TopLawSchool = (typeof TOP_LAW_SCHOOLS)[number];

/** Full dropdown options: top schools + Not listed */
export const LAW_SCHOOL_OPTIONS: readonly string[] = [
  ...TOP_LAW_SCHOOLS,
  LAW_SCHOOL_NOT_LISTED,
];

const schoolSet = new Set<string>(LAW_SCHOOL_OPTIONS);

export function isAllowedLawSchool(value: string): boolean {
  return schoolSet.has(value.trim());
}

/** Max hours for admin credential review messaging */
export const STUDENT_CREDENTIAL_REVIEW_HOURS = 24;

export const STUDENT_CREDENTIAL_TURNAROUND_COPY =
  `A .edu email is required to apply but is not sufficient to qualify as a student reviewer. After you submit proof of enrollment, legal writing, and a professor recommendation, 2dcite LLC reviews applications manually. Reviewer credentials are typically issued within ${STUDENT_CREDENTIAL_REVIEW_HOURS} hours (often sooner). You cannot receive assignments until your application is approved.`;
