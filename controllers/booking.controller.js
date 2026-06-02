const Validator = require("fastest-validator");
const v = new Validator();
const { response } = require("../helpers/response.formatter");
const { Booking, Payment, Room, User, sequelize } = require("../models");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

module.exports = {
  //create booking
  createBooking: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { room_id, check_in, check_out } = req.body;
      //agar tidak id 1
      const user_id = req.user.userId;

      const schema = {
        user_id: {
          type: "number",
          positive: true,
          integer: true,
        },
        room_id: {
          type: "number",
          positive: true,
          integer: true,
        },
        check_in: {
          type: "string",
          min: 10,
        },
        check_out: {
          type: "string",
          min: 10,
        },
      };

      const data = {
        user_id: Number(user_id),
        room_id: Number(room_id),
        check_in,
        check_out,
      };

      const validate = v.validate(data, schema);

      if (validate.length > 0) {
        await transaction.rollback();
        return res.status(400).json(response(400, "Validate Error", validate));
      }

      const user = await User.findByPk(data.user_id);

      if (!user) {
        await transaction.rollback();
        return res.status(400).json(response(400, "User Not Found"));
      }

      const room = await Room.findByPk(data.room_id);

      if (!room) {
        await transaction.rollback();
        return res.status(400).json(response(400, "Room Not Found"));
      }

      if (room.status !== "available") {
        await transaction.rollback();
        return res.status(400).json(response(400, "Room Is Not Available"));
      }

      const checkInDate = new Date(check_in);
      const checkOutDate = new Date(check_out);

      if (checkOutDate <= checkInDate) {
        await transaction.rollback();
        return res
          .status(400)
          .json(response(400, "Check-out Must Be After Check-in"));
      }

      const diffTime = checkOutDate - checkInDate;
      const totalNight = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const totalPrice = Number(room.price_per_night) * totalNight;

      const customer = await Customer.findOne({
        where: {
          user_id: req.user.userId,
        },
      });

      if (!customer) {
        return res
          .status(400)
          .json(response(400, "Customer profile not found"));
      }

      if (
        !customer.phone_number ||
        !customer.address ||
        !customer.identity_number ||
        !customer.gender
      ) {
        return res
          .status(400)
          .json(
            response(
              400,
              "Please complete your customer profile before booking",
            ),
          );
      }

      const booking = await Booking.create(
        {
          user_id: data.user_id,
          room_id: data.room_id,
          booking_code: "SKY-" + Date.now(),
          check_in,
          check_out,
          total_price: totalPrice,
          booking_status: "pending",
        },
        { transaction },
      );

      await Payment.create(
        {
          booking_id: booking.id,
          amount: totalPrice,
          payment_method: "transfer",
          payment_status: "pending",
        },
        { transaction },
      );

      await transaction.commit();

      const result = await Booking.findByPk(booking.id, {
        include: [
          {
            model: User,
            as: "user",
          },
          {
            model: Room,
            as: "room",
          },
          {
            model: Payment,
            as: "payment",
          },
        ],
      });

      return res.status(201).json(response(201, "Booking Created", result));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //get booking
  getBooking: async (req, res) => {
    try {
      const {
        booking_code,
        booking_status,
        page = 1,
        limit = 10,
        sortBy,
        order,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Booking.findAndCountAll({
        offset: Number(offset),
        limit: Number(limit),

        where: {
          ...(booking_code && {
            booking_code: {
              [Op.like]: `%${booking_code}%`,
            },
          }),

          ...(booking_status && {
            booking_status,
          }),
        },

        order: sortBy && order ? [[sortBy, order]] : [],

        include: [
          { model: User, as: "user" },
          { model: Room, as: "room" },
          { model: Payment, as: "payment" },
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

  //show booking
  showBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await Booking.findByPk(id, {
        include: [
          { model: User, as: "user" },
          { model: Room, as: "room" },
          { model: Payment, as: "payment" },
        ],
      });

      if (!booking) {
        return res.status(404).json(response(404, "Booking not found"));
      }
      return res.status(200).json(response(200, "Success", booking));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //update booking status
  updateBooking: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { booking_status } = req.body;

      const schema = {
        booking_status: {
          type: "enum",
          values: ["pending", "confirmed", "cancelled"],
        },
      };

      const validate = v.validate({ booking_status }, schema);

      if (validate.length > 0) {
        await transaction.rollback();
        return res
          .status(400)
          .json(response(400, "Validation Error", validate));
      }

      const booking = await Booking.findByPk(id);

      if (!booking) {
        await transaction.rollback();
        return res.status(404).json(response(404, "Booking not found"));
      }

      await Booking.update(
        { booking_status },
        {
          where: { id },
          transaction,
        },
      );

      if (booking_status === "cancelled") {
        await Room.update(
          { status: "available" },
          {
            where: { id: booking.room_id },
            transaction,
          },
        );
      }

      if (booking_status === "confirmed") {
        await Room.update(
          { status: "booked" },
          {
            where: { id: booking.room_id },
            transaction,
          },
        );
      }

      await transaction.commit();

      const newBooking = await Booking.findByPk(id, {
        include: [
          { model: User, as: "user" },
          { model: Room, as: "room" },
          { model: Payment, as: "payment" },
        ],
      });
      return res.status(200).json(response(200, "Booking updated", newBooking));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //checkout
  checkoutBooking: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const booking = await Booking.findByPk(id);

      if (!booking) {
        await transaction.rollback();
        return res.status(404).json(response(404, "Booking not found"));
      }

      if (booking.booking_status !== "confirmed") {
        await transaction.rollback();
        return res
          .status(400)
          .json(response(400, "Only confirmed booking can be checkout"));
      }

      await Booking.update(
        { booking_status: "completed" },
        {
          where: { id },
          transaction,
        },
      );

      await Room.update(
        { status: "available" },
        {
          where: { id: booking.room_id },
          transaction,
        },
      );

      await transaction.commit();

      const newBooking = await Booking.findByPk(id, {
        include: [
          { model: User, as: "user" },
          { model: Room, as: "room" },
          { model: Payment, as: "payment" },
        ],
      });

      return res
        .status(200)
        .json(response(200, "Checkout success", newBooking));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //delete booking
  deleteBooking: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const booking = await Booking.findByPk(id);

      if (!booking) {
        await transaction.rollback();
        return res.status(404).json(response(404, "Booking not found"));
      }

      await Room.update(
        { status: "available" },
        {
          where: { id: booking.room_id },
          transaction,
        },
      );

      await Booking.destroy({
        where: { id },
        transaction,
      });

      await transaction.commit();

      return res.status(200).json(response(200, "Booking deleted"));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //export excel
  exportExcel: async (req, res) => {
    try {
      const bookings = await Booking.findAll({
        include: [
          { model: User, as: "user" },
          { model: Room, as: "room" },
          { model: Payment, as: "payment" },
        ],
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Bookings");

      worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Booking Code", key: "booking_code", width: 25 },
        { header: "Customer", key: "customer", width: 25 },
        { header: "Room", key: "room", width: 25 },
        { header: "Check In", key: "check_in", width: 20 },
        { header: "Check Out", key: "check_out", width: 20 },
        { header: "Total Price", key: "total_price", width: 20 },
        { header: "Status", key: "status", width: 20 },
      ];

      bookings.forEach((booking) => {
        worksheet.addRow({
          id: booking.id,
          booking_code: booking.booking_code,
          customer: booking.user?.first_name + " " + booking.user?.last_name,
          room: booking.room
            ? `${booking.room.room_name} - ${booking.room.room_number}`
            : "-",
          check_in: booking.check_in,
          check_out: booking.check_out,
          total_price: booking.total_price,
          status: booking.booking_status,
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="bookings.xlsx"',
      );

      await workbook.xlsx.write(res);

      res.end();
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  //download invoice customer
  downloadInvoice: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.userId;

      const booking = await Booking.findByPk(id, {
        include: [
          { model: User, as: "user" },
          { model: Room, as: "room" },
          { model: Payment, as: "payment" },
        ],
      });

      if (!booking) {
        return res.status(404).json(response(404, "Booking not found"));
      }

      //agar customer tidak bisa download invoice orang lain
      if (booking.user_id !== user_id) {
        return res
          .status(403)
          .json(response(403, "Forbidden", "This invoice is not yours"));
      }

      const doc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice-${booking.booking_code}.pdf`,
      );

      doc.pipe(res);

      doc.fontSize(22).text("SKYORA HOTEL", { align: "center" });
      doc.moveDown();

      doc.fontSize(16).text("Invoice Booking");
      doc.moveDown();

      doc.fontSize(12).text(`Booking Code : ${booking.booking_code}`);
      doc.text(
        `Customer     : ${booking.user.first_name} ${booking.user.last_name}`,
      );
      doc.text(`Email          : ${booking.user.email}`);
      doc.text(`Room           : ${booking.room.room_name}`);
      doc.text(`Check In       : ${booking.check_in}`);
      doc.text(`Check Out      : ${booking.check_out}`);
      doc.text(`Total Price    : Rp ${booking.total_price}`);
      doc.text(`Booking Status : ${booking.booking_status}`);
      doc.text(`Payment Status : ${booking.payment?.payment_status || "-"}`);
      doc.text(`Payment Method : ${booking.payment?.payment_method || "-"}`);
      doc.text(`Paid At        : ${booking.payment?.paid_at || "-"}`);

      doc.moveDown();
      doc.text("Thank you for booking with Skyora Hotel.");

      doc.end();
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },
};
