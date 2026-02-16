
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
};

const validatePhone = (phone) => {
  return /^\d{10}$/.test(phone);
};

const validateCreateJob = (req, res, next) => {
  const { title, department, location, type } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3 || title.length > 200) {
    errors.push("Title must be between 3 and 200 characters");
  }

  if (!department || department.trim().length < 2 || department.length > 100) {
    errors.push("Department must be between 2 and 100 characters");
  }

  if (!location || location.trim().length < 2 || location.length > 100) {
    errors.push("Location must be between 2 and 100 characters");
  }

  const validTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"];
  if (!type || !validTypes.includes(type)) {
    errors.push("Type must be one of: FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP");
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  next();
};

const validateCreateRecruiter = (req, res, next) => {
  const { name, email, password, department } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2 || name.length > 100) {
    errors.push("Name must be between 2 and 100 characters");
  }

  if (!email || !validateEmail(email)) {
    errors.push("Valid email is required");
  }

  if (!password || !validatePassword(password)) {
    errors.push("Password must be at least 8 characters with uppercase, number, and special character");
  }

  if (!department || department.trim().length < 2 || department.length > 100) {
    errors.push("Department must be between 2 and 100 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  next();
};

const validateUpdateStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ["APPLIED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid status",
      errors: ["Status must be one of: APPLIED, INTERVIEW, OFFER, HIRED, REJECTED"]
    });
  }

  next();
};

const validateJobAssignment = (req, res, next) => {
  const { recruiterIds } = req.body;

  if (!recruiterIds || !Array.isArray(recruiterIds) || recruiterIds.length === 0) {
    return res.status(400).json({
      message: "Validation failed",
      errors: ["recruiterIds must be a non-empty array"]
    });
  }

  next();
};

const validateApplyJob = (req, res, next) => {
  const { jobId } = req.body;

  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({
      message: "Validation failed",
      errors: ["jobId is required"]
    });
  }

  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateCreateJob,
  validateCreateRecruiter,
  validateUpdateStatus,
  validateJobAssignment,
  validateApplyJob
};
