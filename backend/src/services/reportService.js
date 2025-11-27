const { Server, BackupEvent, sequelize } = require('../models');
const { Op } = require('sequelize');

const generateWeeklyMatrix = async (fromDate, toDate) => {
  const servers = await Server.findAll({
    where: { active: true },
    order: [['shopName', 'ASC'], ['name', 'ASC']]
  });

  // Ensure we fetch all events for the full local days between from/to
  const startOfFromDay = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0, 0);
  const endOfToDay = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999);

  const events = await BackupEvent.findAll({
    where: {
      backupTime: {
        [Op.between]: [startOfFromDay, endOfToDay]
      }
    },
    order: [['backupTime', 'ASC']]
  });

  // Helper to generate a local date key (YYYY-MM-DD) so we don't get UTC off-by-one issues
  const getLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Create date range array (local days)
  const dates = [];
  const currentDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0, 0);
  const lastDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 0, 0, 0, 0);

  while (currentDate <= lastDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Build matrix: server × date
  const matrix = servers.map(server => {
    const row = {
      serverId: server.id,
      serverName: server.name,
      shopName: server.shopName,
      databaseName: server.databaseName,
      days: {}
    };

    dates.forEach(date => {
      const dateKey = getLocalDateKey(date);
      const dayEvents = events.filter(e => 
        e.serverId === server.id &&
        getLocalDateKey(e.backupTime) === dateKey
      );

      if (dayEvents.length === 0) {
        row.days[dateKey] = { status: 'missing', count: 0 };
      } else {
        const failed = dayEvents.filter(e => e.status === 'failed').length;
        const success = dayEvents.filter(e => e.status === 'success').length;

        // Option 1: any successful backup in the day makes the day successful
        let status;
        if (success > 0) {
          status = 'success';
        } else if (failed > 0) {
          status = 'failed';
        } else {
          status = 'missing';
        }
        
        row.days[dateKey] = {
          status,
          count: dayEvents.length,
          success,
          failed
        };
      }
    });

    return row;
  });

  return {
    fromDate,
    toDate,
    dates,
    servers: matrix
  };
};

const calculateCompliance = (matrix) => {
  return matrix.servers.map(server => {
    const totalDays = Object.keys(server.days).length;
    const successDays = Object.values(server.days).filter(d => d.status === 'success').length;
    const compliancePercent = totalDays > 0 ? Math.round((successDays / totalDays) * 100) : 0;

    return {
      serverName: server.serverName,
      shopName: server.shopName,
      compliancePercent,
      successDays,
      totalDays
    };
  });
};

module.exports = {
  generateWeeklyMatrix,
  calculateCompliance
};
