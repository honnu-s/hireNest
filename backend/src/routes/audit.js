const express = require("express");
const authMiddleware = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleauth");
const router = express.Router();
const { buildAuditLogs } = require("../services/auditLogService.js");

router.use(authMiddleware);
router.use(authorizeRoles("RECRUITER","ADMIN"));

router.get("/audit-logs", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; 
    const logs = await buildAuditLogs(page, limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to load audit logs" });
  }
});


module.exports=router;