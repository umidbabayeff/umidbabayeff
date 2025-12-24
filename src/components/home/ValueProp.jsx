import { BiBuildings, BiCog, BiTrendingUp, BiBot } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import './ValueProp.css';

const ValueProp = () => {
    const { t } = useTranslation();

    return (
        <section className="section value-prop">
            <div className="container">
                <div className="value-header">
                    <h2>{t('value_prop.header')}</h2>
                    <p>{t('value_prop.subheader')}</p>
                </div>

                <div className="value-grid">
                    <div className="value-card">
                        <div className="value-icon"><BiBuildings /></div>
                        <h3>{t('value_prop.cards.architecture.title')}</h3>
                        <p>{t('value_prop.cards.architecture.desc')}</p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon"><BiCog /></div>
                        <h3>{t('value_prop.cards.automation.title')}</h3>
                        <p>{t('value_prop.cards.automation.desc')}</p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon"><BiTrendingUp /></div>
                        <h3>{t('value_prop.cards.scalability.title')}</h3>
                        <p>{t('value_prop.cards.scalability.desc')}</p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon"><BiBot /></div>
                        <h3>{t('value_prop.cards.ai.title')}</h3>
                        <p>{t('value_prop.cards.ai.desc')}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ValueProp;
