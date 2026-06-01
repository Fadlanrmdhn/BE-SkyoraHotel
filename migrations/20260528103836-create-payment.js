"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Payments", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      booking_id: {
        type: Sequelize.INTEGER,
      },
      amount: {
        type: Sequelize.DECIMAL,
      },
      payment_proof: {
        type: Sequelize.STRING,
      },
      payment_method: {
        type: Sequelize.ENUM("cash", "transfer", "qris", "ewallet"),
        allowNull: false,
        defaultValue: "transfer",
      },
      payment_status: {
        type: Sequelize.ENUM("pending", "paid", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      paid_at: {
        type: Sequelize.DATE,
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
    // FK booking_id -> bookings.id

    await queryInterface.addConstraint("Payments", {
      fields: ["booking_id"],

      type: "foreign key",

      name: "fk_payments_booking_id",

      references: {
        table: "Bookings",
        field: "id",
      },

      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Payments");
  },
};
