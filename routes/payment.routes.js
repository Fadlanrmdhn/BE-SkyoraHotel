const express = require("express");
const router = express.Router();

const { checkAdmin } = require("../middlewares/isAdmin");
const { checkCustomer } = require("../middlewares/isCustomer");
const paymentController = require("../controllers/payment.controller");
const upload = require("../middlewares/upload");

router.get("/", upload.none(), paymentController.getPayment);
router.get("/export/excel", checkAdmin, paymentController.exportExcel);
router.get("/:id", paymentController.showPayment);
router.put(
  "/:id/upload",
  checkCustomer, upload.single("payment_proof"),
  paymentController.uploadPaymentProof,
);
router.put("/:id/approve", checkAdmin, paymentController.approvePayment);
router.put("/:id/reject", checkAdmin, paymentController.rejectPayment);
router.delete("/:id", checkAdmin, paymentController.deletePayment);

module.exports = router;
