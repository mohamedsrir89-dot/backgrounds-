import * as THREE from 'three';

/**
 * Procedural star particle texture generated dynamically via HTML5 Canvas.
 * Zero external file dependencies.
 */
export function createGlowTexture(size = 128): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.12, 'rgba(235, 245, 255, 0.9)');
  gradient.addColorStop(0.35, 'rgba(180, 210, 255, 0.4)');
  gradient.addColorStop(0.65, 'rgba(120, 160, 255, 0.12)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 30, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates soft volumetric nebula sprite texture
 */
export function createNebulaPuffTexture(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.2, 'rgba(240, 240, 255, 0.6)');
  gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.2)');
  gradient.addColorStop(0.8, 'rgba(150, 180, 255, 0.05)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * High-fidelity Volumetric Nebula Custom Shader Material
 */
export const NebulaShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorPrimary;
    uniform vec3 uColorSecondary;
    uniform vec3 uColorAccent;
    uniform vec3 uColorDust;
    uniform float uTurbulence;
    uniform float uBrightness;
    uniform float uScale;
    uniform vec2 uVortexCenter;
    uniform float uVortexForce;
    uniform vec2 uResolution;

    varying vec2 vUv;
    varying vec3 vWorldPosition;

    // Fast 3D Simplex-style noise approximation
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    // Fractional Brownian Motion (fBm)
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(p * frequency);
        p += vec3(1.23, 3.45, 5.67);
        frequency *= 2.05;
        amplitude *= 0.52;
      }
      return value;
    }

    void main() {
      vec2 st = (vUv - 0.5) * 2.0;
      
      // Interactive Vortex disturbance
      vec2 toVortex = st - uVortexCenter;
      float distToVortex = length(toVortex);
      float vortexAngle = atan(toVortex.y, toVortex.x);
      float swirl = exp(-distToVortex * 3.5) * uVortexForce * 4.0;
      vortexAngle += swirl;
      vec2 swirledSt = uVortexCenter + vec2(cos(vortexAngle), sin(vortexAngle)) * distToVortex;

      // Coordinate scaling
      vec3 coord = vec3(swirledSt * uScale * 1.5, uTime * 0.06);

      // Multi-layer nested noise
      float q1 = fbm(coord * uTurbulence + vec3(0.0, uTime * 0.03, 0.0));
      float q2 = fbm(coord * (uTurbulence * 1.3) + vec3(q1 * 1.8, 1.2, uTime * 0.04));
      float f = fbm(coord + vec3(q2 * 2.2, q1 * 1.5, 0.0));

      // Galaxy core circular vignette falloff
      float radialFalloff = smoothstep(1.35, 0.2, length(st * vec2(1.0, 1.3)));

      // Color mapping
      vec3 col = mix(uColorDust, uColorPrimary, smoothstep(-0.3, 0.4, f));
      col = mix(col, uColorSecondary, smoothstep(0.1, 0.7, q2));
      col = mix(col, uColorAccent, smoothstep(0.4, 0.95, f * q1));

      // Galaxy core white-hot highlight
      float coreGlow = smoothstep(0.65, 0.0, length(st * vec2(1.1, 1.4))) * 0.4;
      col += vec3(1.0, 0.96, 0.9) * coreGlow;

      float alpha = clamp((f * 0.7 + 0.45) * radialFalloff * uBrightness, 0.0, 0.98);

      gl_FragColor = vec4(col * (uBrightness * 1.2), alpha);
    }
  `
};

/**
 * Starfield Points Shader with twinkle and soft glowing disc
 */
export const StarPointsShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uSizeMultiplier;
    uniform float uTwinkleSpeed;
    
    attribute float aSize;
    attribute vec3 aColor;
    attribute float aPhase;
    attribute float aTwinkleAmp;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = aColor;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Distance attenuation
      float dist = length(mvPosition.xyz);
      float pointSize = (aSize * uSizeMultiplier * 45.0) / max(dist, 1.0);
      gl_PointSize = clamp(pointSize * uPixelRatio, 1.5, 64.0);

      // Twinkle calculation
      float twinkle = sin(uTime * uTwinkleSpeed * 3.0 + aPhase) * 0.5 + 0.5;
      vAlpha = 0.4 + twinkle * aTwinkleAmp * 0.6;
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec4 texColor = texture2D(uTexture, gl_PointCoord);
      if (texColor.a < 0.02) discard;

      // Soft center core + colored halo
      vec3 finalColor = vColor * texColor.rgb * 1.4;
      gl_FragColor = vec4(finalColor, texColor.a * vAlpha);
    }
  `
};
