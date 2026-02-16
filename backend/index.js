require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");
const recruiterRoutes = require("./src/routes/recruiter");
const candidateRoutes = require("./src/routes/candidate");
const auditLogs=require("./src/routes/audit");
const app = express();


app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api",auditLogs);
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "ATS Backend is running" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err);
  
  if (err.message === "Only PDF files are allowed") {
    return res.status(400).json({ message: err.message });
  }
  
  if (err.message === "File too large") {
    return res.status(400).json({ message: "File size must be less than 5MB" });
  }
  
  res.status(500).json({ message: "Internal server error" });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Auth: http://localhost:${PORT}/api/auth`);
  console.log(` Admin: http://localhost:${PORT}/api/admin`);
  console.log(` Recruiter: http://localhost:${PORT}/api/recruiter`);
  console.log(` Candidate: http://localhost:${PORT}/api/candidate`);
});

module.exports = app; 

