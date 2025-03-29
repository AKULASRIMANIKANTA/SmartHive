const express = require('express');
const router = express.Router();
const AmenitiesController = require('../controllers/AmenitiesController');

router.post('/book', AmenitiesController.bookAmenity);
router.get('/', AmenitiesController.getAllAmenities);

module.exports = router;
