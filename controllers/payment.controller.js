const Validator = require("fastest-validator");
const v = new Validator();
const { response } = require("../helpers/response.formatter");
const { Payment, Booking, Room, User, sequelize } = require("../models");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

module.exports = {
  //get payment
  getPayment: async (req, res) => {
    try {
      const { payment_status, page = 1, limit = 10, sortBy, order } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Payment.findAndCountAll({
        offset: Number(offset),
        limit: Number(limit),

        where: {
          ...(payment_status && {
            payment_status,
          }),
        },

        order: sortBy && order ? [[sortBy, order]] : [],

        include: [
          {
            model: Booking,
            as: "booking",
            include: [
              { model: User, as: "user" },
              { model: Room, as: "room" },
            ],
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

  //show detail payment
  showPayment: async (req, res) => {
    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id, {
        include: [
          {
            model: Booking,
            as: "booking",
            include: [
              { model: User, as: "user" },
              { model: Room, as: "room" },
            ],
          },
        ],
      });

      if (!payment) {
        return res.status(404).json(response(404, "Payment not found"));
      }

      return res.status(200).json(response(200, "Success", payment));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //upload bukti pembayaran
  uploadPaymentProof: async (req, res) => {
    try {
      const { id } = req.params;
      const { payment_method } = req.body;

      const schema = {
        payment_method: {
          type: "enum",
          values: ["cash", "transfer", "qris", "ewallet"],
        },
      };

      const validate = v.validate({ payment_method }, schema);
      if (validate.length > 0) {
        return res
          .status(400)
          .json(response(400, "Validation Error", validate));
      }

      const payment = await Payment.findByPk(id);
      if (!payment) {
        return res.status(404).json(response(404, "Payment not found"));
      }

      if (payment_method !== "cash" && !req.file) {
        return res
          .status(400)
          .json(response(400, "Validation Error", "Payment proof is required"));
      }

      if (req.file && payment.getDataValue("payment_proof")) {
        const oldproof = payment.getDataValue("payment_proof");
        const filePath = path.join(__dirname, "../uploads", oldproof);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await Payment.update(
        {
          payment_method,
          payment_proof: req.file
            ? req.file.filename
            : payment_method === "cash"
              ? null
              : payment.getDataValue("payment_proof"),
          payment_status: "pending",
          paid_at: null,
        },
        {
          where: { id },
        },
      );

      const newPayment = await Payment.findByPk(id);

      return res
        .status(200)
        .json(response(200, "Payment proof uploaded", newPayment));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //untuk approve payment
  approvePayment: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id);
      if (!payment) {
        await transaction.rollback();
        return res.status(404).json(response(404, "Payment not found"));
      }

      const booking = await Booking.findByPk(payment.booking_id);

      if (!booking) {
        await transaction.rollback();
        return res.status(404).json(response(404, "Booking not found"));
      }

      await Payment.update(
        {
          payment_status: "paid",
          paid_at: new Date(),
        },
        {
          where: { id },
          transaction,
        },
      );

      await Booking.update(
        {
          booking_status: "confirmed",
        },
        {
          where: { id: booking.id },
          transaction,
        },
      );

      await Room.update(
        {
          status: "booked",
        },
        {
          where: { id: booking.room_id },
          transaction,
        },
      );

      await transaction.commit();

      const result = await Payment.findByPk(id, {
        include: [
          {
            model: Booking,
            as: "booking",
            include: [
              { model: User, as: "user" },
              { model: Room, as: "room" },
            ],
          },
        ],
      });

      return res.status(200).json(response(200, "Payment approved", result));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //pembayaran gagal
  rejectPayment: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id);
      if (!payment) {
        await transaction.rollback();
        return res.status(404).json(response(404, "Payment not found"));
      }

      await Payment.update(
        {
          payment_status: "rejected",
          paid_at: null,
        },
        {
          where: { id },
          transaction,
        },
      );

      await transaction.commit();

      const result = await Payment.findByPk(id, {
        include: [
          {
            model: Booking,
            as: "booking",
            include: [
              { model: User, as: "user" },
              { model: Room, as: "room" },
            ],
          },
        ],
      });

      return res.status(200).json(response(200, "Payment rejected", result));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //hapus pembayaran
  deletePayment: async (req, res) => {
    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id);
      if (!payment) {
        return res.status(404).json(response(404, "Payment not found"));
      }

      if (payment.getDataValue("payment_proof")) {
        const proofName = payment.getDataValue("payment_proof");
        const filePath = path.join(__dirname, "../uploads", proofName);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await Payment.destroy({
        where: { id },
      });

      return res.status(200).json(response(200, "Payment deleted"));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //export payment ke excel
  exportExcel: async (req, res) => {
    try {
      const payments = await Payment.findAll({
        include: [
          {
            model: Booking,
            as: "booking",
            include: [
              { model: User, as: "user" },
              { model: Room, as: "room" },
            ],
          },
        ],
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Payments");

      worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Booking Code", key: "booking_code", width: 25 },
        { header: "Customer", key: "customer", width: 25 },
        { header: "Room", key: "room", width: 25 },
        { header: "Amount", key: "amount", width: 20 },
        { header: "Payment Method", key: "payment_method", width: 20 },
        { header: "Payment Status", key: "payment_status", width: 20 },
        { header: "Paid At", key: "paid_at", width: 25 },
        { header: "Created At", key: "createdAt", width: 25 },
      ];

      payments.forEach((payment) => {
        worksheet.addRow({
          id: payment.id,
          booking_code: payment.booking?.booking_code || "-",
          customer: payment.booking?.user
            ? `${payment.booking.user.first_name} ${payment.booking.user.last_name}`
            : "-",
          room: payment.booking?.room?.room_name || "-",
          amount: payment.amount,
          payment_method: payment.payment_method,
          payment_status: payment.payment_status,
          paid_at: payment.paid_at || "-",
          createdAt: payment.createdAt,
        });
      });

      worksheet.getRow(1).font = {
        bold: true,
      };

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="payments.xlsx"',
      );

      await workbook.xlsx.write(res);

      res.end();
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },
};
