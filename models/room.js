"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Room.belongsTo(models.Branch, {
        foreignKey: "branch_id",
        as: "branches",
      });

      Room.hasMany(models.Facility, {
        foreignKey: "room_id",
        as: "facilities",
      });

      Room.hasMany(models.Booking, {
        foreignKey: "room_id",
        as: "bookings",
      });
    }
  }
  Room.init(
    {
      branch_id: DataTypes.INTEGER,
      room_name: DataTypes.STRING,
      room_number: DataTypes.STRING,
      price_per_night: DataTypes.DECIMAL,
      capacity: DataTypes.INTEGER,
      status: {
        type: DataTypes.ENUM("available", "booked"),
      },
      image: {
        type: DataTypes.STRING,
        get() {
          //getter : memanipulasi data untuk responsenya
          const rawValue = this.getDataValue('image');
          //image yg di db cuman filename, di response jadi link yang bisa dibuka/ditampilin gambarnya
          return rawValue ?  `http://localhost:3000/uploads/${rawValue}` : null;
        }
      },
    },
    {
      sequelize,
      modelName: "Room",
    },
  );
  return Room;
};
