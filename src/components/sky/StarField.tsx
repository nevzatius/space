import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { altAzToCartesian } from '../../lib/coords';
import { getStarSpriteTexture } from '../../lib/textures';
import { getExtinctionFactor, getExtinctionTint, getStarVisibility } from '../../lib/skyPhysics';
import { mulberry32 } from '../../lib/random';
import type { StarHorizontal } from '../../types/astronomy';

const DOME_RADIUS = 100;

const vertexShader = `
  attribute float aSize;
  attribute vec3 color;
  attribute float aPhase;
  uniform float uTime;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = color;
    vTwinkle = 0.82 + 0.18 * sin(uTime * 2.4 + aPhase);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * vTwinkle;
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec4 tex = texture2D(uTexture, gl_PointCoord);
    if (tex.a < 0.05) discard;
    gl_FragColor = vec4(vColor, tex.a * vTwinkle);
  }
`;

function bvToColor(bv: number): THREE.Color {
  const t = THREE.MathUtils.clamp((bv + 0.4) / 2.4, 0, 1);
  const color = new THREE.Color();
  color.setHSL(0.62 - t * 0.62, 0.55, 0.85);
  return color;
}

export function StarField({ stars, sunAltitude }: { stars: StarHorizontal[]; sunAltitude: number }) {
  const texture = useMemo(() => getStarSpriteTexture(), []);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, colors, phases } = useMemo(() => {
    const visible = stars.filter((s) => s.altitude > -2);
    const rand = mulberry32(4471);
    const positions = new Float32Array(visible.length * 3);
    const sizes = new Float32Array(visible.length);
    const colors = new Float32Array(visible.length * 3);
    const phases = new Float32Array(visible.length);
    const dayFade = getStarVisibility(sunAltitude);
    visible.forEach((s, i) => {
      const [x, y, z] = altAzToCartesian(s.altitude, s.azimuth, DOME_RADIUS);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      const brightness = THREE.MathUtils.clamp((6 - s.mag) / 7.5, 0.05, 1);
      const extinction = getExtinctionFactor(s.altitude);
      sizes[i] = (1.2 + brightness * 4) * extinction * dayFade;
      const color = bvToColor(s.bv).multiply(getExtinctionTint(s.altitude)).multiplyScalar(extinction * dayFade);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      phases[i] = rand() * Math.PI * 2;
    });
    return { positions, sizes, colors, phases };
  }, [stars, sunAltitude]);

  const uniforms = useMemo(() => ({ uTexture: { value: texture }, uTime: { value: 0 } }), [texture]);

  useFrame((state) => {
    // react-three-fiber copies the `uniforms` prop into the material's own uniforms
    // object on mount rather than keeping our object as the live reference, so the
    // update has to go through the mounted material via a ref, not `uniforms` itself.
    const material = materialRef.current;
    if (material) material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
