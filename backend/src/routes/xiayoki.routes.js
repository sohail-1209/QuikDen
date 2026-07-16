// Xiayoki Routes
const { Router } = require('express');
const { chat } = require('../controllers/xiayoki.controller');

const router = Router();

router.post('/chat', chat);

module.exports = router;
