const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    await queryInterface.bulkInsert('users', [
      {
        username: 'Admin',
        password_hash: passwordHash,
        role: 'admin',
        created_at: new Date()
      }
    ]);

    // Create master API key
    const masterKey = process.env.MASTER_API_KEY || uuidv4();
    await queryInterface.bulkInsert('api_keys', [
      {
        key: masterKey,
        name: 'Master API Key - All Shops',
        active: true,
        created_at: new Date()
      }
    ]);

    console.log('\n========================================');
    console.log('Initial Setup Complete!');
    console.log('========================================');
    console.log('Admin User:');
    console.log('  Username: Admin');
    console.log('  Password: admin123');
    console.log('  IMPORTANT: Change this password after first login!');
    console.log('');
    console.log('Master API Key:');
    console.log(`  ${masterKey}`);
    console.log('  Add this to your agent scripts!');
    console.log('========================================\n');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('api_keys', null, {});
  }
};
