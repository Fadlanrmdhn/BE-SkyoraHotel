"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Payment.belongsTo(models.Booking, {
        foreignKey: "booking_id",
        as: "booking",
      });
    }
  }
  Payment.init(
    {
      booking_id: DataTypes.INTEGER,
      amount: DataTypes.DECIMAL,
      payment_proof: {
        type: DataTypes.STRING,
        get() {
          //getter : memanipulasi data untuk responsenya
          const rawValue = this.getDataValue('payment_proof');
          //image yg di db cuman filename, di response jadi link yang bisa dibuka/ditampilin gambarnya
          return rawValue ?  `http://localhost:3000/uploads/${rawValue}` : null;
        }
      },
      payment_method: {
        type: DataTypes.ENUM("cash", "transfer", "qris", "ewallet"),
        allowNull: false,
        defaultValue: "transfer",
      },
      payment_status: {
        type: DataTypes.ENUM("pending", "paid", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },

      paid_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Payment",
    },
  );
  return Payment;
};
