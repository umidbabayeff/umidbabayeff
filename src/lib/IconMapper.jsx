import {
    FaLaptopCode, FaMobileAlt, FaDatabase, FaRobot, FaBrain, FaPalette,
    FaSearch, FaShapes, FaCogs, FaNetworkWired, FaLayerGroup, FaCode,
    FaBuilding, FaChartLine, FaRocket, FaLock, FaGlobe
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
    'building': <FaBuilding />,
    'chart-line': <FaChartLine />,
    'rocket': <FaRocket />,
    'lock': <FaLock />,
    'globe': <FaGlobe />,
    'network': <FaNetworkWired />,
    'layer': <FaLayerGroup />,

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
    'postgresql': <SiPostgresql />
};

export const getIcon = (iconName) => {
    if (!iconName || typeof iconName !== 'string') return <FaCode />; // Default
    // Normalize: lowercase and remove spaces
    const key = iconName.toLowerCase().replace(/\s+/g, '-');
    // @ts-expect-error: Implicit any on iconMap access using string key
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return iconMap[key] ?? <FaCode />;
};

export const getIconList = () => Object.keys(iconMap).sort();
