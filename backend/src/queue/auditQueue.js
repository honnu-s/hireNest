const { Queue } = require('bullmq');

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

const auditQueue = new Queue('audit-logs', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, 
      count: 100, 
    },
    removeOnFail: {
      age: 24 * 3600, 
    },
  },
});


async function addAuditLog(logData) {
  try {
    await auditQueue.add('audit-log', logData, {
      priority: 10, 
    });
  } catch (error) {
    console.error('Failed to add audit log to queue:', error);
  }
}

module.exports = {
  auditQueue,
  addAuditLog,
};
