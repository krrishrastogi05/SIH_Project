// Pure TypeScript eligibility engine
export interface BeneficiaryData {
  income?: number | null;
  age?: number | null;
  gender?: string | null;

  state?: string | null;
  district?: string | null;
  block?: string | null;

  documents?: string[]; // cloudinary urls (optional)
}

export interface SchemeRuleSet {
  incomeRequired: boolean;
  minIncome?: number | null;
  maxIncome?: number | null;

  regionType: string; // "state" | "district" | "block"
  state?: string | null;
  district?: string | null;
  block?: string | null;

  additionalDocs?: Record<string, any>;
}

export interface EligibilityResult {
  passedRules: number;
  totalRules: number;
  eligibilityScore: number;
  isEligible: boolean;
  breakdown: Record<string, boolean>;
}

export function checkEligibility(
  user: BeneficiaryData,
  scheme: SchemeRuleSet
): EligibilityResult {
  let total = 0;
  let passed = 0;
  const breakdown: Record<string, boolean> = {};

  // -------------------------
  // 1. Region Matching
  // -------------------------
  total++;

  let regionPass = false;

  if (scheme.regionType === "state") {
    regionPass = user.state === scheme.state;
  } else if (scheme.regionType === "district") {
    regionPass = user.state === scheme.state && user.district === scheme.district;
  } else if (scheme.regionType === "block") {
    regionPass = (
      user.state === scheme.state &&
      user.district === scheme.district &&
      user.block === scheme.block
    );
  }

  breakdown.region = regionPass;
  if (regionPass) passed++;

  // -------------------------
  // 2. Income Rule
  // -------------------------
  if (scheme.incomeRequired) {
    total++;

    const incomePass =
      (scheme.minIncome == null || (user.income ?? 0) >= scheme.minIncome) &&
      (scheme.maxIncome == null || (user.income ?? 0) <= scheme.maxIncome);

    breakdown.income = incomePass;
    if (incomePass) passed++;
  }

  // -------------------------
  // 3. Additional Documents
  // -------------------------
  if (scheme.additionalDocs && Object.keys(scheme.additionalDocs).length > 0) {
    total++;

    const userDocs = user.documents || [];
    const reqDocs = Object.keys(scheme.additionalDocs);

    const docPass = reqDocs.every((doc) =>
      userDocs.some((url) => url.toLowerCase().includes(doc.toLowerCase()))
    );

    breakdown.documents = docPass;
    if (docPass) passed++;
  }

  // Final score
  const score = total === 0 ? 0 : Math.round((passed / total) * 100);

  return {
    passedRules: passed,
    totalRules: total,
    eligibilityScore: score,
    isEligible: passed === total,
    breakdown
  };
}
