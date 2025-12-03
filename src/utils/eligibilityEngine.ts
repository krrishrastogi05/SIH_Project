import { User, Scheme } from "@prisma/client";

// Education Ranking (Higher number = Higher education)
const eduRank: Record<string, number> = {
  "MATRICULATION": 1,
  "HIGHER_SECONDARY": 2,
  "DIPLOMA": 2,
  "GRADUATION": 3,
  "POST_GRADUATION": 4,
  "PHD": 5
};

export const checkEligibility = (user: User, scheme: Scheme): boolean => {
  try {
    // ---------------------------------------------------------
    // 1. LOCATION CHECK (Fast Fail)
    // ---------------------------------------------------------
    // State Check
    if (scheme.state !== "All" && scheme.state !== "" && user.state !== scheme.state) {
        return false;
    }
    // District Check
    if (scheme.district !== "All" && scheme.district !== "" && user.district !== scheme.district) {
        return false;
    }
    // Pincode Check (Strict match if scheme has specific pincode)
    if (scheme.pincode && scheme.pincode !== "All" && scheme.pincode !== "") {
        if (user.pincode !== scheme.pincode) return false;
    }

    // ---------------------------------------------------------
    // 2. CRITERIA CHECK (Based on Scheme Type)
    // ---------------------------------------------------------
    const criteria = scheme.baseCriteria as any;
    if (!criteria) return true; // No criteria = eligible

    const userIncome = user.income ?? 0;
    const userAge = user.age ?? 0;

    // --- A. EDUCATION SCHEMES ---
    if (scheme.schemeType === "education") {
      // Income Limit (Upper Bound)
      if (criteria.incomeLevel && userIncome > parseInt(criteria.incomeLevel)) return false;
      
      // Min Education (Lower Bound)
      if (criteria.minEducation) {
        const userLevel = eduRank[user.education || ""] || 0;
        const reqLevel = eduRank[criteria.minEducation] || 0;
        if (userLevel < reqLevel) return false;
      }
    }

    // --- B. HOUSING SCHEMES ---
    else if (scheme.schemeType === "housing") {
      if (criteria.incomeLevel && userIncome > parseInt(criteria.incomeLevel)) return false;
    }

    // --- C. EMPLOYMENT SCHEMES ---
    else if (scheme.schemeType === "employment") {
      // Age Limit (Upper Bound)
      if (criteria.ageLimit && userAge > parseInt(criteria.ageLimit)) return false;
      
      // Min Education
      if (criteria.minEducation) {
        const userLevel = eduRank[user.education || ""] || 0;
        const reqLevel = eduRank[criteria.minEducation] || 0;
        if (userLevel < reqLevel) return false;
      }
    }

    // --- D. FINANCIAL SCHEMES ---
    else if (scheme.schemeType === "financial") {
      if (criteria.incomeLevel && userIncome > parseInt(criteria.incomeLevel)) return false;
    }

    return true; // Passed all checks
  } catch (err) {
    console.error(`Eligibility Error User:${user.id} Scheme:${scheme.id}`, err);
    return false;
  }
};