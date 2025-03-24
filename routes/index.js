const express = require('express');
const locationRoutes = require('./locationRoutes');
const chatRoutes = require('./chatRoutes');
const functChatRoutes = require('./functChatRoutes');
const authRoutes = require('./authRoutes');
const staticRoutes = require('./staticRoutes');

const router = express.Router();

router.use('/api', locationRoutes);
router.use('/api/chat', chatRoutes);
router.use('/api', functChatRoutes);
router.use('/api', chatRoutes);
router.use('/', authRoutes);
router.use('/', staticRoutes);

module.exports = router;
