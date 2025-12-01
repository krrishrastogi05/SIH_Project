// NOTE: This is a significant rewrite to match the new Scheme model.

// Beneficiary data remains mostly the same
export interface BeneficiaryData {
  income?: number | null;
  age?: number | null;
  education?: string | null; // e.g., "10th Pass", "Undergraduate (UG)"
  state?: string | null;
  district?: string | null;
  pincode?: string | null;
}

// The Scheme model from Prisma will be used directly
// No need for a separate SchemeRuleSet interface

export interface EligibilityResult {
  isEligible: boolean;
  // You can add more detailed breakdown if needed
}

// Helper to convert income string to a number range
function parseIncome(incomeLevel: string): [number, number] {
  if (incomeLevel.startsWith("Below")) return [0, 100000];
  if (incomeLevel.startsWith("Above")) return [600000, Infinity];
  const parts = incomeLevel.match(/₹([\d,]+)\s*–\s*₹([\d,]+)/);
  if (!parts) return [0, 0];
  const min = parseInt(parts[1].replace(/,/g, ""), 10);
  const max = parseInt(parts[2].replace(/,/g, ""), 10);
  return [min, max];
}

export function checkEligibility(
  user: BeneficiaryData,
  scheme: {
    schemeType: string;
    baseCriteria: any; // from Prisma JSON field
    state: string;
    district: string;
    pincode: string;
  }
): EligibilityResult {
  // 1. Location check (applies to all schemes)
  if (user.state !== scheme.state || user.district !== scheme.district) {
    return { isEligible: false };
  }

  const userIncome = user.income ?? 0;

  // 2. Criteria check based on schemeType
  switch (scheme.schemeType) {
    case "education": {
      const criteria = scheme.baseCriteria as {
        incomeLevel: string;
        minEducation: string;
      };
      const [minIncome, maxIncome] = parseIncome(criteria.incomeLevel);
      if (userIncome < minIncome || userIncome > maxIncome) {
        return { isEligible: false };
      }
      // NOTE: You need to implement logic to compare education levels
      // e.g., is user.education ("UG") >= criteria.minEducation ("12th Pass")?
      // This requires defining an order for education levels.
      break;
    }

    case "housing": {
      const criteria = scheme.baseCriteria as { incomeLevel: string };
      const [minIncome, maxIncome] = parseIncome(criteria.incomeLevel);
      if (userIncome < minIncome || userIncome > maxIncome) {
        return { isEligible: false };
      }
      // Housing criteria is a text description, requires manual officer review
      break;
    }

    case "employment": {
      // NOTE: Implement logic for age and education for employment
      break;
    }

    case "financial": {
      const criteria = scheme.baseCriteria as { incomeLevel: string };
      const [minIncome, maxIncome] = parseIncome(criteria.incomeLevel);
      if (userIncome < minIncome || userIncome > maxIncome) {
        return { isEligible: false };
      }
      break;
    }

    default:
      return { isEligible: false }; // Unknown scheme type
  }

  // If all checks pass for the given scheme type
  return { isEligible: true };
}
