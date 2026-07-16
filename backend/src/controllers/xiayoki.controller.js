// Xiayoki Controller — POST /api/xiayoki/chat
const { getReply } = require('../services/xiayoki.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/xiayoki/chat
 * Body: { message: string, history?: Array<{role: string, content: string}> }
 */
const chat = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    });
  }

  if (message.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Message too long (max 500 characters)',
    });
  }

  const result = await getReply(message.trim(), history);

  res.json({
    success: true,
    data: result,
  });
});

module.exports = { chat };
