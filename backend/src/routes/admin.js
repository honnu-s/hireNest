const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../db.cjs");
const authMiddleware = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleauth");
const  appState = require("../utils/applicationStateValid");
const { addAuditLog } = require("../queue/auditQueue");
const { getUserInfo } = require("../utils/auditHelper");
const {
  validateCreateJob,
  validateCreateRecruiter,
  validateUpdateStatus,
  validateJobAssignment
} = require("../middleware/validation");

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles("ADMIN"));


router.get("/dashboard/stats", async (req, res) => {
  try {
    const [
      totalJobs,
      openJobs,
      totalRecruiters,
      activeRecruiters,
      totalCandidates,
      totalApplications
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.recruiter.count(),
      prisma.recruiter.count({ where: { status: "ACTIVE" } }),
      prisma.candidate.count(),
      prisma.application.count()
    ]);

    res.json({
      totalJobs,
      openJobs,
      closedJobs: totalJobs - openJobs,
      totalRecruiters,
      activeRecruiters,
      inactiveRecruiters: totalRecruiters - activeRecruiters,
      totalCandidates,
      totalApplications
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/jobs", async (req, res) => {
  try {
    const { limit, page } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const isDashboardPreview = limit && !page;

    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        take: isDashboardPreview ? parseInt(limit) : limitNum,
        skip: isDashboardPreview ? undefined : skip,
        orderBy: { postedDate: "desc" },
        include: {
          jobAssignments: {
            include: {
              recruiter: {
                include: {
                  user: {
                    select: { email: true }
                  }
                }
              }
            }
          },
          _count: {
            select: { applications: true }
          }
        }
      }),
      isDashboardPreview ? Promise.resolve(0) : prisma.job.count()
    ]);

    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      status: job.status.toLowerCase(),
      postedDate: job.postedDate,
      applicants: job._count.applications,
      assignedRecruiters: job.jobAssignments.map(a => ({
        id: a.recruiter.id,
        name: a.recruiter.name,
        email: a.recruiter.user.email
      }))
    }));

    if (isDashboardPreview) {
      return res.json(transformedJobs);
    }

    res.json({
      data: transformedJobs,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.post("/jobs", validateCreateJob, async (req, res) => {
  try {
    const { title, department, location, type } = req.body;

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        department: department.trim(),
        location: location.trim(),
        type,
        status: "OPEN"
      },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });
const userInfo = await getUserInfo(req.userId, req.role);

await addAuditLog({
  actionType: "create",
  entityType: "job",
  entityId: job.id,
  entityName: job.title,
  performedBy: userInfo.userId,
  performedByName: userInfo.userName,
  performedByRole: userInfo.userRole,
  details: `Job created in ${job.department}`,
});

    res.status(201).json({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      status: job.status.toLowerCase(),
      postedDate: job.postedDate,
      applicants: 0,
      assignedRecruiters: []
    });
  } catch (err) {
    console.error("Error creating job:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/jobs/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { title, department, location, type, status } = req.body;

    
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!existingJob) {
      return res.status(404).json({ message: "Job not found" });
    }

   
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (department !== undefined) updateData.department = department.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status.toUpperCase();

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        jobAssignments: {
          include: {
            recruiter: {
              include: {
                user: {
                  select: { email: true }
                }
              }
            }
          }
        },
        _count: {
          select: { applications: true }
        }
      }
    });

    // Audit log
const userInfo = await getUserInfo(req.userId, req.role);

