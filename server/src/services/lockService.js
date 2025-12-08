const mongoose = require('mongoose');
const ContentLock = require('../models/ContentLock');

// Function to create a new content lock
const createContentLock = async (absenceReason) => {
    const newLock = new ContentLock({ reason: absenceReason });
    return await newLock.save();
};

// Function to retrieve all content locks
const getContentLocks = async () => {
    return await ContentLock.find();
};

// Function to delete a content lock by ID
const deleteContentLock = async (id) => {
    return await ContentLock.findByIdAndDelete(id);
};

// Function to check if a specific absence reason is locked
const isReasonLocked = async (absenceReason) => {
    const lock = await ContentLock.findOne({ reason: absenceReason });
    return lock !== null;
};

module.exports = {
    createContentLock,
    getContentLocks,
    deleteContentLock,
    isReasonLocked,
};