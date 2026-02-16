const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const prisma = require("../db.cjs");
const authMiddleware = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleauth");
const { validateApplyJob } = require("../middleware/validation");

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles("CANDIDATE"));


const uploadsDir = path.join(__dirname, "../../uploads/resumes");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.userId}-${Date.now()}.pdf`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});

// HELPER FUNCTIONS



const getCandidateId = async (userId) => {
  const candidate = await prisma.candidate.findUnique({
    where: { userId }
  });
  return candidate?.id;
};

// DASHBOARD STATS


router.get("/dashboard/stats", async (req, res) => {
  try {
    const candidateId = await getCandidateId(req.userId);

    if (!candidateId) {
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    const [totalApplications, activeApplications, interviews, offers] = await Promise.all([
      prisma.application.count({
        where: { candidateId }
      }),
      prisma.application.count({
        where: {
          candidateId,
          status: { in: ["APPLIED", "INTERVIEW", "OFFER"] }
        }
      }),
      prisma.application.count({
        where: {
          candidateId,
          status: "INTERVIEW"
        }
      }),
      prisma.application.count({
        where: {
          candidateId,
          status: "OFFER"
        }
      })
    ]);

    res.json({
      totalApplications,
      activeApplications,
      interviews,
      offers
    });
  } catch (err) {
    console.error("Error fetching candidate stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// JOB BROWSING


router.get("/jobs", async (req, res) => {
  try {
    const { department, location, type } = req.query;
    const candidateId = await getCandidateId(req.userId);

    if (!candidateId) {
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    const where = { status: "OPEN" };
    if (department) where.department = department;
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (type) where.type = type;

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { postedDate: "desc" },
      include: {
        _count: {
          select: { applications: true }
        },
        applications: {
          where: { candidateId },
          select: { id: true }
        }
      }
    });

    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      postedDate: job.postedDate,
      applicants: job._count.applications,
      hasApplied: job.applications.length > 0
    }));

    res.json(transformedJobs);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// APPLICATION MANAGEMENT


router.get("/applications", async (req, res) => {
  try {
    const candidateId = await getCandidateId(req.userId);

    if (!candidateId) {
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    const applications = await prisma.application.findMany({
      where: { candidateId },
      orderBy: { appliedDate: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            department: true,
            location: true
          }
        }
      }
    });

    const transformedApplications = applications.map(app => ({
      id: app.id,
      jobId: app.job.id,
      jobTitle: app.job.title,
      department: app.job.department,
      location: app.job.location,
      status: app.status.toLowerCase(),
      appliedDate: app.appliedDate,
      updatedAt: app.updatedAt
    }));

    res.json(transformedApplications);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/applications", validateApplyJob, async (req, res) => {
  try {
    const { jobId } = req.body;
    const candidateId = await getCandidateId(req.userId);

    if (!candidateId) {
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    const application = await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        throw new Error("Job not found");
      }

      if (job.status === "CLOSED") {
        throw new Error("Cannot apply to a closed job");
      }

      if (job.status !== "OPEN") {
        throw new Error("This job is no longer accepting applications");
      }

      const existingApplication = await tx.application.findFirst({
        where: {
          candidateId,
          jobId
        }
      });

      if (existingApplication) {
        throw new Error("You have already applied to this job");
      }

      return await tx.application.create({
        data: {
          candidateId,
          jobId,
          status: "APPLIED"
        }
      });
    });

    res.status(201).json({
      id: application.id,
      candidateId: application.candidateId,
      jobId: application.jobId,
      status: application.status.toLowerCase(),
      appliedDate: application.appliedDate
    });
  } catch (err) {
    console.error("Error creating application:", err);
    
    if (err.message === "Job not found") {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === "Cannot apply to a closed job" || 
        err.message === "This job is no longer accepting applications") {
      return res.status(400).json({ message: err.message });
    }
    if (err.message === "You have already applied to this job") {
      return res.status(409).json({ message: err.message });
    }
    
    if (err.code === "P2002") {
      return res.status(409).json({ message: "You have already applied to this job" });
    }
    
    res.status(500).json({ message: "Server error" });
  }
});

// RESUME MANAGEMENT


router.post("/resume/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const candidateId = await getCandidateId(req.userId);

    if (!candidateId) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    const { oldResumeUrl, resumeUrl } = await prisma.$transaction(async (tx) => {
      const candidate = await tx.candidate.findUnique({
        where: { id: candidateId }
      });

      const newResumeUrl = `/uploads/resumes/${req.file.filename}`;

      await tx.candidate.update({
        where: { id: candidateId },
        data: { resumeUrl: newResumeUrl }
      });

      return {
        oldResumeUrl: candidate.resumeUrl,
        resumeUrl: newResumeUrl
      };
    });

    if (oldResumeUrl) {
      const oldFilePath = path.join(__dirname, "../../uploads/resumes", path.basename(oldResumeUrl));
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    res.json({
      message: "Resume uploaded successfully",
      resumeUrl
    });
  } catch (err) {
    console.error("Error uploading resume:", err);
    
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/resume/download", async (req, res) => {
  try {
    const candidateId = await getCandidateId(req.userId);

    if (!candidateId) {
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate.resumeUrl) {
      return res.status(404).json({ message: "No resume uploaded" });
    }

    const filePath = path.join(__dirname, "../../uploads/resumes", path.basename(candidate.resumeUrl));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Resume file not found" });
    }

    res.download(filePath);
  } catch (err) {
    console.error("Error downloading resume:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PROFILE MANAGEMENT


router.get("/profile", async (req, res) => {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { userId: req.userId },
      include: {
        user: {
          select: { email: true, id: true }
        }
      }
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    res.json({
      id: candidate.id,
      userId: candidate.user.id,
      name: candidate.name,
      email: candidate.user.email,
      phone: candidate.phone,
      resumeUrl: candidate.resumeUrl,
      createdAt: candidate.createdAt
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/profile", async (req, res) => {
  try {
    const { name, phone } = req.body;
    const candidateId = await getCandidateId(req.userId);

    if (!candidateId) {
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ message: "Phone must be exactly 10 digits" });
      }
      updateData.phone = phone;
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: updateData,
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    res.json({
      id: updatedCandidate.id,
      name: updatedCandidate.name,
      email: updatedCandidate.user.email,
      phone: updatedCandidate.phone,
      resumeUrl: updatedCandidate.resumeUrl
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
