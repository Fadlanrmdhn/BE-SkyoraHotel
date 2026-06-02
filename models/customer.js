"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Customer dimiliki oleh 1 User
      Customer.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  Customer.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      identity_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      gender: {
        type: DataTypes.ENUM("male", "female"),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Customer",
    },
  );

  return Customer;
};