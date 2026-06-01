const Validator = require("fastest-validator");
const v = new Validator();
const { response } = require("../helpers/response.formatter");
const { Room, Branch, Facility, Booking } = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");

module.exports = {
  //Create
  createRoom: async (req, res) => {
    try {
      const { branch_id, room_name, room_number, price_per_night, capacity } =
        req.body;

      const schema = {
        branch_id: {
          type: "number",
          integer: true,
          positive: true,
        },
        room_name: {
          type: "string",
          min: 3,
        },
        room_number: {
          type: "string",
          min: 1,
        },
        price_per_night: {
          type: "number",
          positive: true,
        },
        capacity: {
          type: "number",
          integer: true,
          positive: true,
        },
      };

      const data = {
        branch_id: Number(branch_id),
        room_name,
        room_number,
        price_per_night: Number(price_per_night),
        capacity: Number(capacity),
      };

      const validate = v.validate(data, schema);

      if (validate.length > 0) {
        return res.status(400).json(response(400, "Validate Error", validate));
      }

      //check branch
      const branch = await Branch.findByPk(data.branch_id);
      if (!branch) {
        return res.status(404).json(response(404, "Branch Not Found"));
      }

      //check room number
      const checkRoom = await Room.findOne({
        where: {
          room_number: data.room_number,
        },
      });
      if (checkRoom) {
        return res.status(400).json(response(400, "Room Number Already Exist"));
      }

      if (!req.file) {
        return res.status(400).json(response(400, "Image Not Found"));
      }

      const room = await Room.create({
        ...data,
        status: "available",
        image: req.file.filename,
      });
      return res.status(201).json(response(201, "Room Created", room));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  getRoom: async (req, res) => {
    try {
      const { room_name, status, page, limit, sortBy, order } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Room.findAndCountAll({
        offset: Number(offset),
        limit: Number(limit),
        where: {
          ...(room_name && {
            room_name: {
              [Op.like]: `%${room_name}%`,
            },
          }),
          ...(status && {
            status,
          }),
        },
        order: sortBy && order ? [[sortBy, order]] : [],

        include: [
            {
                model:Branch,
                as: "branches"
            },
            {
                model:Facility,
                as: "facilities"
            },
            {
                model:Booking,
                as: "bookings"
            },
        ]
      });

      const pagination = {
        data: rows,
        limit: limit,
        rows: Number(offset) + 1 + "-" + (Number(offset) + rows.length),
        total: count,
        page: page,
      };
      return res.status(200).json(response(200, "Success", pagination));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  showRoom: async (req, res) => {
    try {
      const { id } = req.params;

      const room = await Room.findByPk(id);

      //check room
      if (!room) {
        return res.status(404).json(response(404, "Room Not Found"));
      }

      return res.status(200).json(response(200, "Success", room));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  updateRoom: async (req, res) => {
    try {
      const { id } = req.params;

      const {
        branch_id,
        room_name,
        room_number,
        price_per_night,
        capacity,
        status,
      } = req.body;

      //check room
      const room = await Room.findByPk(id);

      if (!room) {
        return res.status(404).json(response(404, "Room not found"));
      }

      //validation
      const schema = {
        branch_id: {
          type: "number",
          positive: true,
          integer: true,
        },

        room_name: {
          type: "string",
          min: 3,
        },

        room_number: {
          type: "string",
          min: 1,
        },

        price_per_night: {
          type: "number",
          positive: true,
        },

        capacity: {
          type: "number",
          positive: true,
          integer: true,
        },

        status: {
          type: "enum",
          values: ["available", "booked"],
        },
      };

      const data = {
        branch_id: Number(branch_id),
        room_name,
        room_number,
        price_per_night: Number(price_per_night),
        capacity: Number(capacity),
        status,
      };

      const validate = v.validate(data, schema);

      //validasi error
      if (validate.length > 0) {
        return res
          .status(400)
          .json(response(400, "Validation Error", validate));
      }

      //check branch
      const branch = await Branch.findByPk(data.branch_id);
      if (!branch) {
        return res.status(404).json(response(404, "Branch not found"));
      }

      //check room number
      const checkRoom = await Room.findOne({
        where: {
          room_number: data.room_number,
          id: {
            [Op.not]: id,
          },
        },
      });

      if (checkRoom) {
        return res
          .status(400)
          .json(response(400, "Room number already exists"));
      }

      // hapus file lama
      if (req.file) {
        const imageName = room.getDataValue("image");
        const filePath = path.join(__dirname, "../uploads", imageName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // update
      await Room.update(
        {
          ...data,
          image: req.file ? req.file.filename : room.getDataValue("image"),
        },
        {
          where: { id },
        },
      );

      // room baru
      const newRoom = await Room.findByPk(id);
      return res.status(200).json(response(200, "Room updated", newRoom));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  deleteRoom: async (req, res) => {
    try {
      const { id } = req.params;

      // check room
      const room = await Room.findByPk(id);
      if (!room) {
        return res.status(404).json(response(404, "Room not found"));
      }

      // hapus gambar
      const imageName = room.getDataValue("image");
      const filePath = path.join(__dirname, "../uploads", imageName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // hapus room
      await Room.destroy({
        where: { id },
      });
      return res.status(200).json(response(200, "Room deleted"));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },
};
