import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { UNAUTHED_ERR_MSG } from "../shared/const";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return ctx;
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("aiCopilot router - authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPendingSuggestions", () => {
    it("throws UNAUTHORIZED error when user is not authenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.aiCopilot.getPendingSuggestions()).rejects.toThrow(
        UNAUTHED_ERR_MSG
      );
    });
  });

  describe("getAllSuggestions", () => {
    it("throws UNAUTHORIZED error when user is not authenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.aiCopilot.getAllSuggestions({ status: "all", limit: 50 })
      ).rejects.toThrow(UNAUTHED_ERR_MSG);
    });
  });

  describe("getStats", () => {
    it("throws UNAUTHORIZED error when user is not authenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.aiCopilot.getStats()).rejects.toThrow(UNAUTHED_ERR_MSG);
    });
  });

  describe("getServices", () => {
    it("throws UNAUTHORIZED error when user is not authenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.aiCopilot.getServices()).rejects.toThrow(UNAUTHED_ERR_MSG);
    });
  });

  describe("approveSuggestion", () => {
    it("throws UNAUTHORIZED error when user is not authenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.aiCopilot.approveSuggestion({ suggestionId: 1 })
      ).rejects.toThrow(UNAUTHED_ERR_MSG);
    });
  });

  describe("rejectSuggestion", () => {
    it("throws UNAUTHORIZED error when user is not authenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.aiCopilot.rejectSuggestion({ suggestionId: 1 })
      ).rejects.toThrow(UNAUTHED_ERR_MSG);
    });
  });

  describe("saveConfig", () => {
    it("throws UNAUTHORIZED error when user is not authenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.aiCopilot.saveConfig({})
      ).rejects.toThrow(UNAUTHED_ERR_MSG);
    });
  });
});
