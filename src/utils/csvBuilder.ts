// src/utils/csvBuilder.ts
export type CsvFeedRow = {
  user: {
    name: string | null;
    phone: string | null;
    state?: string | null;
    district?: string | null;
    block?: string | null;
  };
  scheme?: {
    title?: string | null;
    id?: string | null;
  } | null;
  eligibilityScore?: number | null;
  verificationStatus?: string | null;
};

export function buildCSV(rows: CsvFeedRow[]) {
  const headers = [
    "beneficiary_name",
    "phone",
    "state",
    "district",
    "block",
    "scheme_title",
    "scheme_id",
    "eligibility_score",
    "verification_status"
  ];

  const escape = (val: any) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    // escape double quotes by doubling them, wrap in double quotes if contains comma/newline/quote
    if (/[,"\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [headers.join(",")];

  for (const r of rows) {
    const line = [
      escape(r.user.name),
      escape(r.user.phone),
      escape(r.user.state),
      escape(r.user.district),
      escape(r.user.block),
      escape(r.scheme?.title ?? ""),
      escape(r.scheme?.id ?? ""),
      escape(r.eligibilityScore ?? ""),
      escape(r.verificationStatus ?? "")
    ].join(",");

    lines.push(line);
  }

  return lines.join("\n");
}
