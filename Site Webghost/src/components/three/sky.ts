import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial, Vector2, Vector4 } from 'three'

/**
 * Céu de nuvens em preto e branco + areia que o cursor levanta.
 * - nuvens volumosas (billow + distorção de domínio), movimento lento
 * - luz vinda da peça acende as bordas voltadas para ela
 * - pontilhado fino só nas partes iluminadas
 * - rastro do cursor: grãos saem das nuvens, se espalham, caem e somem;
 *   a nuvem perde pontilhado no caminho e se recompõe
 */

export const TRAIL = 16 // pontos do rastro do cursor
export const TRAIL_LIFE = 1.6 // s até um grão sumir

// ——— GLSL compartilhado entre o céu e as partículas ———
const COMMON = /* glsl */ `
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uLight;
  uniform float uGlow;
  uniform vec4 uTrail[${TRAIL}]; // xy = posição, z = idade (s), w = força

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0; float a = 0.5;
    for (int i = 0; i < OCTAVES; i++) { s += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
    return s;
  }
  float billow(vec2 p) {
    float s = 0.0; float a = 0.55;
    for (int i = 0; i < OCTAVES; i++) { s += a * (1.0 - abs(noise(p) * 2.0 - 1.0)); p = p * 2.07 + vec2(3.1, 7.7); a *= 0.48; }
    return s;
  }
  float cloud(vec2 p) {
    vec2 q = vec2(fbm(p * 0.6 + vec2(0.0, uTime * 0.012)), fbm(p * 0.6 + vec2(5.2, 1.3) - uTime * 0.009));
    return billow(p + 0.9 * q);
  }
  // luminosidade da nuvem num ponto do céu (p: centro = 0, y de -0.5 a 0.5)
  float skyLum(vec2 p, float asp) {
    vec2 sp = p + uMouse * vec2(0.03, 0.018);
    vec2 cp = sp * vec2(1.35, 1.6) + vec2(0.4, 1.1);
    float d = cloud(cp);
    float side = smoothstep(0.1, 0.9, abs(p.x) / (asp * 0.5));
    float topClear = smoothstep(0.05, 0.48, p.y) * (1.0 - side * 0.7);
    float mass = 0.55 + 0.35 * smoothstep(0.5, -0.4, p.y) + 0.25 * side - 0.4 * topClear;
    float dens = smoothstep(0.56, 0.86, d * 0.6 + mass * 0.45);
    vec2 toL = uLight - p;
    vec2 L = normalize(toL + 1e-4);
    float d2 = cloud(cp + L * 0.05);
    float rim = clamp((d - d2) * 5.0 + 0.35, 0.0, 1.0);
    float near = exp(-dot(toL * vec2(0.8, 1.0), toL * vec2(0.8, 1.0)) * 2.2) * uGlow;
    return dens * (0.06 + 0.26 * rim + 0.4 * near * rim) + near * 0.03;
  }
  // quanto o rastro do cursor "mexeu" neste ponto agora
  float stir(vec2 p) {
    float s = 0.0;
    for (int i = 0; i < ${TRAIL}; i++) {
      vec4 t = uTrail[i];
      if (t.w <= 0.0) continue;
      vec2 d = p - t.xy;
      float life = 1.0 - clamp(t.z / ${TRAIL_LIFE.toFixed(2)}, 0.0, 1.0);
      s += t.w * life * exp(-dot(d, d) / 0.0035);
    }
    return clamp(s, 0.0, 1.0);
  }
`

const uniforms = () => ({
  uRes: { value: new Vector2(1, 1) },
  uTime: { value: 0 },
  uMouse: { value: new Vector2(0, 0) },
  uLight: { value: new Vector2(0, 0) },
  uGlow: { value: 1 },
  uOpacity: { value: 0 },
  uDot: { value: 2 },
  uPx: { value: 1 },
  uTrail: { value: Array.from({ length: TRAIL }, () => new Vector4(0, 0, 99, 0)) },
})

