const express = require("express");
const prisma = require("../db.cjs");
const authMiddleware = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleauth");
const { validateUpdateStatus } = require("../middleware/validation");
const { validateApplicationTransition } = require("../utils/applicationStateValid");
const { addAuditLog } = require("../queue/auditQueue");
const { getUserInfo } = require("../utils/auditHelper");

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles("RECRUITER"));



const getRecruiterId = async (userId) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId }
  });
  return recruiter?.id;
};


const getAssignedJobIds = async (recruiterId) => {
  const assignments = await prisma.jobAssignment.findMany({
    where: { recruiterId },
    select: { jobId: true }
  });
  return assignments.map(a => a.jobId);
};

// DASHBOARD STATS


router.get("/dashboard/stats", async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.userId);

    if (!recruiterId) {
      return res.status(404).json({ message: "Recruiter profile not found" });
    }

    const jobIds = await getAssignedJobIds(recruiterId);

    const [assignedJobs, openJobs, totalCandidates, pendingReview, inInterview] = await Promise.all([
      prisma.jobAssignment.count({
        where: { recruiterId }
      }),
      prisma.job.count({
        where: {
          id: { in: jobIds },
          status: "OPEN"
        }
      }),
      prisma.application.count({
        where: { jobId: { in: jobIds } }
      }),
      prisma.application.count({
        where: {
          jobId: { in: jobIds },
          status: "APPLIED"
        }
      }),
      prisma.application.count({
        where: {
          jobId: { in: jobIds },
          status: "INTERVIEW"
        }
      })
    ]);

    res.json({
      assignedJobs,
      openJobs,
      totalCandidates,
      pendingReview,
      inInterview
    });
  } catch (err) {
    console.error("Error fetching recruiter stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// JOB MANAGEMENT


router.get("/jobs", async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.userId);

    if (!recruiterId) {
      return res.status(404).json({ message: "Recruiter profile not found" });
    }

    
    const jobAssignments = await prisma.jobAssignment.findMany({
      where: { recruiterId },
      include: {
        job: {
          include: {
            _count: {
              select: { applications: true }
            }
          }
        }
      }
    });

    const jobs = jobAssignments.map(assignment => ({
      id: assignment.job.id,
      title: assignment.job.title,
      department: assignment.job.department,
      location: assignment.job.location,
      type: assignment.job.type,
      status: assignment.job.status.toLowerCase(),
      postedDate: assignment.job.postedDate,
      applicants: assignment.job._count.applications
    }));

    res.json(jobs);
  } catch (err) {
    console.error("Error fetching recruiter jobs:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CANDIDATE MANAGEMENT


router.get("/candidates", async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.userId);

    if (!recruiterId) {
      return res.status(404).json({ message: "Recruiter profile not found" });
    }

    const jobIds = await getAssignedJobIds(recruiterId);

    if (jobIds.length === 0) {
      return res.json([]);
    }

    const applications = await prisma.application.findMany({
      where: {
        jobId: { in: jobIds }
      },
      orderBy: { appliedDate: "desc" },
      include: {
        candidate: {
          include: {
            user: {
              select: { email: true }
            }
          }
        },
        job: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    const transformedCandidates = applications.map(app => ({
      id: app.id,
      candidateId: app.candidate.id,
      name: app.candidate.name,
      email: app.candidate.user.email,
      phone: app.candidate.phone,
      jobId: app.job.id,
      jobTitle: app.job.title,
      status: app.status.toLowerCase(),
      appliedDate: app.appliedDate,
      resumeUrl: app.candidate.resumeUrl
    }));

    res.json(transformedCandidates);
  } catch (err) {
    console.error("Error fetching recruiter candidates:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/applications/:applicationId/status", validateUpdateStatus, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    
    const recruiterId = await getRecruiterId(req.userId);
    const nextStatus = status.toUpperCase();

    const VALID_STATUSES = ["APPLIED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

    if (!VALID_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid application status" });
    }
    
    if (!recruiterId) {
      return res.status(404).json({ message: "Recruiter profile not found" });
    }

    const { updatedApplication, appWithDetails } = await prisma.$transaction(async (tx) => {
      const application = await tx.application.findUnique({
        where: { id: applicationId },
        include: { 
          job: true,
          candidate: true 
        }
      });

      if (!application) {
        throw new Error("Application not found");
      }

      const isAssigned = await tx.jobAssignment.findFirst({
        where: {
          jobId: application.jobId,
          recruiterId
        }
      });

      if (!isAssigned) {
        throw new Error("Access denied. You are not assigned to this job.");
      }

      if (application.job.status === "CLOSED") {
        throw new Error("Cannot update application for a CLOSED job");
      }

      if (application.status === "REJECTED" || application.status === "HIRED") {
        throw new Error(`Application is already ${application.status} and cannot be changed`);
      }

      try {
        validateApplicationTransition(application.status, nextStatus);
      } catch (err) {
        throw new Error(err.message);
      }

      const updated = await tx.application.update({
        where: { id: applicationId },
        data: { status: nextStatus }
      });

      return {
        updatedApplication: updated,
        appWithDetails: application
      };
    });

    const userInfo = await getUserInfo(req.userId, req.role);
    await addAuditLog({
      actionType: "status_change",
      entityType: "application",
      entityId: updatedApplication.id,
      entityName: `${appWithDetails.candidate.name} → ${appWithDetails.job.title}`,
      performedBy: userInfo.userId,
      performedByName: userInfo.userName,
      performedByRole: userInfo.userRole,
      details: `Application status changed to ${nextStatus}`,
    });
    
    res.json({
      id: updatedApplication.id,
      candidateId: updatedApplication.candidateId,
      jobId: updatedApplication.jobId,
      status: updatedApplication.status.toLowerCase(),
      appliedDate: updatedApplication.appliedDate,
      updatedAt: updatedApplication.updatedAt
    });
  } catch (err) {
    console.error("Error updating application status:", err);
    
    if (err.message === "Application not found") {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === "Access denied. You are not assigned to this job.") {
      return res.status(403).json({ message: err.message });
    }
    if (err.message === "Cannot update application for a CLOSED job" ||
        err.message.includes("Application is already")) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.includes("Invalid transition")) {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
