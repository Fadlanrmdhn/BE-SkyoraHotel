const express = require('express')
const router = express.Router()

const authController = require('../controllers/auth.controller')
const upload = require('../middlewares/upload')

router.post("/register", upload.none(), authController.register);
router.post("/login", upload.none(), authController.login);

module.exports = router