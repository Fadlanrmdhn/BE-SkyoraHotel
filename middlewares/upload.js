const multer = require("multer");
const path = require("path");

//diskStorage : menyimpan file pada folder proyek
const storage = multer.diskStorage({
  //lokasi penyimpanan
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  //konfigurasi nama file yang akan disimpan
  filename: function (req, file, cb) {
    //membuat karakter unik
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    //mengambil extensi asli file yang diupload
    const ext = path.extname(file.originalname);
    //nama akhir file, gabungan dr name input - karakter acak .extensi
    const name = file.fieldname + "-" + uniqueSuffix + ext;
    cb(null, name);
  },
});

module.exports = multer({ storage: storage })
