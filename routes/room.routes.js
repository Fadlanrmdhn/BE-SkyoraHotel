const express = require('express')
//digunakan jika routing dibuat terpisah, bukan didefinisikan di app.js langsung
const router = express.Router()

const {checkAdmin} = require("../middlewares/isAdmin")
const roomController = require('../controllers/room.controller')
const upload = require('../middlewares/upload')

//endpoint
//upload.single: multer untuk mengirimkan data 1 file dari input name image
router.post('/', checkAdmin, upload.single('image'), roomController.createRoom);
router.get('/', roomController.getRoom);
router.get('/:id', roomController.showRoom);

//protected

router.put('/:id', checkAdmin, upload.single('image'), roomController.updateRoom);
router.delete('/:id', checkAdmin, roomController.deleteRoom)

module.exports = router