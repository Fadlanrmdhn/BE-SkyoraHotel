"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Branch extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Branch.hasMany(models.Room, {
        foreignKey: "branch_id",
        as: "rooms",
      });
    }
  }
  Branch.init(
    {
      branch_name: DataTypes.STRING,
      city: DataTypes.STRING,
      address: DataTypes.TEXT,
      phone_number: DataTypes.STRING,
      image: {
        type: DataTypes.STRING,
        get() {
          const rawValue = this.getDataValue("image");
          return rawValue ? `https://localhost:3000/uploads/${rawValue}` : null;
        },
      },
    },
    {
      sequelize,
      modelName: "Branch",
    },
  );
  return Branch;
};
