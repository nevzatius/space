import type { BodyName } from '../types/astronomy';
import type { Language } from '../i18n/language';

export const BODY_NAME_TR: Record<BodyName, string> = {
  Sun: 'Güneş',
  Moon: 'Ay',
  Mercury: 'Merkür',
  Venus: 'Venüs',
  Mars: 'Mars',
  Jupiter: 'Jüpiter',
  Saturn: 'Satürn',
};

/** BodyName values are already the standard English names, so English needs no lookup table. */
export function getBodyName(body: BodyName, language: Language): string {
  return language === 'tr' ? BODY_NAME_TR[body] : body;
}
