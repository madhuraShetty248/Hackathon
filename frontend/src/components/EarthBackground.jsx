import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture, Stars } from '@react-three/drei'
import * as THREE from 'three'

const EARTH_TEXTURE = 'https://cdn.apewebapps.com/threejs/160/examples/textures/planets/earth_atmos_2048.jpg'

function RevolvingEarth() {
  const meshRef = useRef(null)
  const texture = useTexture(EARTH_TEXTURE)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.15
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -3]} scale={2.2}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        metalness={0.1}
        roughness={0.8}
        emissive={new THREE.Color(0x001a33)}
      />
    </mesh>
  )
}

function GridBack() {
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(30, 50, 0x2a4a6e, 0x1a2d44)
    g.material.transparent = true
    g.material.opacity = 0.12
    g.rotation.x = -Math.PI / 2
    g.position.z = -5
    return g
  }, [])
  return <primitive object={grid} />
}

function EarthScene() {
  return (
    <>
      <Stars radius={80} depth={60} count={4000} factor={4} saturation={0.6} fade speed={0.5} />
      <RevolvingEarth />
      <GridBack />
      <ambientLight intensity={0.25} />
      <directionalLight position={[8, 5, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, 2]} intensity={0.3} />
    </>
  )
}

export default function EarthBackground() {
  return (
    <div className="earth-bg-canvas">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050810']} />
        <Suspense fallback={null}>
          <EarthScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
