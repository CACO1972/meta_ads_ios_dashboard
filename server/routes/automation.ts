import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { 
  startScheduler, 
  stopScheduler, 
  getSchedulerStatus,
  executeSchedulerManually,
  updateSchedulerCron,
  CRON_PRESETS
} from '../services/automation/automationScheduler';
import { TRPCError } from '@trpc/server';

/**
 * Router tRPC para control del Scheduler Automático
 * 
 * Endpoints:
 * - startScheduler: Iniciar el scheduler automático
 * - stopScheduler: Detener el scheduler automático
 * - getStatus: Obtener estado actual del scheduler
 * - executeManually: Ejecutar el scheduler manualmente (para testing)
 * - updateCron: Actualizar la expresión cron del scheduler
 * - getPresets: Obtener expresiones cron predefinidas
 */

export const automationRouter = router({
  /**
   * Iniciar el scheduler automático
   */
  startScheduler: protectedProcedure
    .input(
      z.object({
        cronExpression: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      try {
        const success = startScheduler(ctx.user.id, input.cronExpression);

        if (!success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to start scheduler',
          });
        }

        const status = getSchedulerStatus();

        return {
          success: true,
          message: 'Scheduler started successfully',
          status,
        };
      } catch (error: any) {
        console.error('[AutomationRouter] Error starting scheduler:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to start scheduler',
        });
      }
    }),

  /**
   * Detener el scheduler automático
   */
  stopScheduler: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    try {
      const success = stopScheduler();

      if (!success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to stop scheduler (may not be running)',
        });
      }

      return {
        success: true,
        message: 'Scheduler stopped successfully',
      };
    } catch (error: any) {
      console.error('[AutomationRouter] Error stopping scheduler:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to stop scheduler',
      });
    }
  }),

  /**
   * Obtener estado actual del scheduler
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    try {
      const status = getSchedulerStatus();

      return {
        success: true,
        status,
      };
    } catch (error: any) {
      console.error('[AutomationRouter] Error getting scheduler status:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to get scheduler status',
      });
    }
  }),

  /**
   * Ejecutar el scheduler manualmente (para testing)
   */
  executeManually: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    try {
      // Ejecutar en segundo plano
      executeSchedulerManually(ctx.user.id).catch((error) => {
        console.error('[AutomationRouter] Error during manual execution:', error);
      });

      return {
        success: true,
        message: 'Manual execution started in background',
      };
    } catch (error: any) {
      console.error('[AutomationRouter] Error executing scheduler manually:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to execute scheduler manually',
      });
    }
  }),

  /**
   * Actualizar la expresión cron del scheduler
   */
  updateCron: protectedProcedure
    .input(
      z.object({
        cronExpression: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      try {
        const success = updateSchedulerCron(ctx.user.id, input.cronExpression);

        if (!success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid cron expression',
          });
        }

        const status = getSchedulerStatus();

        return {
          success: true,
          message: 'Cron expression updated successfully',
          status,
        };
      } catch (error: any) {
        console.error('[AutomationRouter] Error updating cron:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to update cron expression',
        });
      }
    }),

  /**
   * Obtener expresiones cron predefinidas
   */
  getPresets: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    return {
      success: true,
      presets: CRON_PRESETS,
    };
  }),
});
