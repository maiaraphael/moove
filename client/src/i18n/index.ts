import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';

const SUPPORTED = ['en', 'pt', 'es'];
const saved = localStorage.getItem('moove_lang');
const activeLang = saved && SUPPORTED.includes(saved) ? saved : 'en';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            pt: { translation: pt },
            es: { translation: es },
        },
        lng: activeLang,
        fallbackLng: 'en',
        defaultNS: 'translation',
        interpolation: { escapeValue: false },
        initImmediate: false,
    });

export default i18n;
