const router = require('express').Router();
const { getUser, updateProfile, changePassword } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/:id', getUser);
router.patch('/me', protect, updateProfile);
router.patch('/me/password', protect, changePassword);

module.exports = router;
