const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customer.controller");
const { checkToken } = require("../middlewares/auth");
const { checkAdmin } = require("../middlewares/isAdmin");

// customer
router.get("/profile", checkToken, customerController.getMyProfile);
router.put("/profile", checkToken, customerController.updateMyProfile);

// admin
router.get("/", checkToken, checkAdmin, customerController.getCustomer);
router.get("/:id", checkToken, checkAdmin, customerController.showCustomer);
router.put("/:id", checkToken, checkAdmin, customerController.updateCustomer);
router.delete("/:id", checkToken, checkAdmin, customerController.deleteCustomer);

module.exports = router;