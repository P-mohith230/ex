const ContentLock = require('../models/ContentLock');

// Create a new content lock
exports.createLock = async (req, res) => {
    try {
        const { reason } = req.body;
        const newLock = new ContentLock({ reason });
        await newLock.save();
        res.status(201).json(newLock);
    } catch (error) {
        res.status(500).json({ message: 'Error creating content lock', error });
    }
};

// Get all content locks
exports.getLocks = async (req, res) => {
    try {
        const locks = await ContentLock.find();
        res.status(200).json(locks);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving content locks', error });
    }
};

// Delete a content lock
exports.deleteLock = async (req, res) => {
    try {
        const { id } = req.params;
        await ContentLock.findByIdAndDelete(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting content lock', error });
    }
};