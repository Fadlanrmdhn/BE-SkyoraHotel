const Validator = require("fastest-validator");
const v = new Validator();
const { User } = require("../models");
const { response } = require("../helpers/response.formatter");
const { Op } = require("sequelize");
const passwordHash = require("password-hash");

module.exports = {
  getUser: async (req, res) => {
    try {
      const { first_name, email, role, page = 1, limit = 10 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await User.findAndCountAll({
        offset: Number(offset),
        limit: Number(limit),
        where: {
          ...(first_name && {
            first_name: {
              [Op.like]: `%${first_name}%`,
            },
          }),
          ...(email && {
            email: {
              [Op.like]: `%${email}%`,
            },
          }),
          ...(role && { role }),
        },
        attributes: {
          exclude: ["password"],
        },
      });

      const pagination = {
        data: rows,
        total: count,
        page: Number(page),
        limit: Number(limit),
      };

      return res.status(200).json(response(200, "Success", pagination));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //show detail user
  showUser: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: {
          exclude: ["password"],
        },
      });

      if (!user) {
        return res.status(404).json(response(404, "User not found"));
      }

      return res.status(200).json(response(200, "Success", user));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { first_name, last_name, email, password, role } = req.body;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json(response(404, "User not found"));
      }

      const schema = {
        first_name: { type: "string", min: 3 },
        last_name: { type: "string", min: 3 },
        email: { type: "email" },
        role: { type: "string" },
      };

      const data = {
        first_name,
        last_name,
        email,
        role,
      };

      const validate = v.validate(data, schema);

      if (validate.length > 0) {
        return res.status(400).json(response(400, "Validasi Error", validate));
      }

      await User.update(
        {
          first_name,
          last_name,
          email,
          role,
          password: password ? passwordHash.generate(password) : user.password,
        },
        {
          where: { id },
        },
      );

      const newUser = await User.findByPk(id, {
        attributes: {
          exclude: ["password"],
        },
      });

      return res.status(200).json(response(200, "User updated", newUser));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json(response(404, "User not found"));
      }

      await User.destroy({
        where: { id },
      });

      return res.status(200).json(response(200, "User deleted"));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },
};
