import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value);
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
