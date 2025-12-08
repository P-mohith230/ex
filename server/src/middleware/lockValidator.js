const lockValidator = (req, res, next) => {
    const { absenceReason } = req.body;

    if (!absenceReason) {
        return res.status(400).json({ message: 'Absence reason is required.' });
    }

    // Implement content-locking logic here
    const isLocked = checkIfContentIsLocked(absenceReason); // Placeholder function

    if (isLocked) {
        return res.status(403).json({ message: 'Content is locked for this absence reason.' });
    }

    next();
};

const checkIfContentIsLocked = (reason) => {
    // Placeholder logic for checking if the content is locked
    const lockedReasons = ['sick', 'family emergency']; // Example locked reasons
    return lockedReasons.includes(reason);
};

module.exports = lockValidator;