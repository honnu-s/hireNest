const { Worker } = require('bullmq');
const prisma = require('../db.cjs');

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

const worker = new Worker(
  'audit-logs',
  async (job) => {
    const logData = job.data;

    try {
      await prisma.auditLog.create({
        data: {
          actionType: logData.actionType,
          entityType: logData.entityType,
          entityId: logData.entityId,
          entityName: logData.entityName,
          performedBy: logData.performedBy,
          performedByName: logData.performedByName,
          performedByRole: logData.performedByRole,
          details: logData.details || null,
          timestamp: new Date(),
        },
      });

      console.log(`[Audit Log] Recorded: ${logData.actionType} on ${logData.entityType} by ${logData.performedByName}`);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to store audit log:', error);
      throw error; 
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, 
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Error:', err);
});

console.log(' Audit log worker started and listening for jobs...');

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
