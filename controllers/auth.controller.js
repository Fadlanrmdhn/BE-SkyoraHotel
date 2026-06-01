const Validator = require("fastest-validator");
const v = new Validator();
const { User } = require("../models");
const { response } = require("../helpers/response.formatter");
const passwordHash = require("password-hash");
const { auth_secret } = require("../config/base.config");
const jwt = require("jsonwebtoken");

module.exports = {
  register: async (req, res) => {
    try {
      const { first_name, last_name, email, password } = req.body;

      const schema = {
        first_name: { type: "string", min: 3 },
        last_name: { type: "string", min: 3 },
        email: { type: "email" },
        password: { type: "string", min: 6 },
      };

      const data = { first_name, last_name, email, password };

      const validate = v.validate(data, schema);
      if (validate.length > 0) {
        return res.status(400).json(response(400, "Validasi Error", validate));
      }

      const userExist = await User.findOne({ where: { email } });

      if (userExist) {
        return res
          .status(400)
          .json(response(400, "Validasi Error", "Email already used"));
      }

      const user = await User.create({
        first_name,
        last_name,
        email,
        password: passwordHash.generate(password),
        role: "customer",
      });

      const formatData = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      };

      return res.status(201).json(response(201, "Register Success", formatData));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const schema = {
        email: { type: "email" },
        password: { type: "string", min: 6 },
      };

      const data = { email, password };

      const validate = v.validate(data, schema);
      if (validate.length > 0) {
        return res.status(400).json(response(400, "Validasi Error", validate));
      }

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res
          .status(400)
          .json(response(400, "Validasi Error", "Email not found. Try again!"));
      }

      const checkPassword = passwordHash.verify(password, user.password);

      if (!checkPassword) {
        return res
          .status(400)
          .json(response(400, "Validasi Error", "Password incorrect. Try again!"));
      }

      const token = jwt.sign(
        {
          userId: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
        },
        auth_secret
      );

      const formatData = {
        data: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
        },
        token,
      };

      return res.status(200).json(response(200, "Success", formatData));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },
};