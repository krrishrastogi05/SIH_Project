import { User, Scheme } from "@prisma/client";

// Education Ranking (Higher number = Higher education)
// This allows a "Graduate" to be eligible for "10th Pass" schemes
const eduRank: Record<string, number> = {
  "NONE": 0,
  "BELOW_MATRICULATION": 1,
  "MATRICULATION": 2,      // 10th
  "HIGHER_SECONDARY": 3,   // 12th
  "DIPLOMA": 4,
  "GRADUATION": 5,
  "POST_GRADUATION": 6,
  "PHD": 7
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

    // ---------------------------------------------------------
    // 2. CRITERIA CHECK (Dynamic JSON)
    // ---------------------------------------------------------
    const criteria = scheme.baseCriteria as any;
    if (!criteria) return true; // No criteria = eligible for everyone in location

    // Prepare User Data (Handle nulls safely)
    const uIncome = user.income ?? 0;
    const uAge = user.age ?? 0;
    const uGender = user.gender ? user.gender.toUpperCase() : "";
    const uEdu = user.education ? user.education.toUpperCase() : "NONE";

    // --- A. INCOME CHECK ---
    // Rule: User income must be LESS than or EQUAL to limit
    if (criteria.incomeLimit && uIncome > Number(criteria.incomeLimit)) {
      return false;
    }

    // --- B. AGE CHECK ---
    if (criteria.minAge && uAge < Number(criteria.minAge)) return false;
    if (criteria.maxAge && uAge > Number(criteria.maxAge)) return false;

    // --- C. GENDER CHECK ---
    // If scheme is "Female" only, and user is "Male", fail.
    if (criteria.gender && criteria.gender !== "All") {
      if (uGender !== criteria.gender.toUpperCase()) return false;
    }

    // --- D. EDUCATION CHECK (Minimum Requirement) ---
    if (criteria.minEducation) {
      const userLevel = eduRank[uEdu] || 0;
      const reqLevel = eduRank[criteria.minEducation.toUpperCase()] || 0;
      
      // If user has LESS education than required, fail
      if (userLevel < reqLevel) return false;
    }

    // --- E. OCCUPATION CHECK (Specific Match) ---
    if (criteria.occupation && criteria.occupation !== "All") {
       if (user.occupation?.toLowerCase() !== criteria.occupation.toLowerCase()) {
         return false;
       }
    }

    return true; // Passed all checks

  } catch (err) {
    console.error(`Eligibility Error User:${user.id} Scheme:${scheme.id}`, err);
    return false;
  }
};