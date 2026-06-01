'use strict';
const passwordHash = require('password-hash');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [
      {
        first_name: 'Admin',
        last_name: 'skyora',
        email: 'admin@skyora.com',
        password: passwordHash.generate('adminSkyoraonly'),
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      email: 'admin@skyora.com'
    })
  }
};
