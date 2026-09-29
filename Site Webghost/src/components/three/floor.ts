import { ShaderMaterial, Vector2 } from 'three'

/**
 * Chão de estúdio: piso escuro e granulado, uma faixa de luz suave ao fundo
 * que se apaga no preto (como um refletor rasante) e um reflexo discreto da
 * luz do triângulo logo abaixo dele. Tudo calculado no shader — sem textura, sem foto.
 */
export function floorMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uOpacity: { value: 0 },
      uGlow: { value: 1 }, // brilho atual da peça
      uTri: { value: new Vector2(0, 0) }, // posição da peça sobre o chão (x, z local)
      uPool: { value: new Vector2(0, -3.3) }, // centro da faixa de luz
    },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() {
        vP = position.xy; // plano no espaço local (x, -z depois da rotação)
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vP;
      uniform float uOpacity;
      uniform float uGlow;
      uniform vec2 uTri;
      uniform vec2 uPool;

      float hash(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
        // coordenadas do chão: x para os lados, z para o fundo (negativo = longe)
        vec2 p = vec2(vP.x, -vP.y);

        // faixa de luz: elipse larga e rasa, como um refletor varrendo o piso
        vec2 q = vec2((p.x - uPool.x) / 6.2, (p.y - uPool.y) / 1.3);
        float pool = exp(-dot(q, q) * 1.7);

        // a luz da peça batendo no chão logo abaixo dela
        vec2 r = vec2((p.x - uTri.x) / 1.5, (p.y - uTri.y) / 1.1);
        float tri = exp(-dot(r, r) * 2.2) * 0.35 * uGlow;

        // grão do piso: fino + manchas largas (concreto/areia escura)
        float grain = noise(p * 60.0) * 0.45 + noise(p * 17.0) * 0.35 + noise(p * 2.3) * 0.5;
        float light = (pool * 0.3 + tri) * (0.55 + 0.55 * grain);

        // a frente escurece bastante (como na foto) e o fundo se dissolve no céu —
        // por transparência, para não formar uma linha dura no horizonte
        float front = 0.12 + 0.88 * smoothstep(1.6, -2.8, p.y);
        float far = smoothstep(-19.0, -8.5, p.y);

        vec3 base = vec3(0.016) * (0.7 + 0.6 * grain);
        vec3 col = (base + vec3(0.95, 0.94, 0.92) * light) * front;
        gl_FragColor = vec4(col, uOpacity * far);
      }
    `,
  })
}
