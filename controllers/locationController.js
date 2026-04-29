const Student = require('../models/Students');
const Teacher = require('../models/Teacher');
const StudentLocation = require('../models/Location');
const TeacherLocation = require('../models/TeacherLocation');

const parseNumber = (value) => {
    if (typeof value === 'string') {
        value = value.trim();
    }
    const number = Number(value);
    if (Number.isNaN(number)) {
        throw new Error('Invalid numeric value in coordinates');
    }
    return number;
};

const convertDmsToDecimal = ({ Degrees, Minutes, Seconds }) => {
    const degrees = parseNumber(Degrees);
    const minutes = parseNumber(Minutes);
    const seconds = parseNumber(Seconds);

    if (degrees < 0 || minutes < 0 || seconds < 0) {
        throw new Error('Coordinate values must be positive numbers');
    }

    return degrees + (minutes / 60) + (seconds / 3600);
};

const recordStudentLocation = async (req, res) => {
    try {
        const { ID, Coordinates, Time } = req.body;

        if (!ID || !Coordinates || !Time) {
            return res.status(400).json({ message: 'Payload must contain ID, Coordinates and Time' });
        }

        if (!Coordinates.Latitude || !Coordinates.Longitude) {
            return res.status(400).json({ message: 'Coordinates must include Latitude and Longitude' });
        }

        const studentIdNumber = String(ID).trim();
        const student = await Student.findOne({ idNumber: studentIdNumber });
        if (!student) {
            return res.status(404).json({ message: 'Student not found for ID ' + studentIdNumber });
        }

        const latitude = convertDmsToDecimal(Coordinates.Latitude);
        const longitude = convertDmsToDecimal(Coordinates.Longitude);
        const reportedAt = new Date(Time);
        if (Number.isNaN(reportedAt.getTime())) {
            return res.status(400).json({ message: 'Time field is not a valid ISO timestamp' });
        }

        const location = new StudentLocation({
            studentId: student._id,
            latitude,
            longitude,
            reportedAt
        });

        const savedLocation = await location.save();
        res.status(201).json({ message: 'Student location saved successfully', location: savedLocation });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const recordTeacherLocation = async (req, res) => {
    try {
        const { ID, Coordinates, Time } = req.body;

        if (!ID || !Coordinates || !Time) {
            return res.status(400).json({ message: 'Payload must contain ID, Coordinates and Time' });
        }

        if (!Coordinates.Latitude || !Coordinates.Longitude) {
            return res.status(400).json({ message: 'Coordinates must include Latitude and Longitude' });
        }

        const teacherIdNumber = String(ID).trim();
        const teacher = await Teacher.findOne({ idNumber: teacherIdNumber });
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found for ID ' + teacherIdNumber });
        }

        const latitude = convertDmsToDecimal(Coordinates.Latitude);
        const longitude = convertDmsToDecimal(Coordinates.Longitude);
        const reportedAt = new Date(Time);
        if (Number.isNaN(reportedAt.getTime())) {
            return res.status(400).json({ message: 'Time field is not a valid ISO timestamp' });
        }

        const location = new TeacherLocation({
            teacherId: teacher._id,
            latitude,
            longitude,
            reportedAt
        });

        const savedLocation = await location.save();
        res.status(201).json({ message: 'Teacher location saved successfully', location: savedLocation });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const getLatestLocations = async (req, res) => {
    try {
        const studentLocations = await StudentLocation.aggregate([
            { $sort: { studentId: 1, reportedAt: -1 } },
            { $group: { _id: '$studentId', doc: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$doc' } },
            {
                $lookup: {
                    from: 'students',
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            { $unwind: '$student' },
            {
                $project: {
                    _id: 1,
                    latitude: 1,
                    longitude: 1,
                    reportedAt: 1,
                    type: { $literal: 'student' },
                    entity: {
                        idNumber: '$student.idNumber',
                        firstName: '$student.firstName',
                        lastName: '$student.lastName',
                        className: '$student.className'
                    }
                }
            },
            { $sort: { 'entity.firstName': 1 } }
        ]);

        const teacherLocations = await TeacherLocation.aggregate([
            { $sort: { teacherId: 1, reportedAt: -1 } },
            { $group: { _id: '$teacherId', doc: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$doc' } },
            {
                $lookup: {
                    from: 'teachers',
                    localField: 'teacherId',
                    foreignField: '_id',
                    as: 'teacher'
                }
            },
            { $unwind: '$teacher' },
            {
                $project: {
                    _id: 1,
                    latitude: 1,
                    longitude: 1,
                    reportedAt: 1,
                    type: { $literal: 'teacher' },
                    entity: {
                        idNumber: '$teacher.idNumber',
                        firstName: '$teacher.firstName',
                        lastName: '$teacher.lastName',
                        className: '$teacher.className'
                    }
                }
            },
            { $sort: { 'entity.firstName': 1 } }
        ]);

        res.json({ students: studentLocations, teachers: teacherLocations });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAllLocationHistory = async (req, res) => {
    try {
        const studentHistory = await StudentLocation.find()
            .sort({ reportedAt: -1 })
            .populate('studentId', 'firstName lastName idNumber className');

        const teacherHistory = await TeacherLocation.find()
            .sort({ reportedAt: -1 })
            .populate('teacherId', 'firstName lastName idNumber className');

        res.json({
            students: studentHistory.map(item => ({
                id: item._id,
                latitude: item.latitude,
                longitude: item.longitude,
                reportedAt: item.reportedAt,
                student: {
                    idNumber: item.studentId.idNumber,
                    firstName: item.studentId.firstName,
                    lastName: item.studentId.lastName,
                    className: item.studentId.className
                }
            })),
            teachers: teacherHistory.map(item => ({
                id: item._id,
                latitude: item.latitude,
                longitude: item.longitude,
                reportedAt: item.reportedAt,
                teacher: {
                    idNumber: item.teacherId.idNumber,
                    firstName: item.teacherId.firstName,
                    lastName: item.teacherId.lastName,
                    className: item.teacherId.className
                }
            }))
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    recordStudentLocation,
    recordTeacherLocation,
    getLatestLocations,
    getAllLocationHistory
};