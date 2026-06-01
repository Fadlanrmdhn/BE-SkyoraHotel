const Validator = require("fastest-validator");
const v = new Validator();
const { response } = require("../helpers/response.formatter");
const { Branch } = require("../models");
const { Op, where } = require("sequelize");
const fs = require("fs");
const path = require("path");

module.exports = {
  //method
  createBranch: async (req, res) => {
    try {
      const { branch_name, city, address, phone_number } = req.body;

      //validation
      const schema = {
        branch_name: {
          type: "string",
          min: 3,
        },

        city: {
          type: "string",
          min: 3,
        },

        address: {
          type: "string",
          min: 5,
        },

        phone_number: {
          type: "string",
          min: 10,
        },
      };

      //menyiapkan data yang akan divalidasi
      const data = {
        branch_name,
        city,
        address,
        phone_number,
      };

      const validate = v.validate(data, schema);

      if (validate.length > 0) {
        return res
          .status(400)
          .json(response(400, "validation Error", validate));
      }

      //check image
      if (!req.file) {
        return res.status(400).json(response(400, "Image Not Found"));
      }

      //create
      const branch = await Branch.create({
        ...data,
        image: req.file.filename,
      });
      return res.status(201).json(response(201, "Branch created", branch));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  getBranch: async (req, res) => {
    try {
      const { branch_name, sortBy, order, page, limit } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const { count, rows } = await Branch.findAndCountAll({
        offset: Number(offset),
        limit: Number(limit),
        //cari berdasarkan field name di bd dari name req.query
        where: branch_name
          ? {
              branch_name: {
                [Op.like]: `%${branch_name}%`, //mencari yang mirip
              },
            }
          : {},
        //kalau di params postman ada sortBy dan order, jalanin pengurutan, kalau gaada pake default, misal sortBy 'stock' prder 'DESC'
        order: sortBy && order ? [[sortBy, order]] : [],
      });
      const formatPagination = {
        data: rows,
        limit: limit,
        //munculin angka baris data sesuai yang diambil
        rows: Number(offset) + 1 + "-" + (Number(offset) + rows.length),
        total: count, //jumlah data keseluruhan
        page: page, //lagi dihalaman berapa
      };
      return res.status(200).json(response(200, "Success", formatPagination));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  showBranch: async (req, res) => {
    try {
      const { id } = req.params;
      const branch = await Branch.findByPk(id);
      if (!branch) {
        return res.status(400).json(response(400, "Data [id] not found"));
      }
      return res.status(200).json(response(200, "Success", branch));
    } catch {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  updateBranch: async (req, res) => {
    try {
      const { id } = req.params;
      const { branch_name, city, address, phone_number } = req.body;

      const schema = {
        branch_name: { type: "string", min: 3 },
        city: { type: "string", min: 3 },
        address: { type: "string", min: 3 },
        phone_number: { type: "string", min: 10 },
      };
      const data = {
        branch_name: branch_name,
        city: city,
        address: address,
        phone_number: phone_number,
      };
      const validate = v.validate(data, schema);
      if (validate.length > 0) {
        return res.status(400).json(response(400, "Validasi Error", validate));
      }
      const branch = await Branch.findByPk(id);
      if (!branch) {
        return res
          .status(400)
          .json(response(400, "Validasi Error", "Data not found"));
      }

      //jika pada req terdapat file
      if (req.file) {
        //karna image uda diganti jadi link di getter model, jadi ambil yang aslinya pake getDataValue
        const imageName = branch.getDataValue("image");
        //cari image ke folder uploads
        const filepath = path.join(__dirname, "../uploads", imageName);
        //cek jika file ada di folder tersebut
        if (fs.existsSync(filepath)) {
          //hapus file
          fs.unlinkSync(filepath);
          ``;
        }
      }

      //hasil dari update hanya true/false bukan data baru
      const updateProcess = await Branch.update(
        {
          ...data,
          //jika ada file baru, ambil filename baru jika nggak ada ambil data asli tanpa link
          image: req.file ? req.file.filename : branch.getDataValue("image"),
        },
        {
          where: { id: id },
        },
      );
      //ambil data baru yang udah di update
      const newBranch = await Branch.findByPk(id);
      return res.status(200).json(response(200, "Success", newBranch));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },

  deleteBranch: async (req, res) => {
    try {
      const { id } = req.params;

      //ambil data branch untuk diambil gambar dan dihapus
      const branch = await Branch.findByPk(id);
      const imageName = branch.getDataValue("image");
      //cari gambar ke folder uploads
      const filePath = path.join(__dirname, "../uploads", imageName);
      //cek jika file ada
      if (fs.existsSync(filePath)) {
        //hapus file
        fs.unlinkSync(filePath);
      }
      const deleteProcess = await Branch.destroy({
        where: { id: id },
      });
      return res.status(200).json(response(200, "Deleted"));
    } catch (error) {
      return res.status(500).json(response(500, "Server Error", error.message));
    }
  },
};
