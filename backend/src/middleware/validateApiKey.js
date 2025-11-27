const { ApiKey } = require('../models');
const logger = require('../config/logger');

const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-KEY');
    
    if (!apiKey) {
      logger.warn('API request without key', { ip: req.ip, path: req.path });
      return res.status(401).json({ error: 'API key required' });
    }

    // Check against master key first (from env)
    if (apiKey === process.env.MASTER_API_KEY) {
      req.apiKeyValid = true;
      return next();
    }

    // Check against database keys
    const key = await ApiKey.findOne({ where: { key: apiKey, active: true } });
    
    if (!key) {
      logger.warn('Invalid API key attempt', { ip: req.ip, path: req.path });
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    req.apiKeyValid = true;
    req.apiKey = key;
    next();
  } catch (error) {
    logger.error('API key validation error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = validateApiKey;
