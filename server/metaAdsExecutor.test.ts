/**
 * Tests for Meta Ads Executor Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import {
  pauseAd,
  activateAd,
  pauseAdset,
  pauseCampaign,
  changeAdsetBudget,
  changeCampaignBudget,
  executeSuggestionAction,
  rollbackAction,
} from './services/metaAdsExecutor';

const mockCredentials = {
  accessToken: 'test_access_token_123',
  adAccountId: 'act_123456789',
};

describe('Meta Ads Executor Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('pauseAd', () => {
    it('should pause an active ad successfully', async () => {
      // Mock GET request for current status
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'ACTIVE',
            effective_status: 'ACTIVE',
            name: 'Test Ad',
          }),
        })
        // Mock POST request to pause
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        // Mock GET request for new status
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'PAUSED',
            effective_status: 'PAUSED',
            name: 'Test Ad',
          }),
        });

      const result = await pauseAd('123456789', mockCredentials);

      expect(result.success).toBe(true);
      expect(result.action).toBe('pause_ad');
      expect(result.targetId).toBe('123456789');
      expect(result.targetType).toBe('ad');
      expect(result.previousState?.status).toBe('ACTIVE');
      expect(result.newState?.status).toBe('PAUSED');
    });

    it('should return success if ad is already paused', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'PAUSED',
          effective_status: 'PAUSED',
          name: 'Test Ad',
        }),
      });

      const result = await pauseAd('123456789', mockCredentials);

      expect(result.success).toBe(true);
      expect(result.metaApiResponse?.message).toBe('Ad already paused');
    });

    it('should return error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Invalid ad ID' },
        }),
      });

      const result = await pauseAd('invalid_id', mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid ad ID');
    });
  });

  describe('activateAd', () => {
    it('should activate a paused ad successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'PAUSED',
            effective_status: 'PAUSED',
            name: 'Test Ad',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'ACTIVE',
            effective_status: 'ACTIVE',
            name: 'Test Ad',
          }),
        });

      const result = await activateAd('123456789', mockCredentials);

      expect(result.success).toBe(true);
      expect(result.action).toBe('activate_ad');
      expect(result.previousState?.status).toBe('PAUSED');
      expect(result.newState?.status).toBe('ACTIVE');
    });

    it('should return success if ad is already active', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ACTIVE',
          effective_status: 'ACTIVE',
          name: 'Test Ad',
        }),
      });

      const result = await activateAd('123456789', mockCredentials);

      expect(result.success).toBe(true);
      expect(result.metaApiResponse?.message).toBe('Ad already active');
    });
  });

  describe('changeAdsetBudget', () => {
    it('should change adset budget successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            daily_budget: '10000',
            name: 'Test Adset',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            daily_budget: '20000',
            name: 'Test Adset',
          }),
        });

      const result = await changeAdsetBudget('123456789', 20000, mockCredentials);

      expect(result.success).toBe(true);
      expect(result.action).toBe('change_budget');
      expect(result.targetType).toBe('adset');
      expect(result.previousState?.daily_budget).toBe('10000');
      expect(result.newState?.daily_budget).toBe('20000');
    });
  });

  describe('executeSuggestionAction', () => {
    it('should route pause_ad action correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'ACTIVE',
            effective_status: 'ACTIVE',
            name: 'Test Ad',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'PAUSED',
            effective_status: 'PAUSED',
            name: 'Test Ad',
          }),
        });

      const result = await executeSuggestionAction(
        'pause_ad',
        'ad',
        '123456789',
        {},
        mockCredentials
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('pause_ad');
    });

    it('should return error for unknown action', async () => {
      const result = await executeSuggestionAction(
        'unknown_action',
        'ad',
        '123456789',
        {},
        mockCredentials
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });

    it('should route scale_budget to adset correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            daily_budget: '10000',
            name: 'Test Adset',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            daily_budget: '15000',
            name: 'Test Adset',
          }),
        });

      const result = await executeSuggestionAction(
        'scale_budget',
        'adset',
        '123456789',
        { daily_budget: 15000 },
        mockCredentials
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('change_budget');
    });
  });

  describe('rollbackAction', () => {
    it('should rollback a pause action', async () => {
      const executionResult = {
        success: true,
        action: 'pause_ad',
        targetId: '123456789',
        targetType: 'ad',
        previousState: { status: 'ACTIVE', effectiveStatus: 'ACTIVE', name: 'Test Ad' },
        newState: { status: 'PAUSED', effectiveStatus: 'PAUSED', name: 'Test Ad' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await rollbackAction(executionResult, mockCredentials);

      expect(result.success).toBe(true);
      expect(result.action).toBe('rollback');
    });

    it('should fail rollback without previous state', async () => {
      const executionResult = {
        success: true,
        action: 'pause_ad',
        targetId: '123456789',
        targetType: 'ad',
      };

      const result = await rollbackAction(executionResult, mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No previous state');
    });
  });
});
