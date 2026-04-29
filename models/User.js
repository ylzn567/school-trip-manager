const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    idNumber: { type: String, unique: true, sparse: true },
    password: { type: String },
    role: { type: String, default: 'user' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
