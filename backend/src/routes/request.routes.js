const router = require('express').Router();
const { createRequest, updateRequest, getRequests, getContact, deleteRequest } = require('../controllers/request.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.get('/', protect, getRequests);
router.post('/', protect, restrictTo('TENANT'), createRequest);
router.patch('/:id', protect, updateRequest);
router.get('/:id/contact', protect, restrictTo('TENANT'), getContact);
router.delete('/:id', protect, restrictTo('TENANT'), deleteRequest);

module.exports = router;