export function skyMaterial(octaves = 6) {
  return new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    defines: { OCTAVES: octaves },
    uniforms: uniforms(),
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position.xy, 0.9999, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uOpacity;
      uniform float uDot;
      ${COMMON}
      void main() {
        vec2 uv = gl_FragCoord.xy / uRes;
        float asp = uRes.x / uRes.y;
        vec2 p = vec2((uv.x - 0.5) * asp, uv.y - 0.5);
        float lum = skyLum(p, asp);
        // o rastro do cursor "levanta" os grãos: a nuvem perde pontilhado ali e se recompõe
        lum *= 1.0 - 0.55 * stir(p);

        vec2 cell = floor(gl_FragCoord.xy / uDot);
        float dots = step(hash(cell), (lum - 0.08) * 2.6);
        float outL = mix(lum, max(lum * 0.7, dots * 0.5), 0.35);
        vec3 col = vec3(0.0196) + vec3(0.96, 0.95, 0.93) * outL;
        // o pós-processamento converte para sRGB no final: devolvemos em linear
        gl_FragColor = vec4(pow(col, vec3(2.2)), uOpacity);
      }
    `,
  })
}

/** grãos de areia: pontos espalhados pela tela, só aparecem onde o cursor passou sobre nuvem */
export function sandGeometry(count: number) {
  const g = new BufferGeometry()
  const pos = new Float32Array(count * 3)
  const rnd = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = Math.random()
    pos[i * 3 + 1] = Math.random()
    rnd[i * 2] = Math.random()
    rnd[i * 2 + 1] = Math.random()
  }
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('aRnd', new BufferAttribute(rnd, 2))
  return g
}

export function sandMaterial(octaves = 6) {
  return new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    defines: { OCTAVES: Math.max(3, octaves - 2) },
    uniforms: uniforms(),
    vertexShader: /* glsl */ `
      attribute vec2 aRnd;
      uniform float uOpacity;
      uniform float uPx;
      varying float vA;
      ${COMMON}
      void main() {
        float asp = uRes.x / uRes.y;
        vec2 p0 = vec2((position.x - 0.5) * asp, position.y - 0.5);

        // cada ponto do rastro empurra os grãos próximos: saem, se espalham e caem
        vec2 disp = vec2(0.0);
        float a = 0.0;
        for (int i = 0; i < ${TRAIL}; i++) {
          vec4 t = uTrail[i];
          if (t.w <= 0.0) continue;
          vec2 d = p0 - t.xy;
          float w = t.w * exp(-dot(d, d) / 0.003);
          if (w < 0.002) continue;
          float age = t.z;
          float k = age / ${TRAIL_LIFE.toFixed(2)};
          vec2 dir = normalize(d + (aRnd - 0.5) * 0.02);
          float out1 = 1.0 - exp(-age * 3.5); // arrancada rápida que desacelera
          disp += w * (dir * (0.025 + 0.06 * aRnd.x) * out1
                     + vec2((aRnd.y - 0.5) * 0.04, -0.05 * age * age)); // espalha e cai
          a += w * (1.0 - smoothstep(0.35, 1.0, k));
        }

        // só existe grão onde há nuvem iluminada
        float lum = a > 0.01 ? skyLum(p0, asp) : 0.0;
        vA = clamp(a, 0.0, 1.0) * smoothstep(0.05, 0.25, lum) * uOpacity * (0.5 + 0.5 * aRnd.y);

        vec2 p = p0 + disp;
        gl_Position = vec4(p.x / asp * 2.0, p.y * 2.0, 0.9998, 1.0);
        gl_PointSize = vA > 0.003 ? (1.0 + aRnd.x * 1.4) * uPx : 0.0;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying float vA;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r = 1.0 - smoothstep(0.3, 0.5, length(c));
        gl_FragColor = vec4(vec3(0.95, 0.94, 0.91) * vA * r, 1.0); // aditivo: soma luz
      }
    `,
  })
}
