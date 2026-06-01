const express = require('express')
//digunakan jika routing dibuat terpisah, bukan didefinisikan di app.js langsung
const router = express.Router()

const {checkAdmin} = require("../middlewares/isAdmin")
const branchController = require('../controllers/branch.controller')
const upload = require('../middlewares/upload')

//endpoint
//upload.single: multer untuk mengirimkan data 1 file dari input name image
router.post('/', checkAdmin,upload.single('image'), branchController.createBranch);
router.get('/', branchController.getBranch);
router.get('/:id', branchController.showBranch);
router.put('/:id', checkAdmin,upload.single('image'), branchController.updateBranch);
router.delete('/:id', checkAdmin,branchController.deleteBranch)

module.exports = router