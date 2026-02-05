import React, { useEffect, useState } from 'react';
import './StarBackground.css';

// Generate Snow Box Shadows (Static for performance, but impure so call in effect)
const generateSnow = (count) => {
    let shadow = '';
    for (let i = 0; i < count; i++) {
        shadow += `${Math.random() * 100}vw ${Math.random() * 100}vh #FFF, `;
    }
    return shadow.slice(0, -2); // Remove last comma
};

/**
 * @typedef {Object} Star
 * @property {number} id
 * @property {string} top
 * @property {string} left
 * @property {string} size
 * @property {string} animationDuration
 * @property {string} animationDelay
 */

/**
 * @typedef {Object} ShootingStar
 * @property {number} id
 * @property {string} top
 * @property {string} left
 * @property {string} animationDuration
 * @property {string} animationDelay
 */

const StarBackground = () => {
    const [state, setState] = useState({
        snow1: '',
        snow2: '',
        snow3: '',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        stars: /** @type {Star[]} */ ([]),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        shootingStars: /** @type {ShootingStar[]} */ ([])
    });

    useEffect(() => {
        // Generate static twinkling stars
        const starCount = 100;
        const newStars = [];
        for (let i = 0; i < starCount; i++) {
            newStars.push({
                id: i,
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                size: Math.random() * 2 + 1 + 'px',
                animationDuration: Math.random() * 3 + 2 + 's',
                animationDelay: Math.random() * 2 + 's'
            });
        }

        // Shooting stars logic
        const shootingStarCount = 30;
        const sStars = [];
        for (let i = 0; i < shootingStarCount; i++) {
            sStars.push({
                id: i,
                top: Math.random() * 60 - 20 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                animationDuration: Math.random() * 1 + 1 + 's'
            });
        }

        // Use setTimeout to avoid "setting state synchronously in effect" warning
        setTimeout(() => {
            setState({
                snow1: generateSnow(200),
                snow2: generateSnow(150),
                snow3: generateSnow(100),
                stars: newStars,
                shootingStars: sStars
            });
        }, 0);
    }, []);

    const { snow1, snow2, snow3, stars, shootingStars } = state;

    return (
        <div className="star-background">
            {stars.map(star => (
                <div
                    key={star.id}
                    className="star"
                    style={{
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size,
                        animationDuration: star.animationDuration,
                        animationDelay: star.animationDelay
                    }}
                />
            ))}
            {shootingStars.map(sStar => (
                <div
                    key={sStar.id}
                    className="shooting-star"
                    style={{
                        top: sStar.top,
                        left: sStar.left,
                        animationDelay: sStar.animationDelay,
                        animationDuration: sStar.animationDuration
                    }}
                />
            ))}

            {/* Snow Layers - Only visible in Dark Mode via CSS */}
            <div className="snow-layer layer-1" style={{ boxShadow: snow1 }}></div>
            <div className="snow-layer layer-2" style={{ boxShadow: snow2 }}></div>
            <div className="snow-layer layer-3" style={{ boxShadow: snow3 }}></div>

            {/* Clouds for Light Mode - Sprite Sheet Variations */}
            {/* Back Layer */}
            <div className="cloud cloud-back cloud-vary-1 cloud-b1"></div>
            <div className="cloud cloud-back cloud-vary-2 cloud-b2"></div>
            <div className="cloud cloud-back cloud-vary-3 cloud-b3"></div>

            {/* Middle Layer */}
            <div className="cloud cloud-mid cloud-vary-1 cloud-m1"></div>
            <div className="cloud cloud-mid cloud-vary-2 cloud-m2"></div>

            {/* Front Layer */}
            <div className="cloud cloud-front cloud-vary-3 cloud-f1"></div>
            <div className="cloud cloud-front cloud-vary-1 cloud-f2"></div>
        </div>
    );
};

export default StarBackground;
