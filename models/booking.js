'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Booking.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      Booking.belongsTo(models.Room, {
        foreignKey: "room_id",
        as: "room",
      });

      Booking.hasOne(models.Payment, {
        foreignKey: "booking_id",
        as: "payment",
      });
    }
  }
  Booking.init({
    user_id: DataTypes.INTEGER,
    room_id: DataTypes.INTEGER,
    booking_code: DataTypes.STRING,
    check_in: DataTypes.DATE,
    check_out: DataTypes.DATE,
    total_price: DataTypes.DECIMAL,
     booking_status: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "cancelled"
        ),
      },
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};