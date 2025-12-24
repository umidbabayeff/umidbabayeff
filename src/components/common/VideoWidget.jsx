import React, { useState } from 'react';
import { BiX, BiExpand, BiCollapse } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import './VideoWidget.css';

const VideoWidget = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(true);
    const [isvVisible, setIsVisible] = useState(true);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isvVisible) return null;

    return (
        <div className={`video-widget ${isOpen ? 'open' : 'minimized'}`}>
            <div className="widget-header">
                <span className="widget-title">{t('widget.title')}</span>
                <div className="widget-controls">
                    <button className="icon-btn" onClick={toggleOpen}>
                        {isOpen ? <BiCollapse /> : <BiExpand />}
                    </button>
                    <button className="icon-btn" onClick={handleClose}>
                        <BiX />
                    </button>
                </div>
            </div>

            <div className="video-container">
                <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/tkxKnPklJhY?start=503&autoplay=1&mute=1"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="widget-video"
                ></iframe>
            </div>

            {isOpen && (
                <div className="widget-footer">
                    <p>{t('widget.subtitle')}</p>
                </div>
            )}
        </div>
    );
};

export default VideoWidget;
