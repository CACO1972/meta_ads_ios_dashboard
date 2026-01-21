/**
 * Auto Matching Service
 * 
 * Automatically matches new leads with Dentalink patients
 * Runs after patient synchronization
 */

import { getDb } from "../db";
import { metaAdsLeads, leadPatientMatches, dentalinkPatients } from "../../drizzle/schema";
import { leadMatchingService } from "./leadMatchingService";
import { eq, and, isNull } from "drizzle-orm";

interface AutoMatchResult {
  totalLeads: number;
  matchedLeads: number;
  newMatches: number;
  skippedLeads: number;
}

/**
 * Run automatic matching for a specific user
 * Matches unmatched leads with available patients
 */
export async function runAutoMatching(userId: number): Promise<AutoMatchResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log(`[AutoMatching] Starting for user ${userId}`);
  
  try {
    // Get all unmatched leads for this user
    const unmatchedLeads = await db
      .select()
      .from(metaAdsLeads)
      .leftJoin(
        leadPatientMatches,
        and(
          eq(leadPatientMatches.leadId, metaAdsLeads.id),
          eq(leadPatientMatches.userId, userId)
        )
      )
      .where(
        and(
          eq(metaAdsLeads.userId, userId),
          isNull(leadPatientMatches.id) // No existing match
        )
      );
    
    const totalLeads = unmatchedLeads.length;
    
    if (totalLeads === 0) {
      console.log(`[AutoMatching] No unmatched leads found for user ${userId}`);
      return {
        totalLeads: 0,
        matchedLeads: 0,
        newMatches: 0,
        skippedLeads: 0,
      };
    }
    
    console.log(`[AutoMatching] Found ${totalLeads} unmatched leads`);
    
    // Get all patients for this user
    const patients = await db
      .select()
      .from(dentalinkPatients)
      .where(eq(dentalinkPatients.userId, userId));
    
    console.log(`[AutoMatching] Found ${patients.length} patients`);
    
    if (patients.length === 0) {
      console.log(`[AutoMatching] No patients found for user ${userId}`);
      return {
        totalLeads,
        matchedLeads: 0,
        newMatches: 0,
        skippedLeads: totalLeads,
      };
    }
    
    // Prepare leads data for matching
    const leadsData = unmatchedLeads.map((row: any) => ({
      id: row.metaAdsLeads.id,
      nombre: row.metaAdsLeads.nombre,
      apellido: row.metaAdsLeads.apellido,
      email: row.metaAdsLeads.email,
      telefono: row.metaAdsLeads.telefono,
    }));
    
    // Prepare patients data for matching
    const patientsData = patients.map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      apellidos: p.apellidos,
      email: p.email,
      celular: p.celular,
      telefono: p.telefono,
    }));
    
    // Run batch matching
    const matches = leadMatchingService.batchMatchLeads(leadsData, patientsData);
    
    console.log(`[AutoMatching] Found ${matches.length} potential matches`);
    
    // Insert matches into database
    let newMatches = 0;
    for (const match of matches) {
      try {
        await db.insert(leadPatientMatches).values({
          userId,
          leadId: match.leadId,
          patientId: match.patientId,
          matchScore: match.matchScore,
          matchMethod: match.matchMethod,
          matchDetails: match.matchDetails as any,
          status: "pending", // Requires manual review
        });
        newMatches++;
      } catch (error) {
        console.error(`[AutoMatching] Error inserting match for lead ${match.leadId}:`, error);
      }
    }
    
    const result = {
      totalLeads,
      matchedLeads: matches.length,
      newMatches,
      skippedLeads: totalLeads - matches.length,
    };
    
    console.log(`[AutoMatching] Completed for user ${userId}:`, result);
    
    return result;
  } catch (error) {
    console.error(`[AutoMatching] Error for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Run automatic matching for all users
 * Can be called periodically or after sync
 */
export async function runAutoMatchingForAllUsers(): Promise<Map<number, AutoMatchResult>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log("[AutoMatching] Starting for all users");
  
  try {
    // Get all unique user IDs from leads
    const usersWithLeads = await db
      .selectDistinct({ userId: metaAdsLeads.userId })
      .from(metaAdsLeads);
    
    const results = new Map<number, AutoMatchResult>();
    
    for (const { userId } of usersWithLeads) {
      try {
        const result = await runAutoMatching(userId);
        results.set(userId, result);
      } catch (error) {
        console.error(`[AutoMatching] Error for user ${userId}:`, error);
      }
    }
    
    console.log(`[AutoMatching] Completed for ${results.size} users`);
    
    return results;
  } catch (error) {
    console.error("[AutoMatching] Error running for all users:", error);
    throw error;
  }
}
