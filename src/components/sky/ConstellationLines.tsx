import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { altAzToCartesian } from '../../lib/coords';
import { getStarVisibility } from '../../lib/skyPhysics';
import { useTranslation } from '../../i18n/useTranslation';
import type { ConstellationRenderData } from '../../hooks/useAstroState';

const DOME_RADIUS = 100;
const DEFAULT_COLOR = '#3a4a6b';
const HOVER_COLOR = '#8fb0ff';
const HIGHLIGHT_COLOR = '#ffcc55';
const BELOW_HORIZON_MARGIN = 5;

export interface ConstellationHoverInfo {
  code: string;
  name: string;
  offsetX: number;
  offsetY: number;
}

interface ConstellationLineItem {
  code: string;
  name: string;
  positions: Float32Array;
}

function buildPositions(c: ConstellationRenderData): Float32Array | null {
  const positions: number[] = [];
  for (const [p1, p2] of c.linesHorizontal) {
    const [az1, alt1] = p1;
    const [az2, alt2] = p2;
    if (alt1 < -BELOW_HORIZON_MARGIN && alt2 < -BELOW_HORIZON_MARGIN) continue;
    positions.push(...altAzToCartesian(alt1, az1, DOME_RADIUS), ...altAzToCartesian(alt2, az2, DOME_RADIUS));
  }
  return positions.length > 0 ? new Float32Array(positions) : null;
}

export function ConstellationLines({
  constellations,
  selectedCode,
  hoveredCode,
  sunAltitude,
  onHover,
  onSelect,
}: {
  constellations: ConstellationRenderData[];
  selectedCode: string | null;
  hoveredCode: string | null;
  sunAltitude: number;
  onHover: (info: ConstellationHoverInfo | null) => void;
  onSelect: (code: string) => void;
}) {
  const { language } = useTranslation();
  const dayFade = getStarVisibility(sunAltitude);
  const items: ConstellationLineItem[] = useMemo(
    () =>
      constellations.flatMap((c) => {
        const positions = buildPositions(c);
        const name = language === 'tr' ? c.nameTr : c.nameLatin;
        return positions ? [{ code: c.code, name, positions }] : [];
      }),
    [constellations, language],
  );

  return (
    <>
      {items.map((item) => {
        const isSelected = item.code === selectedCode;
        const isHovered = item.code === hoveredCode;
        const color = isSelected ? HIGHLIGHT_COLOR : isHovered ? HOVER_COLOR : DEFAULT_COLOR;

        return (
          <lineSegments
            key={item.code}
            onPointerMove={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              onHover({ code: item.code, name: item.name, offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY });
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              onHover(null);
            }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              onSelect(item.code);
            }}
          >
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[item.positions, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color={color} transparent opacity={(isSelected || isHovered ? 0.95 : 0.75) * dayFade} />
          </lineSegments>
        );
      })}
    </>
  );
}
