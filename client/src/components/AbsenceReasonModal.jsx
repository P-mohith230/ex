import React, { useState } from 'react';
import Modal from 'react-modal';

const AbsenceReasonModal = ({ isOpen, onRequestClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [isLocked, setIsLocked] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isLocked) {
            onSubmit(reason);
            setReason('');
            onRequestClose();
        }
    };

    const toggleLock = () => {
        setIsLocked(!isLocked);
    };

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
            <h2>Enter Absence Reason</h2>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isLocked}
                    placeholder={isLocked ? "Content is locked" : "Enter reason here"}
                />
                <button type="button" onClick={toggleLock}>
                    {isLocked ? 'Unlock' : 'Lock'} Reason
                </button>
                <button type="submit" disabled={isLocked}>Submit</button>
            </form>
        </Modal>
    );
};

export default AbsenceReasonModal;