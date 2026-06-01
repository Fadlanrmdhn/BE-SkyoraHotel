const Validator = require("fastest-validator");
const v = new Validator();
const { response } = require("../helpers/response.formatter");
const { Facility, Room } = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");

module.exports = {
  //create facility
  createFacility: async (req, res) => {
    try {
      const { room_id, facility_name } = req.body;

      const schema = {
        room_id: {
          type: "number",
          positive: true,
          integer: true,
        },
        facility_name: {
          type: "string",
          min: 2,
        },
      };

      const data = {
        room_id: Number(room_id),
        facility_name,
      };

      const validate = v.validate(data, schema);
      if (validate.length > 0) {
        return res
          .status(400)
          .json(response(400, "Validation Error", validate));
      }

      //cek room_id benar ada di room
      const room = await Room.findByPk(data.room_id);
      if (!room) {
        return res.status(404).json(response(404, "Room Not Found"));
      }

      const facility = await Facility.create(data);
      return res.status(201).json(response(201, "Facility Created", facility));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //get facility
  getFacility: async (req, res) => {
    try {
      const { facility_name, page, limit, sortBy, order } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Facility.findAndCountAll({
        offset: Number(offset),
        limit: Number(limit),

        where: facility_name
          ? {
              facility_name: {
                [Op.like]: `%${facility_name}%`,
              },
            }
          : {},

        order: sortBy && order ? [[sortBy, order]] : [],

        include: [
          {
            model: Room,
            as: "room",
          },
        ],
      });

      const pagination = {
        data: rows,
        limit: Number(limit),
        rows: Number(offset) + 1 + "-" + (Number(offset) + rows.length),
        total: count,
        page: Number(page),
      };

      return res.status(200).json(response(200, "Success", pagination));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //show fasilitas by id
  showFacility: async (req, res) => {
    try {
      const { id } = req.params;

      const facility = await Facility.findByPk(id, {
        include: [
          {
            model: Room,
            as: "room",
          },
        ],
      });

      if (!facility) {
        return res.status(404).json(response(404, "Facility Not Found"));
      }
      return res.status(200).json(response(200, "Success", facility));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  updateFacility: async (req, res) => {
    try {
      const { id } = req.params;
      const { room_id, facility_name } = req.body;

      const schema = {
        room_id: {
          type: "number",
          positive: true,
          integer: true,
          facility_name: {
            type: "string",
            min: 2,
          },
        },
      };

      const data = {
        room_id: Number(room_id),
        facility_name,
      };

      const validate = v.validate(data, schema);

      if (validate.length > 0) {
        return res.status(400).json(response(400, "Validate Error", validate));
      }

      const facility = await Facility.findByPk(id);

      if (!facility) {
        return res.status(404).json(response(404, "Facility Not Found"));
      }
      const room = await Room.findByPk(data.room_id);

      if (!room) {
        return res.status(404).json(response(404, "Room Not Found"));
      }

      await Facility.update(data, {
        where: { id },
      });

      const newFacility = await Facility.findByPk(id, {
        include: [
          {
            model: Room,
            as: "room",
          },
        ],
      });
      return res
        .status(200)
        .json(response(200, "Facility Updated", newFacility));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //delete facilitas
  deleteFacility: async (req, res) => {
    try {
        const {id} = req.params;
        const facility = await Facility.findByPk(id);

        if(!facility) {
        return res.status(404).json(response(404, "Facility Not Found"));
        }

        await Facility.destroy({
            where: {id}
        });

        return res.status(200).json(response(200, "Facility Deleted"))
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },
};
