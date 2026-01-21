/**
 * Lead Matching Service
 * 
 * Intelligent algorithm to match Meta Ads leads with Dentalink patients
 * Priority: Email (100%) > Phone (90%) > Fuzzy Name (70-85%)
 */

interface LeadData {
  id: number;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
}

interface PatientData {
  id: number;
  nombre: string | null;
  apellidos: string | null;
  email: string | null;
  celular: string | null;
  telefono: string | null;
}

interface MatchResult {
  leadId: number;
  patientId: number;
  matchScore: number;
  matchMethod: "email" | "phone" | "name_fuzzy";
  matchDetails: {
    emailMatch: boolean;
    phoneMatch: boolean;
    nameMatch: boolean;
    nameSimilarity?: number;
  };
}

/**
 * Normalize Chilean phone numbers
 * Removes +56, spaces, dashes, parentheses
 * Returns format: 912345678
 */
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, "");
  
  // Remove country code +56
  if (normalized.startsWith("56")) {
    normalized = normalized.substring(2);
  }
  
  // Chilean mobile numbers start with 9 and have 9 digits
  if (normalized.length === 9 && normalized.startsWith("9")) {
    return normalized;
  }
  
  // Chilean landline numbers have 8-9 digits
  if (normalized.length >= 8) {
    return normalized;
  }
  
  return null;
}

/**
 * Normalize name for comparison
 * Lowercase, trim, remove extra spaces
 */
function normalizeName(name: string | null | undefined): string | null {
  if (!name) return null;
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns edit distance (number of operations needed to transform s1 into s2)
 */
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  
  // Create 2D array for dynamic programming
  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;
  
  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }
  
  return dp[len1][len2];
}

/**
 * Calculate similarity percentage between two strings
 * Returns 0-100 based on Levenshtein distance
 */
function calculateSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  if (maxLength === 0) return 100;
  
  const similarity = ((maxLength - distance) / maxLength) * 100;
  return Math.round(similarity);
}

/**
 * Match a single lead to a single patient
 * Returns match result with scoring or null if no match
 */
function matchLeadToPatient(
  lead: LeadData,
  patient: PatientData
): MatchResult | null {
  const matchDetails = {
    emailMatch: false,
    phoneMatch: false,
    nameMatch: false,
  };
  
  // Priority 1: Email match (100% confidence)
  if (lead.email && patient.email) {
    const leadEmail = lead.email.toLowerCase().trim();
    const patientEmail = patient.email.toLowerCase().trim();
    
    if (leadEmail === patientEmail) {
      matchDetails.emailMatch = true;
      return {
        leadId: lead.id,
        patientId: patient.id,
        matchScore: 100,
        matchMethod: "email",
        matchDetails,
      };
    }
  }
  
  // Priority 2: Phone match (90% confidence)
  const leadPhone = normalizePhone(lead.telefono);
  const patientCelular = normalizePhone(patient.celular);
  const patientTelefono = normalizePhone(patient.telefono);
  
  if (leadPhone && (patientCelular || patientTelefono)) {
    if (leadPhone === patientCelular || leadPhone === patientTelefono) {
      matchDetails.phoneMatch = true;
      return {
        leadId: lead.id,
        patientId: patient.id,
        matchScore: 90,
        matchMethod: "phone",
        matchDetails,
      };
    }
  }
  
  // Priority 3: Fuzzy name match (70-85% confidence based on similarity)
  const leadFullName = normalizeName(
    `${lead.nombre || ""} ${lead.apellido || ""}`.trim()
  );
  const patientFullName = normalizeName(
    `${patient.nombre || ""} ${patient.apellidos || ""}`.trim()
  );
  
  if (leadFullName && patientFullName) {
    const similarity = calculateSimilarity(leadFullName, patientFullName);
    
    // Only consider match if similarity >= 70%
    if (similarity >= 70) {
      matchDetails.nameMatch = true;
      
      // Map similarity to score range 70-85
      // 70% similarity = 70 score
      // 100% similarity = 85 score
      const matchScore = Math.min(85, Math.max(70, Math.round(70 + (similarity - 70) * 0.5)));
      
      return {
        leadId: lead.id,
        patientId: patient.id,
        matchScore,
        matchMethod: "name_fuzzy",
        matchDetails: {
          ...matchDetails,
          nameSimilarity: similarity,
        },
      };
    }
  }
  
  // No match found
  return null;
}

/**
 * Find best match for a lead among multiple patients
 * Returns the match with highest score
 */
function findBestMatch(
  lead: LeadData,
  patients: PatientData[]
): MatchResult | null {
  let bestMatch: MatchResult | null = null;
  
  for (const patient of patients) {
    const match = matchLeadToPatient(lead, patient);
    
    if (match) {
      // Email match is always best, return immediately
      if (match.matchMethod === "email") {
        return match;
      }
      
      // Otherwise, keep track of best match
      if (!bestMatch || match.matchScore > bestMatch.matchScore) {
        bestMatch = match;
      }
    }
  }
  
  return bestMatch;
}

/**
 * Batch match multiple leads to multiple patients
 * Returns array of matches
 */
function batchMatchLeads(
  leads: LeadData[],
  patients: PatientData[]
): MatchResult[] {
  const matches: MatchResult[] = [];
  const matchedPatientIds = new Set<number>();
  
  // Sort leads to prioritize those with email (for better matching)
  const sortedLeads = [...leads].sort((a, b) => {
    if (a.email && !b.email) return -1;
    if (!a.email && b.email) return 1;
    return 0;
  });
  
  for (const lead of sortedLeads) {
    // Filter out already matched patients
    const availablePatients = patients.filter(
      (p) => !matchedPatientIds.has(p.id)
    );
    
    const match = findBestMatch(lead, availablePatients);
    
    if (match) {
      matches.push(match);
      matchedPatientIds.add(match.patientId);
    }
  }
  
  return matches;
}

// Export service functions
export const leadMatchingService = {
  normalizePhone,
  normalizeName,
  calculateSimilarity,
  matchLeadToPatient,
  findBestMatch,
  batchMatchLeads,
};