await addAuditLog({
  actionType: "update",
  entityType: "job",
  entityId: updatedJob.id,
  entityName: updatedJob.title,
  performedBy: userInfo.userId,
  performedByName: userInfo.userName,
  performedByRole: userInfo.userRole,
  details: "Job details updated",
});

    res.json({
      id: updatedJob.id,
      title: updatedJob.title,
      department: updatedJob.department,
      location: updatedJob.location,
      type: updatedJob.type,
      status: updatedJob.status.toLowerCase(),
      postedDate: updatedJob.postedDate,
      applicants: updatedJob._count.applications,
      assignedRecruiters: updatedJob.jobAssignments.map(assignment => ({
        id: assignment.recruiter.id,
        name: assignment.recruiter.name,
        email: assignment.recruiter.user.email
      }))
    });
  } catch (err) {
    console.error("Error updating job:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/jobs/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

  const jobTitle = job.title;

  const userInfo = await getUserInfo(req.userId, req.role);

  await addAuditLog({
    actionType: "delete",
    entityType: "job",
    entityId: jobId,
    entityName: jobTitle,
    performedBy: userInfo.userId,
    performedByName: userInfo.userName,
    performedByRole: userInfo.userRole,
    details: `Job deleted from ${job.department}`,
  });

  await prisma.job.delete({
    where: { id: jobId }
  });

    res.json({
      message: "Job deleted successfully",
      deletedJobId: jobId
    });
  } catch (err) {
    console.error("Error deleting job:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/jobs/:jobId/assign", validateJobAssignment, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { recruiterIds } = req.body;

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const recruiters = await prisma.recruiter.findMany({
      where: { id: { in: recruiterIds } },
      include: {
        user: { select: { email: true } }
      }
    });

    if (recruiters.length !== recruiterIds.length) {
      return res.status(404).json({ message: "One or more recruiters not found" });
    }

    const assignmentData = recruiterIds.map(recruiterId => ({
      jobId,
      recruiterId
    }));

    const userInfo = await getUserInfo(req.userId, req.role);

    await prisma.$transaction(async (tx) => {
      await tx.jobAssignment.createMany({
        data: assignmentData,
        skipDuplicates: true
      });

      

      for (const recruiter of recruiters) {
        await tx.auditLog.create({
          data: {
            actionType: "assign",
            entityType: "job",
            entityId: jobId,
            entityName: job.title,
            performedBy: userInfo.userId,
            performedByName: userInfo.userName,
            performedByRole: userInfo.userRole,
            details: `Assigned to recruiter ${recruiter.name}`,
          }
        });
      }
    });

    const assignments = await prisma.jobAssignment.findMany({
      where: { jobId },
      include: {
        recruiter: {
          include: {
            user: { select: { email: true } }
          }
        }
      }
    });

    res.json({
      message: "Recruiters assigned successfully",
      jobId,
      assignedRecruiters: assignments.map(a => ({
        id: a.recruiter.id,
        name: a.recruiter.name,
        email: a.recruiter.user.email,
        assignedAt: a.assignedAt
      }))
    });

  } catch (err) {
    console.error("Error assigning job:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.delete("/jobs/:jobId/assign/:recruiterId", async (req, res) => {
  try {
    const { jobId, recruiterId } = req.params;

    
    const assignment = await prisma.jobAssignment.findFirst({
      where: {
        jobId,
        recruiterId
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    await prisma.jobAssignment.delete({
      where: { id: assignment.id }
    });

    res.json({ message: "Recruiter unassigned successfully" });
  } catch (err) {
    console.error("Error unassigning recruiter:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/recruiters", async (req, res) => {
  try {
    const { page, limit } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 8;
    const skip = (pageNum - 1) * limitNum;

    const [recruiters, totalCount] = await Promise.all([
      prisma.recruiter.findMany({
        take: limitNum,
        skip,
        include: {
          user: {
            select: { email: true, id: true }
          },
          _count: {
            select: { jobAssignments: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.recruiter.count()
    ]);

    const transformedRecruiters = recruiters.map(r => ({
      id: r.id,
      userId: r.user.id,
      name: r.name,
      email: r.user.email,
      department: r.department,
      status: r.status.toLowerCase(),
      assignedJobs: r._count.jobAssignments,
      createdAt: r.createdAt
    }));

    res.json({
      data: transformedRecruiters,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error("Error fetching recruiters:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/recruiters", validateCreateRecruiter, async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    
    const hashedPassword = await bcrypt.hash(password, 12);

    
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "RECRUITER",
        }
      });

      const recruiter = await tx.recruiter.create({
        data: {
          userId: newUser.id,
          name: name.trim(),
          department: department.trim(),
          status: "ACTIVE"
        }
      });

      return {
        id: newUser.id,
        email: newUser.email,
        recruiter: recruiter
      };
    });

const userInfo = await getUserInfo(req.userId, req.role);

await addAuditLog({
  actionType: "create",
  entityType: "recruiter",
  entityId: result.recruiter.id,
  entityName: result.recruiter.name,
  performedBy: userInfo.userId,
  performedByName: userInfo.userName,
  performedByRole: userInfo.userRole,
  details: `Recruiter created in ${result.recruiter.department}`,
});


    res.status(201).json({
      id: result.recruiter.id,
      userId: result.id,
      name: result.recruiter.name,
      email: result.email,
      department: result.recruiter.department,
      status: result.recruiter.status.toLowerCase(),
      assignedJobs: 0,
      createdAt: result.recruiter.createdAt
    });
  } catch (err) {
    console.error("Error creating recruiter:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/recruiters/:recruiterId", async (req, res) => {
  try {
    const { recruiterId } = req.params;
    const { name, department, status } = req.body;

    
    const existingRecruiter = await prisma.recruiter.findUnique({
      where: { id: recruiterId },
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    if (!existingRecruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (department !== undefined) updateData.department = department.trim();
    if (status !== undefined) updateData.status = status.toUpperCase();

    const updatedRecruiter = await prisma.recruiter.update({
      where: { id: recruiterId },
      data: updateData,
      include: {
        user: {
          select: { email: true }
        },
        _count: {
          select: { jobAssignments: true }
        }
      }
    });

const userInfo = await getUserInfo(req.userId, req.role);

await addAuditLog({
  actionType: "update",
  entityType: "recruiter",
  entityId: updatedRecruiter.id,
  entityName: updatedRecruiter.name,
  performedBy: userInfo.userId,
  performedByName: userInfo.userName,
  performedByRole: userInfo.userRole,
  details: "Recruiter details updated",
});


    res.json({
      id: updatedRecruiter.id,
      name: updatedRecruiter.name,
      email: updatedRecruiter.user.email,
      department: updatedRecruiter.department,
      status: updatedRecruiter.status.toLowerCase(),
      assignedJobs: updatedRecruiter._count.jobAssignments
    });
  } catch (err) {
    console.error("Error updating recruiter:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.delete("/recruiters/:recruiterId", async (req, res) => {
  try {
    const { recruiterId } = req.params;

    
    const recruiter = await prisma.recruiter.findUnique({
      where: { id: recruiterId },
      include: { user: true }
    });

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const recruiterName = recruiter.name;

const userInfo = await getUserInfo(req.userId, req.role);

await addAuditLog({
  actionType: "delete",
  entityType: "recruiter",
  entityId: recruiterId,
  entityName: recruiterName,
  performedBy: userInfo.userId,
  performedByName: userInfo.userName,
  performedByRole: userInfo.userRole,
  details: `Recruiter deleted from ${recruiter.department}`,
});

await prisma.user.delete({
  where: { id: recruiter.userId }
});


    res.json({
      message: "Recruiter deleted successfully",
      deletedRecruiterId: recruiterId
    });
  } catch (err) {
    console.error("Error deleting recruiter:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CANDIDATE MANAGEMENT
router.get("/candidates", async (req, res) => {
  try {
const { limit, page, status } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 8;
    const skip = (pageNum - 1) * limitNum;

    const isDashboardPreview = limit && !page;
    const whereClause = {};

if (status && status !== "all") {
  whereClause.status = status.toUpperCase();
}

    const [applications, totalCount] = await Promise.all([
      prisma.application.findMany({
        where:whereClause,
        take: isDashboardPreview ? parseInt(limit) : limitNum,
        skip: isDashboardPreview ? undefined : skip,
        orderBy: { appliedDate: "desc" },
        include: {
          candidate: {
            include: {
              user: { select: { email: true } }
            }
          },
          job: {
            select: { id: true, title: true }
          }
        }
      }),
isDashboardPreview
  ? Promise.resolve(0)
  : prisma.application.count({ where: whereClause })
    ]);

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

    if (isDashboardPreview) {
      return res.json(transformedCandidates);
    }

    res.json({
      data: transformedCandidates,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error("Error fetching candidates:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.put("/applications/:applicationId/status", validateUpdateStatus, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const nextStatus = status.toUpperCase();

    const VALID_STATUSES = ["APPLIED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

if (!VALID_STATUSES.includes(nextStatus)) {
  return res.status(400).json({ message: "Invalid application status" });
}

    
    const { updatedApplication, appWithDetails } = await prisma.$transaction(async (tx) => {
      const application = await tx.application.findUnique({
        where: { id: applicationId },
        include: { 
          job: true,
          candidate: true 
        },
      });

      if (!application) {
        throw new Error("Application not found");
      }

      if (application.job.status === "CLOSED") {
        throw new Error("Cannot update application for a CLOSED job");
      }

      if (application.status === "REJECTED" || application.status === "HIRED") {
        throw new Error(`Application is already ${application.status} and cannot be changed`);
      }

      try {
        appState.validateApplicationTransition(application.status, nextStatus);
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


router.delete("/candidates/:candidateId", async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const candidateName = candidate.name;

const userInfo = await getUserInfo(req.userId, req.role);

await addAuditLog({
  actionType: "delete",
  entityType: "candidate",
  entityId: candidateId,
  entityName: candidateName,
  performedBy: userInfo.userId,
  performedByName: userInfo.userName,
  performedByRole: userInfo.userRole,
  details: "Candidate deleted",
});

await prisma.user.delete({
  where: { id: candidate.userId }
});


    res.json({
      message: "Candidate deleted successfully",
      deletedCandidateId: candidateId
    });
  } catch (err) {
    console.error("Error deleting candidate:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
