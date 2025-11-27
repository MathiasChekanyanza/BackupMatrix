const { Server, BackupEvent, sequelize } = require('../models');
const logger = require('../config/logger');

const ingestReport = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const payload = req.body;
    
    // Support both single report and batch (array)
    const reports = Array.isArray(payload) ? payload : [payload];
    
    const insertedIds = [];

    for (const report of reports) {
      const {
        server_name,
        shop_name,
        database_name,
        ip,
        backup_time,
        status,
        message,
        size_bytes,
        duration_seconds
      } = report;

      // Find or create server
      let server = await Server.findOne({
        where: { name: server_name },
        transaction
      });

      if (!server) {
        server = await Server.create({
          name: server_name,
          shopName: shop_name,
          databaseName: database_name,
          ip,
          active: true
        }, { transaction });
        
        logger.info('New server registered', { serverName: server_name, shopName: shop_name });
      }

      // Update server's last backup info (denormalized for dashboard)
      await server.update({
        lastBackupTime: backup_time,
        lastBackupStatus: status,
        ...(shop_name && { shopName: shop_name }),
        ...(database_name && { databaseName: database_name }),
        ...(ip && { ip })
      }, { transaction });

      // Create backup event
      const event = await BackupEvent.create({
        serverId: server.id,
        serverName: server_name,
        shopName: shop_name,
        databaseName: database_name,
        ip,
        backupTime: backup_time,
        status,
        message,
        sizeBytes: size_bytes,
        durationSeconds: duration_seconds
      }, { transaction });

      insertedIds.push(event.id);

      logger.info('Backup event recorded', {
        serverId: server.id,
        serverName: server_name,
        status,
        eventId: event.id
      });
    }

    await transaction.commit();

    res.status(200).json({
      accepted: true,
      count: insertedIds.length,
      ids: insertedIds
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Report ingestion error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to process report' });
  }
};

module.exports = {
  ingestReport
};
