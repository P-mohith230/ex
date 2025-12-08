const mongoose = require('mongoose');

const contentLockSchema = new mongoose.Schema({
    reason: {
        type: String,
        required: true,
        trim: true
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the updatedAt field on save
contentLockSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const ContentLock = mongoose.model('ContentLock', contentLockSchema);

module.exports = ContentLock;