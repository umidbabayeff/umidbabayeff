import { BiGlobe, BiMobileAlt, BiLayer, BiBrain } from 'react-icons/bi';

export const services = [
    {
        id: 'web',
        title: 'calc.services.web.title',
        icon: BiGlobe,
        basePrice: 1500,
        description: 'calc.services.web.desc'
    },
    {
        id: 'mobile',
        title: 'calc.services.mobile.title',
        icon: BiMobileAlt,
        basePrice: 3500,
        description: 'calc.services.mobile.desc'
    },
    {
        id: 'system',
        title: 'calc.services.system.title',
        icon: BiLayer,
        basePrice: 4500,
        description: 'calc.services.system.desc'
    },
    {
        id: 'ai',
        title: 'calc.services.ai.title',
        icon: BiBrain,
        basePrice: 2500,
        description: 'calc.services.ai.desc'
    }
];

export const types = [
    {
        id: 'mvp',
        title: 'calc.types.mvp.title',
        multiplier: 1,
        description: 'calc.types.mvp.desc'
    },
    {
        id: 'growth',
        title: 'calc.types.growth.title',
        multiplier: 1.5,
        description: 'calc.types.growth.desc'
    },
    {
        id: 'enterprise',
        title: 'calc.types.enterprise.title',
        multiplier: 2.5,
        description: 'calc.types.enterprise.desc'
    }
];

export const features = [
    { id: 'cms', title: 'calc.features.cms', price: 500, type: 'web' },
    { id: 'payment', title: 'calc.features.payment', price: 600, type: 'all' },
    { id: 'auth', title: 'calc.features.auth', price: 400, type: 'all' },
    { id: 'multi_lang', title: 'calc.features.multi_lang', price: 300, type: 'all' },
    { id: 'seo', title: 'calc.features.seo', price: 300, type: 'web' },
    { id: 'api', title: 'calc.features.api', price: 500, type: 'all' },
    { id: 'chat', title: 'calc.features.chat', price: 200, type: 'web' },
    { id: 'ai_bot', title: 'calc.features.ai_bot', price: 1200, type: 'ai' },
];
