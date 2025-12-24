import React, { useEffect, useRef, useState } from 'react';
import { BiRocket } from 'react-icons/bi';
import './Rocket.css';

const Rocket = () => {
    const rocketRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 } // Trigger when 10% visible
        );

        if (rocketRef.current) {
            observer.observe(rocketRef.current);
        }

        return () => {
            if (rocketRef.current) {
                observer.unobserve(rocketRef.current);
            }
        };
    }, []);

    return (
        <div ref={rocketRef} className={`rocket-container ${isVisible ? 'launch' : ''}`}>
            <img
                src="https://www.pngall.com/wp-content/uploads/2/Rocket-PNG-File.png"
                alt="Rocket"
                className="rocket-img"
            />
            <div className="rocket-exhaust"></div>
            <div className="smoke-cloud"></div>
        </div>
    );
};

export default Rocket;
