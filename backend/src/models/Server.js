module.exports = (sequelize, DataTypes) => {
  const Server = sequelize.define('Server', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Server hostname (COMPUTERNAME)'
    },
    shopName: {
      type: DataTypes.STRING,
      field: 'shop_name',
      comment: 'Shop or location name'
    },
    databaseName: {
      type: DataTypes.STRING,
      field: 'database_name',
      comment: 'Database name being backed up'
    },
    ip: {
      type: DataTypes.INET,
      allowNull: true,
      comment: 'Server IP address'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Physical location or branch'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether server is active'
    },
    lastBackupTime: {
      type: DataTypes.DATE,
      field: 'last_backup_time',
      allowNull: true,
      comment: 'Denormalized last backup timestamp'
    },
    lastBackupStatus: {
      type: DataTypes.STRING,
      field: 'last_backup_status',
      allowNull: true,
      comment: 'Denormalized last backup status'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'servers',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['shop_name'] },
      { fields: ['active'] }
    ]
  });

  Server.associate = (models) => {
    Server.hasMany(models.BackupEvent, {
      foreignKey: 'serverId',
      as: 'backupEvents'
    });
  };

  return Server;
};
