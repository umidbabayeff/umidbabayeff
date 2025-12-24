import React, { useEffect } from 'react';
import './SuccessModal.css';
import { BiCheck, BiX } from 'react-icons/bi';
import { createPortal } from 'react-dom';

const SuccessModal = ({ isOpen, onClose, title, message }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="success-modal-overlay" onClick={onClose}>
            <div className="success-modal-content" onClick={e => e.stopPropagation()}>
                <button className="success-modal-close" onClick={onClose} aria-label="Close">
                    <BiX />
                </button>
                <div className="success-icon-wrapper">
                    <BiCheck />
                </div>
                <h2>{title}</h2>
                <p>{message}</p>
                <button className="btn btn-primary" onClick={onClose}>
                    OK
                </button>
            </div>
        </div>,
        document.body
    );
};

export default SuccessModal;
