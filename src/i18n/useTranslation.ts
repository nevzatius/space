import { useAppStore } from '../state/appStore';
import { getTranslations, type TranslationDict } from './translations';
import type { Language } from './language';

export function useTranslation(): { t: TranslationDict; language: Language } {
  const language = useAppStore((s) => s.language);
  return { t: getTranslations(language), language };
}
