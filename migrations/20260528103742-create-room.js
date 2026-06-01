"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Rooms", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      branch_id: {
        type: Sequelize.INTEGER,
      },
      room_name: {
        type: Sequelize.STRING,
      },
      room_number: {
        type: Sequelize.STRING,
      },
      price_per_night: {
        type: Sequelize.DECIMAL,
      },
      capacity: {
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.ENUM("available", "booked"),
      },
      image: {
        type: Sequelize.STRING,
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
    await queryInterface.addConstraint("Rooms", {
      fields: ["branch_id"],
      type: "foreign key",
      name: "fk_rooms_branch_id",

      references: {
        table: "Branches",
        field: "id",
      },

      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Rooms");
  },
};
