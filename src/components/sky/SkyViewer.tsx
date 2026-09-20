import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAstroState } from '../../hooks/useAstroState';
import { useSatellites } from '../../hooks/useSatellites';
import { useAppStore } from '../../state/appStore';
import { altAzToCartesian } from '../../lib/coords';
import { getAmbientIntensity } from '../../lib/skyPhysics';
import { StarField } from './StarField';
import { ConstellationLines, type ConstellationHoverInfo } from './ConstellationLines';
import { CelestialBody } from './CelestialBody';
import { SatelliteMarker } from './SatelliteMarker';
import { MoonMesh, MOON_DISTANCE } from './MoonMesh';
import { MoonApproachController } from './MoonApproachController';
import { MoonApproachButton } from './MoonApproachButton';
import { SkyPath } from './SkyPath';
import { HorizonGround } from './HorizonGround';
import { CompassLabels } from './CompassLabels';
import { CompassHud } from './CompassHud';
import { ZoomControls } from './ZoomControls';
import { HeadingTracker } from './HeadingTracker';
import { SkyDome } from './SkyDome';
import { SunLight } from './SunLight';
import './SkyViewer.css';

interface BodyHoverInfo {
  label: string;
  offsetX: number;
  offsetY: number;
}

const DEFAULT_FOV = 75;
const MIN_FOV = 25;
const MAX_FOV = 100;
const ZOOM_STEP = 8;
const WHEEL_ZOOM_FACTOR = 0.05;

const clampFov = (value: number) => Math.min(MAX_FOV, Math.max(MIN_FOV, value));

