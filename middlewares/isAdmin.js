const { response } = require("../helpers/response.formatter");

module.exports = {
  checkAdmin: async (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json(response(403, "Forbidden", "Admin only"));
    }

    next();
  },
};