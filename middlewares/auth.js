const jwt = require("jsonwebtoken");
const { response } = require("../helpers/response.formatter");
const { auth_secret } = require("../config/base.config");

module.exports = {
  checkToken: async (req, res, next) => {
    const token = req.header("authorization");

    if (!token) {
      return res
        .status(401)
        .json(response(401, "Unauthorized", "Please login and try again!"));
    }

    try {
      const check = jwt.verify(token, auth_secret);

      req.user = check;

      next();
    } catch (error) {
      return res
        .status(401)
        .json(response(401, "Unauthorized", "Please login and try again!"));
    }
  },
};