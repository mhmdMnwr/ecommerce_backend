const {ROLE_PAGES} = require('../config/permissions.js');

const checkPermission = (requiredPage) => {
  return (req, res, next) => {
    // 1. Check if user is authenticated (req.user comes from your auth middleware)
    if (!req.currentUser || !req.currentUser.role) {
      return res.status(401).json({ message: "Unauthorized: No role assigned" });
    }

    const userRole = req.currentUser.role;
    const allowedPages = ROLE_PAGES[userRole] || [];

    // 2. Check for Super Admin wildcard
    if (allowedPages.includes("*")) {
      return next();
    }

    // 3. Check if the specific page is in the role's list
    if (allowedPages.includes(requiredPage)) {
      return next();
    }

    // 4. If no match, deny access
    return res.status(403).json({ 
      message: `Access Denied: ${userRole} does not have permission for '${requiredPage}'` 
    });
  };
};

module.exports = checkPermission;