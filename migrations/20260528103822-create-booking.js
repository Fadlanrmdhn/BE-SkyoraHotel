"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Bookings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
      },
      room_id: {
        type: Sequelize.INTEGER,
      },
      booking_code: {
        type: Sequelize.STRING,
      },
      check_in: {
        type: Sequelize.DATE,
      },
      check_out: {
        type: Sequelize.DATE,
      },
      total_price: {
        type: Sequelize.DECIMAL,
      },
      booking_status: {
        type: Sequelize.ENUM("pending", "confirmed", "completed", "cancelled"),
        defaultValue: "pending"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint("Bookings", {
      fields: ["user_id"],

      type: "foreign key",

      name: "fk_bookings_user_id",

      references: {
        table: "Users",
        field: "id",
      },

      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("Bookings", {
      fields: ["room_id"],

      type: "foreign key",

      name: "fk_bookings_room_id",

      references: {
        table: "Rooms",
        field: "id",
      },

      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Bookings");
  },
};
