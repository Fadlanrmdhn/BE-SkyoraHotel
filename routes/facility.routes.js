const express = require('express')
//digunakan jika routing dibuat terpisah, bukan didefinisikan di app.js langsung
const router = express.Router()

const {checkAdmin} = require("../middlewares/isAdmin")
const facilityController = require('../controllers/facility.controller')
const upload = require('../middlewares/upload')

//endpoint
//upload.single: multer untuk mengirimkan data 1 file dari input name image
router.post('/', checkAdmin, upload.none(), facilityController.createFacility);
router.get('/', facilityController.getFacility);
router.get('/:id', facilityController.showFacility);
router.put('/:id', checkAdmin, upload.single('image'), facilityController.updateFacility);
router.delete('/:id', checkAdmin, facilityController.deleteFacility)

module.exports = router