const express = require('express');
const router = express.Router();
const {
    recordStudentLocation,
    recordTeacherLocation,
    getLatestLocations,
    getAllLocationHistory
} = require('../controllers/locationController');

router.post('/', recordStudentLocation);
router.post('/student', recordStudentLocation);
router.post('/teacher', recordTeacherLocation);
router.get('/', getLatestLocations);
router.get('/history', getAllLocationHistory);

module.exports = router;
