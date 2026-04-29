const express = require('express');
const router = express.Router();
const {
    teacherDashboard,
    registerStudentView,
    createStudentView,
    loginTeacherView,
    loginTeacher,
    studentMapView
} = require('../controllers/viewController');

// Async error handler
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Teacher dashboard route
router.get('/teacher-dashboard/:id', asyncHandler(teacherDashboard));

// Student registration routes
router.get('/register-student', registerStudentView);
router.post('/register-student', asyncHandler(createStudentView));

// Student tracking map route
router.get('/student-map', studentMapView);

// Teacher login routes
router.get('/login-teacher', loginTeacherView);
router.post('/login-teacher', asyncHandler(loginTeacher));

module.exports = router;