export function SkyViewer() {
  const { starsHorizontal, constellationLines, bodyPositions, moonSunDirection, galacticPlane, lightPollution, moonPath, sunPath } =
    useAstroState();
  const selectedConstellation = useAppStore((s) => s.selectedConstellation);
  const setSelectedConstellation = useAppStore((s) => s.setSelectedConstellation);
  const showSatellites = useAppStore((s) => s.showSatellites);
  const showStars = useAppStore((s) => s.showStars);

  const [hoverConstellation, setHoverConstellation] = useState<ConstellationHoverInfo | null>(null);
  const [hoverBody, setHoverBody] = useState<BodyHoverInfo | null>(null);
  const [heading, setHeading] = useState(0);
  const [fov, setFov] = useState(DEFAULT_FOV);
  const [approachMoon, setApproachMoon] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const zoomIn = () => setFov((f) => clampFov(f - ZOOM_STEP));
  const zoomOut = () => setFov((f) => clampFov(f + ZOOM_STEP));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setFov((f) => clampFov(f + e.deltaY * WHEEL_ZOOM_FACTOR));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const moon = bodyPositions.find((b) => b.body === 'Moon');
  const sun = bodyPositions.find((b) => b.body === 'Sun');
  const otherBodies = bodyPositions.filter((b) => b.body !== 'Moon');

  const moonAltitude = moon?.altitude;
  const moonAzimuth = moon?.azimuth;
  const moonPosition = useMemo<[number, number, number] | null>(
    () => (moonAltitude !== undefined && moonAzimuth !== undefined ? altAzToCartesian(moonAltitude, moonAzimuth, MOON_DISTANCE) : null),
    [moonAltitude, moonAzimuth],
  );

  // If the Moon sets (or time gets scrubbed below the horizon) while docked, don't
  // leave the camera stranded near a Moon that's about to stop being rendered.
  useEffect(() => {
    if (approachMoon && (!moon || moon.altitude < -5)) setApproachMoon(false);
  }, [approachMoon, moon]);

  const sunAltitude = sun?.altitude ?? -90;
  const sunAzimuth = sun?.azimuth ?? 0;
  const sunDirection = useMemo<[number, number, number]>(
    () => altAzToCartesian(sunAltitude, sunAzimuth, 1),
    [sunAltitude, sunAzimuth],
  );
  const ambientIntensity = getAmbientIntensity(sunAltitude);

  const { positions: satellitePositions } = useSatellites(sunAltitude);
  const visibleSatellites = showSatellites ? satellitePositions.filter((s) => s.aboveHorizon && s.sunlit) : [];

  const tooltip = hoverConstellation
    ? { label: hoverConstellation.name, offsetX: hoverConstellation.offsetX, offsetY: hoverConstellation.offsetY }
    : hoverBody;

  const handleBodyHover = (label: string, offsetX: number, offsetY: number) => setHoverBody({ label, offsetX, offsetY });
  const handleBodyHoverEnd = () => setHoverBody(null);

  return (
    <div ref={containerRef} className="sky-viewer" style={{ cursor: tooltip ? 'pointer' : undefined }}>
      <Canvas
        raycaster={{ params: { Mesh: {}, Line: { threshold: 1.5 }, LOD: {}, Points: { threshold: 1 }, Sprite: {} } }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 0.01]} fov={fov} near={0.01} far={250} />
        <ambientLight intensity={ambientIntensity} />
        <SunLight direction={sunDirection} altitude={sunAltitude} />

        <SkyDome lightPollution={lightPollution} sunDirection={sunDirection} sunAltitude={sunAltitude} milkyWay={galacticPlane} />
        {showStars && <StarField stars={starsHorizontal} sunAltitude={sunAltitude} />}
        <ConstellationLines
          constellations={constellationLines}
          selectedCode={selectedConstellation}
          hoveredCode={hoverConstellation?.code ?? null}
          sunAltitude={sunAltitude}
          onHover={setHoverConstellation}
          onSelect={(code) => setSelectedConstellation(code === selectedConstellation ? null : code)}
        />
        <SkyPath points={sunPath} color="#ffd27a" />
        <SkyPath points={moonPath} color="#dfe6f5" />
        <CompassLabels />
        {/* Hidden during "Aya Yaklaş": the camera leaves the origin and drifts toward
            the Moon, so the ground plane (anchored at the origin) would otherwise
            slide across the view / poke through near moonset, breaking the
            in-space illusion the approach mode is going for. */}
        {!approachMoon && <HorizonGround lightPollution={lightPollution} sunDirection={sunDirection} sunAltitude={sunAltitude} />}
        <HeadingTracker onChange={setHeading} />

        {otherBodies.map((b) => (
          <CelestialBody
            key={b.body}
            body={b.body}
            azimuth={b.azimuth}
            altitude={b.altitude}
            magnitude={b.magnitude}
            sunAltitude={sunAltitude}
            onHover={handleBodyHover}
            onHoverEnd={handleBodyHoverEnd}
          />
        ))}
        {moon && (
          <MoonMesh
            azimuth={moon.azimuth}
            altitude={moon.altitude}
            sunDirection={moonSunDirection}
            highDetail={approachMoon}
            onHover={handleBodyHover}
            onHoverEnd={handleBodyHoverEnd}
            onClick={() => setApproachMoon((v) => !v)}
          />
        )}
        {visibleSatellites.map((s) => (
          <SatelliteMarker key={s.noradId} satellite={s} onHover={handleBodyHover} onHoverEnd={handleBodyHoverEnd} />
        ))}

        <MoonApproachController active={approachMoon} moonPosition={moonPosition} controlsRef={controlsRef} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[0, 0, 0]}
          enablePan={false}
          enableZoom={false}
          rotateSpeed={-0.4}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
      </Canvas>

      <CompassHud headingDeg={heading} />
      <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} canZoomIn={fov > MIN_FOV} canZoomOut={fov < MAX_FOV} />
      <MoonApproachButton
        active={approachMoon}
        disabled={!moon || moon.altitude < -5}
        onToggle={() => setApproachMoon((v) => !v)}
      />

      {tooltip && (
        <div className="sky-viewer__tooltip" style={{ left: tooltip.offsetX, top: tooltip.offsetY }}>
          {tooltip.label}
        </div>
      )}
    </div>
  );
}
