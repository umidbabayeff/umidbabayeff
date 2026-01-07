/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react';
import { BiBot } from 'react-icons/bi';
import './FlyingBot.css';

const FlyingBot = ({ onClick }) => {
    return (
        <div className="flying-bot-container" onClick={onClick}>
            <div className="flying-bot-avatar">
                <BiBot />
            </div>
            <div className="flying-bot-glow"></div>
        </div>
    );
};

export default FlyingBot;
