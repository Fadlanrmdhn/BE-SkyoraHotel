const Validator = require("fastest-validator");
const v = new Validator();
const { Customer, User } = require("../models");
const { response } = require("../helpers/response.formatter");
const { Op } = require("sequelize");

module.exports = {
  //admin lihat semua data customer
  getCustomer: async (req, res) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Customer.findAndCountAll({
        offset,
        limit: Number(limit),
        where: {
          ...(search && {
            [Op.or]: [
              {
                phone_number: {
                  [Op.like]: `%${search}%`,
                },
              },
              {
                identity_number: {
                  [Op.like]: `%${search}%`,
                },
              },
            ],
          }),
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: { exclude: ["password"] },
          },
          ...(search && {
            where: {
              [Op.or]: [
                {
                  first_name: {
                    [Op.like]: `%${search}%`,
                  },
                },
                {
                  last_name: {
                    [Op.like]: `%${search}%`,
                  },
                },
                {
                  email: {
                    [Op.like]: `%${search}%`,
                  },
                },
              ],
            },
            required: false,
          }),
        ],
        order: [["id", "DESC"]],
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

  //show customer, admin melihat detail customer
  showCustomer: async (req, res) => {
    try {
      const { id } = req.params;

      const customer = await Customer.findByPk(id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: {
              exclude: ["password"],
            },
          },
        ],
      });

      if (!customer) {
        return res.status(404).json(response(404, "Customer not found"));
      }

      return res.status(200).json(response(200, "Success", customer));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //get my profile, customer meilhat profile sendiri
  getMyProfile: async (req, res) => {
    try {
      const user_id = req.user.userId;

      const customer = await Customer.findOne({
        where: { user_id },
        include: [
          {
            model: User,
            as: "user",
            attributes: {
              exclude: ["password"],
            },
          },
        ],
      });

      if (!customer) {
        return res
          .status(404)
          .json(response(404, "Customer profile not found"));
      }

      return res.status(200).json(response(200, "Success", customer));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //updatemyprofile, customer melengkapi dan mengupdate data profile sendiri
  updateMyProfile: async (req, res) => {
    try {
      const user_id = req.user.userId;
      const { phone_number, address, identity_number, gender } = req.body;

      const schema = {
        phone_number: { type: "string", optional: true, nullable: true },
        address: { type: "string", optional: true, nullable: true },
        identity_number: { type: "string", optional: true, nullable: true },
        gender: {
          type: "enum",
          vvalues: ["male", "female"],
          optional: true,
          nullable: true,
        },
      };

      const data = {
        phone_number,
        address,
        identity_number,
        gender,
      };

      const validate = v.validate(data, schema);

      if (validate.length > 0) {
        return res
          .status(400)
          .json(response(400, "Validation Error", validate));
      }

      let customer = await Customer.findOne({
        where: { user_id },
      });

      if (!customer) {
        customer = await Customer.create({
          user_id,
          phone_number: null,
          address: null,
          identity_number: null,
          gender: null,
        });
      }

      await Customer.update(
        {
          phone_number,
          adddress,
          identity_number,
          gender,
        },
        {
          where: { user_id },
        },
      );

      const updatedCustomer = await Customer.findOne({
        where: { user_id },
        include: [
          {
            model: User,
            as: "user",
            attributes: {
              exclude: ["password"],
            },
          },
        ],
      });

      return res
        .status(200)
        .json(response(200, "Customer profile updated", updatedCustomer));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //update customer, admin mengubah data customer
  updateCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      const { phone_number, address, identity_number, gender } = req.body;

      const schema = {
        phone_number: { type: "string", optional: true, nullable: true },
        address: { type: "string", optional: true, nullable: true },
        identity_number: { type: "string", optional: true, nullable: true },
        gender: {
          type: "enum",
          values: ["male", "female"],
          optional: true,
          nullable: true,
        },
      };

      const data = {
        phone_number,
        address,
        identity_number,
        gender,
      };

      const validate = v.validate(data, schema);

      if (validate.length > 0) {
        return res
          .status(400)
          .json(response(400, "Validation Error", validate));
      }

      const customer = await Customer.findByPk(id);

      if (!customer) {
        return res.status(404).json(response(404, "Customer not found"));
      }

      await Customer.update(
        {
          phone_number,
          address,
          identity_number,
          gender,
        },
        {
          where: { id },
        },
      );

      const updatedCustomer = await Customer.findByPk(id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: {
              exclude: ["password"],
            },
          },
        ],
      });

      return res
        .status(200)
        .json(response(200, "Customer updated", updatedCustomer));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //deletecustomer, admin menghapus data customer
  deleteCustomer: async (req, res) => {
    try {
      const { id } = erq.params;
      const customer = await Customer.findByPk(id);

      if (!customer) {
        return res.status(404).json(response(404, "Customer not found"));
      }

      await Customer.destroy({
        where: { id },
      });

      return res.status(200).json(response(200, "Customer deleted"));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },
};
