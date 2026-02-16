const prisma = require("../db.cjs");


async function getUserInfo(userId, role) {
  try {
    let userName = 'System';
    
    if (role === 'ADMIN') {
      const admin = await prisma.admin.findUnique({
        where: { userId },
      });
      userName = admin?.name || 'Admin';
    } else if (role === 'RECRUITER') {
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId },
      });
      userName = recruiter?.name || 'Recruiter';
    } else if (role === 'CANDIDATE') {
      const candidate = await prisma.candidate.findUnique({
        where: { userId },
      });
      userName = candidate?.name || 'Candidate';
    }

    return {
      userId,
      userName,
      userRole: role,
    };
  } catch (error) {
    console.error('Error getting user info for audit:', error);
    return {
      userId: userId || 'SYSTEM',
      userName: 'Unknown',
      userRole: role || 'SYSTEM',
    };
  }
}

module.exports = {
  getUserInfo,
};
