import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  CRON_PRESETS,
} from './automationScheduler';

describe('Automation Scheduler', () => {
  beforeEach(() => {
    // Asegurarse de que el scheduler esté detenido antes de cada test
    stopScheduler();
    // Esperar un poco para asegurar limpieza completa
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Limpiar después de cada test
    stopScheduler();
  });

  describe('startScheduler', () => {
    it('should start the scheduler with default cron expression', () => {
      const userId = 1;
      const result = startScheduler(userId);

      expect(result).toBe(true);

      const status = getSchedulerStatus();
      expect(status.enabled).toBe(true);
      expect(status.cronExpression).toBe(CRON_PRESETS.EVERY_HOUR);
    });

    it('should start the scheduler with custom cron expression', () => {
      const userId = 1;
      const customCron = CRON_PRESETS.EVERY_2_HOURS;
      const result = startScheduler(userId, customCron);

      expect(result).toBe(true);

      const status = getSchedulerStatus();
      expect(status.enabled).toBe(true);
      expect(status.cronExpression).toBe(customCron);
    });

    it('should reject invalid cron expression', () => {
      const userId = 1;
      const invalidCron = 'invalid cron';
      const result = startScheduler(userId, invalidCron);

      expect(result).toBe(false);

      const status = getSchedulerStatus();
      expect(status.enabled).toBe(false);
    });

    it('should restart scheduler if already running', () => {
      const userId = 1;

      // Iniciar con expresión por defecto
      startScheduler(userId, CRON_PRESETS.EVERY_HOUR);
      let status = getSchedulerStatus();
      expect(status.cronExpression).toBe(CRON_PRESETS.EVERY_HOUR);

      // Reiniciar con nueva expresión
      startScheduler(userId, CRON_PRESETS.EVERY_6_HOURS);
      status = getSchedulerStatus();
      expect(status.enabled).toBe(true);
      expect(status.cronExpression).toBe(CRON_PRESETS.EVERY_6_HOURS);
    });
  });

  describe('stopScheduler', () => {
    it('should stop a running scheduler', () => {
      const userId = 1;

      // Iniciar scheduler
      startScheduler(userId);
      let status = getSchedulerStatus();
      expect(status.enabled).toBe(true);

      // Detener scheduler
      const result = stopScheduler();
      expect(result).toBe(true);

      status = getSchedulerStatus();
      expect(status.enabled).toBe(false);
      expect(status.nextRun).toBeNull();
    });

    it('should return false if scheduler is not running', () => {
      const result = stopScheduler();
      expect(result).toBe(false);
    });
  });

  describe('getSchedulerStatus', () => {
    it('should return disabled status when scheduler is not running', () => {
      const status = getSchedulerStatus();

      expect(status.enabled).toBe(false);
      expect(status.lastRun).toBeNull();
      expect(status.nextRun).toBeNull();
    });

    it('should return enabled status when scheduler is running', () => {
      const userId = 1;
      startScheduler(userId, CRON_PRESETS.EVERY_HOUR);

      const status = getSchedulerStatus();

      expect(status.enabled).toBe(true);
      expect(status.cronExpression).toBe(CRON_PRESETS.EVERY_HOUR);
      expect(status.nextRun).not.toBeNull();
    });

    it('should calculate next run time correctly for hourly schedule', () => {
      const userId = 1;
      startScheduler(userId, CRON_PRESETS.EVERY_HOUR);

      const status = getSchedulerStatus();
      const now = new Date();
      const nextRun = status.nextRun;

      expect(nextRun).not.toBeNull();
      if (nextRun) {
        // La próxima ejecución debe ser en la próxima hora en punto
        expect(nextRun.getMinutes()).toBe(0);
        expect(nextRun.getSeconds()).toBe(0);
        expect(nextRun.getMilliseconds()).toBe(0);
        expect(nextRun.getTime()).toBeGreaterThan(now.getTime());
      }
    });
  });

  describe('CRON_PRESETS', () => {
    it('should have valid cron expressions', () => {
      expect(CRON_PRESETS.EVERY_HOUR).toBe('0 * * * *');
      expect(CRON_PRESETS.EVERY_2_HOURS).toBe('0 */2 * * *');
      expect(CRON_PRESETS.EVERY_4_HOURS).toBe('0 */4 * * *');
      expect(CRON_PRESETS.EVERY_6_HOURS).toBe('0 */6 * * *');
      expect(CRON_PRESETS.EVERY_DAY_9AM).toBe('0 9 * * *');
      expect(CRON_PRESETS.EVERY_DAY_NOON).toBe('0 12 * * *');
    });

    it('should allow starting scheduler with all presets', () => {
      const userId = 1;

      Object.values(CRON_PRESETS).forEach((cronExpression) => {
        const result = startScheduler(userId, cronExpression);
        expect(result).toBe(true);

        const status = getSchedulerStatus();
        expect(status.enabled).toBe(true);
        expect(status.cronExpression).toBe(cronExpression);

        stopScheduler();
      });
    });
  });

  describe('Scheduler Configuration', () => {
    it('should maintain configuration after stopping', () => {
      const userId = 1;
      const customCron = CRON_PRESETS.EVERY_4_HOURS;

      startScheduler(userId, customCron);
      stopScheduler();

      const status = getSchedulerStatus();
      expect(status.cronExpression).toBe(customCron);
      expect(status.enabled).toBe(false);
    });

    it('should reset nextRun when stopped', () => {
      const userId = 1;

      startScheduler(userId);
      let status = getSchedulerStatus();
      expect(status.nextRun).not.toBeNull();

      stopScheduler();
      status = getSchedulerStatus();
      expect(status.nextRun).toBeNull();
    });
  });
});
