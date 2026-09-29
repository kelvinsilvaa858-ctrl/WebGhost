import { ExtrudeGeometry, Path, Shape, Vector2 } from 'three'

/** vértices de um triângulo equilátero centrado no baricentro (ponta para cima) */
const tri = (radius: number, flip = false) =>
  [0, 1, 2].map((k) => {
    const a = (flip ? -Math.PI / 2 : Math.PI / 2) + (k * Math.PI * 2) / 3
    return new Vector2(Math.cos(a) * radius, Math.sin(a) * radius)
  })

/**
 * Moldura triangular vazada. O vão é centralizado na origem para a câmera
 * atravessar a peça na transição da hero.
 */
export function triangleFrame(outer: number, inner: number, depth: number) {
  const shape = new Shape(tri(outer))
  shape.holes.push(new Path(tri(inner).reverse()))
  const g = new ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 2, curveSegments: 1,
  })
  g.translate(0, 0, -depth / 2)
  return g
}

/** triângulo sólido invertido — o núcleo que flutua dentro do vão */
export function triangleSolid(radius: number, depth: number) {
  const g = new ExtrudeGeometry(new Shape(tri(radius, true)), {
    depth, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2, curveSegments: 1,
  })
  g.translate(0, 0, -depth / 2)
  return g
}
