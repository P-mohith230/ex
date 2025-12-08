import React from 'react';

const ContentLockIndicator = ({ isLocked }) => {
    return (
        <div className={`content-lock-indicator ${isLocked ? 'locked' : 'unlocked'}`}>
            {isLocked ? (
                <span>Content is locked</span>
            ) : (
                <span>Content is unlocked</span>
            )}
        </div>
    );
};

export default ContentLockIndicator;