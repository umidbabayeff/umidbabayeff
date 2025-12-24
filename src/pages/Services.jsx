import React from 'react';
import ServicesList from '../components/services/ServicesList';
import FinalCTA from '../components/home/FinalCTA';

const Services = () => {
    return (
        <div className="page-services">
            <ServicesList />
            <FinalCTA />
        </div>
    );
};

export default Services;
