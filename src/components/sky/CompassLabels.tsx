import { Text } from '@react-three/drei';
import { altAzToCartesian } from '../../lib/coords';
import { useTranslation } from '../../i18n/useTranslation';

const LABEL_RADIUS = 105;
const DIRECTIONS_TR: Array<{ label: string; azimuth: number }> = [
  { label: 'K', azimuth: 0 },
  { label: 'D', azimuth: 90 },
  { label: 'G', azimuth: 180 },
  { label: 'B', azimuth: 270 },
];
const DIRECTIONS_EN: Array<{ label: string; azimuth: number }> = [
  { label: 'N', azimuth: 0 },
  { label: 'E', azimuth: 90 },
  { label: 'S', azimuth: 180 },
  { label: 'W', azimuth: 270 },
];

export function CompassLabels() {
  const { language } = useTranslation();
  const DIRECTIONS = language === 'tr' ? DIRECTIONS_TR : DIRECTIONS_EN;
  return (
    <>
      {DIRECTIONS.map(({ label, azimuth }) => {
        const position = altAzToCartesian(1, azimuth, LABEL_RADIUS);
        return (
          <Text key={label} position={position} fontSize={4} color="#7fa8ff" anchorX="center" anchorY="middle">
            {label}
          </Text>
        );
      })}
    </>
  );
}
