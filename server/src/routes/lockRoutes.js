const express = require('express');
const lockController = require('../controllers/lockController');
const lockValidator = require('../middleware/lockValidator');

const router = express.Router();

// Route to create a new content lock
router.post('/lock', lockValidator.validateLock, lockController.createLock);

// Route to get all content locks
router.get('/locks', lockController.getAllLocks);

// Route to update a specific content lock
router.put('/lock/:id', lockValidator.validateLock, lockController.updateLock);

// Route to delete a specific content lock
router.delete('/lock/:id', lockController.deleteLock);

module.exports = router;