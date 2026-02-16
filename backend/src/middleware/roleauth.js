const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.role;

    if (!userRole) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "Access denied. Insufficient permissions.",
        requiredRoles: allowedRoles,
        yourRole: userRole
      });
    }

    next();
  };
};

module.exports = authorizeRoles;