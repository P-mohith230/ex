const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    studentId: {
        type: String,
        required: true,
        unique: true,
    },
    class: {
        type: String,
        required: true,
    },
    attendance: [{
        date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['present', 'absent'],
            required: true,
        },
        absenceReason: {
            type: String,
            default: null,
        },
    }],
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;