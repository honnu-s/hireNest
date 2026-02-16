const prisma = require("../db.cjs");

async function buildAuditLogs(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);

    return {
      data: logs.map(log => ({
        id: log.id,
        actionType: log.actionType,
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: log.entityName,
        performedBy: log.performedBy,
        performedByName: log.performedByName,
        timestamp: log.timestamp,
        details: log.details,
      })),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return {
      data: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
    };
  }
}


module.exports = { buildAuditLogs };
