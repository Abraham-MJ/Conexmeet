import { useLanguage } from '../context/useLanguageContext';

export const useTranslation = () => {
  const { language, setLanguage, t } = useLanguage();
  
  return {
    language,
    setLanguage,
    t,
    isSpanish: language === 'es',
    isEnglish: language === 'en',
  };
};