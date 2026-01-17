import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { dentalinkCredentials, dentalinkPatients, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Dentalink Integration", () => {
  let testUserId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available for testing");
    }
    
    // Create a test user first
    const testOpenId = "test_dentalink_user_999999";
    await db.insert(users).values({
      openId: testOpenId,
      name: "Test User",
      email: "test@dentalink.test",
      role: "user",
    }).onDuplicateKeyUpdate({ set: { name: "Test User" } });
    
    const result = await db.select().from(users).where(eq(users.openId, testOpenId)).limit(1);
    testUserId = result[0].id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (db) {
      await db.delete(dentalinkCredentials).where(eq(dentalinkCredentials.userId, testUserId));
      await db.delete(dentalinkPatients).where(eq(dentalinkPatients.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe("Database Schema", () => {
    it("should have dentalinkCredentials table", async () => {
      expect(db).toBeDefined();
      const result = await db.select().from(dentalinkCredentials).limit(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should have dentalinkPatients table", async () => {
      expect(db).toBeDefined();
      const result = await db.select().from(dentalinkPatients).limit(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should insert and retrieve credentials", async () => {
      if (!db) throw new Error("DB not available");

      // Insert test credentials
      await db.insert(dentalinkCredentials).values({
        userId: testUserId,
        apiToken: "test_token_12345",
        isActive: true,
      });

      // Retrieve credentials
      const result = await db
        .select()
        .from(dentalinkCredentials)
        .where(eq(dentalinkCredentials.userId, testUserId))
        .limit(1);

      expect(result.length).toBe(1);
      expect(result[0].apiToken).toBe("test_token_12345");
      expect(result[0].isActive).toBe(true);
    });

    it("should insert and retrieve patient", async () => {
      if (!db) throw new Error("DB not available");

      // Insert test patient
      await db.insert(dentalinkPatients).values({
        userId: testUserId,
        dentalinkId: 12345,
        nombre: "Juan",
        apellidos: "Pérez",
        rut: "12345678-9",
        email: "juan.perez@test.com",
        celular: "+56912345678",
      });

      // Retrieve patient
      const result = await db
        .select()
        .from(dentalinkPatients)
        .where(eq(dentalinkPatients.userId, testUserId))
        .limit(1);

      expect(result.length).toBe(1);
      expect(result[0].nombre).toBe("Juan");
      expect(result[0].apellidos).toBe("Pérez");
      expect(result[0].email).toBe("juan.perez@test.com");
    });
  });

  describe("Dentalink Service", () => {
    it("should export dentalinkService", async () => {
      const { dentalinkService } = await import("./services/dentalinkService");
      expect(dentalinkService).toBeDefined();
      expect(typeof dentalinkService.setCredentials).toBe("function");
      expect(typeof dentalinkService.getPatients).toBe("function");
      expect(typeof dentalinkService.getAppointments).toBe("function");
      expect(typeof dentalinkService.getTreatments).toBe("function");
    });
  });

  describe("Dentalink Sync Service", () => {
    it("should export dentalinkSyncService", async () => {
      const { dentalinkSyncService } = await import("./services/dentalinkSyncService");
      expect(dentalinkSyncService).toBeDefined();
      expect(typeof dentalinkSyncService.start).toBe("function");
      expect(typeof dentalinkSyncService.stop).toBe("function");
    });
  });

  describe("Dentalink Router", () => {
    it("should export dentalinkRouter", async () => {
      const { dentalinkRouter } = await import("./routers/dentalink");
      expect(dentalinkRouter).toBeDefined();
    });
  });
});
