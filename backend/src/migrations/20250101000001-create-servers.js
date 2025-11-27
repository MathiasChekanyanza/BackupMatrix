module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('servers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      shop_name: {
        type: Sequelize.STRING
      },
      database_name: {
        type: Sequelize.STRING
      },
      ip: {
        type: Sequelize.INET
      },
      location: {
        type: Sequelize.STRING
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_backup_time: {
        type: Sequelize.DATE
      },
      last_backup_status: {
        type: Sequelize.STRING
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('servers', ['name']);
    await queryInterface.addIndex('servers', ['shop_name']);
    await queryInterface.addIndex('servers', ['active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('servers');
  }
};
