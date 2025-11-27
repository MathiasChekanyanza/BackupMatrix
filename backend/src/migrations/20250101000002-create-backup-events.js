module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('backup_events', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      server_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'servers',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      server_name: {
        type: Sequelize.STRING,
        allowNull: false
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
      backup_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('success', 'failed', 'partial'),
        allowNull: false,
        defaultValue: 'success'
      },
      message: {
        type: Sequelize.TEXT
      },
      size_bytes: {
        type: Sequelize.BIGINT
      },
      duration_seconds: {
        type: Sequelize.INTEGER
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('backup_events', ['server_id', 'backup_time']);
    await queryInterface.addIndex('backup_events', ['backup_time']);
    await queryInterface.addIndex('backup_events', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('backup_events');
  }
};
