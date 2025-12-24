import React from 'react';
import Hero from '../components/home/Hero';
import ValueProp from '../components/home/ValueProp';
import Process from '../components/home/Process';
import FAQ from '../components/home/FAQ';
import FinalCTA from '../components/home/FinalCTA';

const Home = () => {
    return (
        <div className="page-home">
            <Hero />
            <ValueProp />
            <Process />
            <FAQ />
            <FinalCTA />
        </div>
    );
};

export default Home;
