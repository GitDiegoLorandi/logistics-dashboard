const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if the user has the required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }

    next();
  };
};

module.exports = roleMiddleware;
