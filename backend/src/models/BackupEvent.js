module.exports = (sequelize, DataTypes) => {
  const BackupEvent = sequelize.define('BackupEvent', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    serverId: {
      type: DataTypes.INTEGER,
      field: 'server_id',
      allowNull: false,
      references: {
        model: 'servers',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    serverName: {
      type: DataTypes.STRING,
      field: 'server_name',
      allowNull: false,
      comment: 'Denormalized server name for fast reporting'
    },
    shopName: {
      type: DataTypes.STRING,
      field: 'shop_name',
      comment: 'Denormalized shop name'
    },
    databaseName: {
      type: DataTypes.STRING,
      field: 'database_name',
      comment: 'Database name'
    },
    ip: {
      type: DataTypes.INET,
      allowNull: true
    },
    backupTime: {
      type: DataTypes.DATE,
      field: 'backup_time',
      allowNull: false,
      comment: 'When the backup was taken'
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'partial'),
      allowNull: false,
      defaultValue: 'success'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Backup status message or error'
    },
    sizeBytes: {
      type: DataTypes.BIGINT,
      field: 'size_bytes',
      allowNull: true,
      comment: 'Backup file size in bytes'
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      field: 'duration_seconds',
      allowNull: true,
      comment: 'Backup duration in seconds'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'backup_events',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['server_id', { attribute: 'backup_time', order: 'DESC' }] },
      { fields: [{ attribute: 'backup_time', order: 'DESC' }] },
      { fields: ['status'] }
    ]
  });

  BackupEvent.associate = (models) => {
    BackupEvent.belongsTo(models.Server, {
      foreignKey: 'serverId',
      as: 'server'
    });
  };

  return BackupEvent;
};
