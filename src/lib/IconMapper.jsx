import React from 'react';
import {
    FaLaptopCode, FaMobileAlt, FaDatabase, FaRobot, FaBrain, FaPalette,
    FaSearch, FaShapes, FaCogs, FaNetworkWired, FaLayerGroup, FaCode
} from 'react-icons/fa';
import {
    SiReact, SiVite, SiFlutter, SiSupabase, SiFirebase, SiNodedotjs,
    SiGoogle, SiZapier, SiOpenai, SiFigma, SiTypescript, SiTailwindcss,
    SiGooglecloud, SiPostgresql
} from 'react-icons/si';

export const iconMap = {
    // General / Services
    'code': <FaCode />,
    'laptop-code': <FaLaptopCode />,
    'mobile': <FaMobileAlt />,
    'database': <FaDatabase />,
    'robot': <FaRobot />,
    'brain': <FaBrain />,
    'palette': <FaPalette />,
    'search': <FaSearch />,
    'shapes': <FaShapes />,
    'cogs': <FaCogs />,

    // Tech Stack
    'react': <SiReact />,
    'vite': <SiVite />,
    'flutter': <SiFlutter />,
    'supabase': <SiSupabase />,
    'firebase': <SiFirebase />,
    'node': <SiNodedotjs />,
    'google': <SiGoogle />,
    'zapier': <SiZapier />,
    'openai': <SiOpenai />,
    'figma': <SiFigma />,
    'typescript': <SiTypescript />,
    'tailwind': <SiTailwindcss />,
    'google-cloud': <SiGooglecloud />,
    'postgresql': <SiPostgresql />,
    'network': <FaNetworkWired />,
    'layer': <FaLayerGroup />
};

export const getIcon = (iconName) => {
    if (!iconName) return <FaCode />; // Default
    // Normalize: lowercase and remove spaces
    const key = iconName.toLowerCase().replace(/\s+/g, '-');
    return iconMap[key] || <FaCode />;
};

export const getIconList = () => Object.keys(iconMap).sort();
