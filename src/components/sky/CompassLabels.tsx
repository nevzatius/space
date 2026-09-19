import { Text } from '@react-three/drei';
import { altAzToCartesian } from '../../lib/coords';

const LABEL_RADIUS = 105;
const DIRECTIONS: Array<{ label: string; azimuth: number }> = [
  { label: 'K', azimuth: 0 },
  { label: 'D', azimuth: 90 },
  { label: 'G', azimuth: 180 },
  { label: 'B', azimuth: 270 },
];

export function CompassLabels() {
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
