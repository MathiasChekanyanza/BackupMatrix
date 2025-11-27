const { Server, BackupEvent } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const listServers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      shop = '',
      active = 'true'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    if (shop) {
      where.shopName = { [Op.iLike]: `%${shop}%` };
    }

    if (active !== 'all') {
      where.active = active === 'true';
    }

    const { rows: servers, count } = await Server.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']],
      attributes: [
        'id',
        'name',
        'shopName',
        'databaseName',
        'ip',
        'location',
        'active',
        'lastBackupTime',
        'lastBackupStatus',
        'createdAt'
      ]
    });

    res.json({
      servers,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('List servers error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getServerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 30 } = req.query;

    const server = await Server.findByPk(id);

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const backupEvents = await BackupEvent.findAll({
      where: { serverId: id },
      order: [['backupTime', 'DESC']],
      limit: parseInt(limit)
    });

    const stats = await BackupEvent.findAll({
      where: {
        serverId: id,
        backupTime: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      attributes: [
        'status',
        [Server.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true
    });

    res.json({
      server,
      backupEvents,
      stats: {
        last30Days: stats.reduce((acc, s) => {
          acc[s.status] = parseInt(s.count);
          return acc;
        }, { success: 0, failed: 0, partial: 0 })
      }
    });
  } catch (error) {
    logger.error('Get server details error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateServer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopName, databaseName, location, active } = req.body;

    const server = await Server.findByPk(id);

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    await server.update({
      ...(shopName !== undefined && { shopName }),
      ...(databaseName !== undefined && { databaseName }),
      ...(location !== undefined && { location }),
      ...(active !== undefined && { active })
    });

    logger.info('Server updated', { serverId: id, updatedBy: req.user.username });

    res.json({ server });
  } catch (error) {
    logger.error('Update server error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalServers = await Server.count({ where: { active: true } });

    const reportedToday = await Server.count({
      where: {
        active: true,
        lastBackupTime: {
          [Op.gte]: today
        }
      }
    });

    const failedToday = await Server.count({
      where: {
        active: true,
        lastBackupTime: {
          [Op.gte]: today
        },
        lastBackupStatus: 'failed'
      }
    });

    const missingToday = totalServers - reportedToday;

    const recentEvents = await BackupEvent.findAll({
      where: {
        backupTime: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      order: [['backupTime', 'DESC']],
      limit: 100
    });

    res.json({
      summary: {
        totalServers,
        reportedToday,
        failedToday,
        missingToday
      },
      recentEvents
    });
  } catch (error) {
    logger.error('Dashboard stats error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  listServers,
  getServerDetails,
  updateServer,
  getDashboardStats
};
