module.exports = (sequelize, DataTypes) => {
  const ApiKey = sequelize.define('ApiKey', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'API key value (UUID)'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Descriptive name for the key'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'api_keys',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['key'] },
      { fields: ['active'] }
    ]
  });

  return ApiKey;
};
