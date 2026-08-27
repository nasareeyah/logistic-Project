const express = require('express');
const router = express.Router();

router.use(require('./customers'));
router.use(require('./cars'));
router.use(require('./drivers'));
router.use(require('./documents'));
router.use(require('./locations'));
router.use(require('./bookings'));

module.exports = router;
