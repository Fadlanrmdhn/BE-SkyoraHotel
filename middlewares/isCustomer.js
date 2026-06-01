const { response } = require("../helpers/response.formatter");

module.exports = {
  checkCustomer: async (req, res, next) => {
    if (req.user.role !== "customer") {
      return res.status(403).json(response(403, "Forbidden", "Customer only"));
    }

    next();
  },
};