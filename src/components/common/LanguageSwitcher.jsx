import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (/** @type {any} */ e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
        void i18n.changeLanguage(/** @type {string} */(e.target.value));
    };

    return (
        <div className="language-switcher-container">
            <select
                value={i18n.language.split('-')[0]}
                onChange={changeLanguage}
                className="language-select"
            >
                <option value="en">EN</option>
                <option value="ru">RU</option>
                <option value="az">AZ</option>
            </select>
        </div>
    );
};

export default LanguageSwitcher;
