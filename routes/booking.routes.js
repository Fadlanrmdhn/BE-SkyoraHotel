const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");

const { checkCustomer } = require("../middlewares/isCustomer");
const { checkAdmin } = require("../middlewares/isAdmin");
const bookingController = require("../controllers/booking.controller");

router.post("/", checkCustomer, upload.none(), bookingController.createBooking);
router.get("/", bookingController.getBooking);
router.put("/:id/checkout", checkAdmin, bookingController.checkoutBooking);
router.get("/:id/invoice", checkCustomer, bookingController.downloadInvoice);
router.get("/export/excel", checkAdmin, bookingController.exportExcel);
router.get("/:id", bookingController.showBooking);
router.put("/:id", checkAdmin, upload.none(), bookingController.updateBooking);
router.delete("/:id", checkAdmin, bookingController.deleteBooking);

module.exports = router;
