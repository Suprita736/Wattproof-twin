
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

const MINT = "#B9F3D2";
const GREEN = "#2E8B68";
const FOREST = "#142D27";

function BuildingModel() {
  const building = useRef(null);
  const energyRing = useRef(null);
  const windowRefs = useRef([]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (building.current) {
      // Gentle rotation and cursor-responsive tilt
      building.current.rotation.y += delta * 0.08;

      building.current.rotation.x = THREE.MathUtils.damp(
        building.current.rotation.x,
        -state.pointer.y * 0.12,
        3,
        delta
      );

      building.current.rotation.z = THREE.MathUtils.damp(
        building.current.rotation.z,
        state.pointer.x * 0.07,
        3,
        delta
      );
    }

    if (energyRing.current) {
      energyRing.current.rotation.z += delta * 0.12;
      energyRing.current.rotation.x =
        0.9 + Math.sin(time * 0.3) * 0.08;
    }

    // Each window pulses at a slightly different time
    windowRefs.current.forEach((window, index) => {
      if (window?.material) {
        window.material.emissiveIntensity =
          0.8 + (Math.sin(time * 1.8 + index * 0.8) + 1) * 0.55;
      }
    });
  });

  const floors = [0, 1, 2, 3];

  return (
    <group>
      <Float speed={1.2} rotationIntensity={0.04} floatIntensity={0.22}>
        <group ref={building} position={[0, -0.5, 0]}>
          {/* Foundation */}
          <mesh position={[0, -0.12, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.5, 0.24, 2.5]} />
            <meshStandardMaterial
              color={FOREST}
              roughness={0.38}
            />
          </mesh>

          {/* Four illuminated storeys */}
          {floors.map((floor) => (
            <group key={floor} position={[0, floor * 0.82, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[2.8, 0.72, 1.9]} />
                <meshStandardMaterial
                  color={floor % 2 === 0 ? "#24483D" : FOREST}
                  roughness={0.3}
                  metalness={0.18}
                />
              </mesh>

              {/* Front windows */}
              {[-0.85, 0, 0.85].map((x, index) => (
                <mesh
                  key={`front-${floor}-${index}`}
                  ref={(node) => {
                    windowRefs.current[floor * 5 + index] = node;
                  }}
                  position={[x, 0, 0.966]}
                >
                  <boxGeometry args={[0.53, 0.42, 0.025]} />
                  <meshStandardMaterial
                    color={MINT}
                    emissive={GREEN}
                    emissiveIntensity={1}
                    roughness={0.2}
                  />
                </mesh>
              ))}

              {/* Side windows */}
              {[-0.45, 0.45].map((z, index) => (
                <mesh
                  key={`side-${floor}-${index}`}
                  ref={(node) => {
                    windowRefs.current[floor * 5 + 3 + index] = node;
                  }}
                  position={[1.412, 0, z]}
                  rotation={[0, Math.PI / 2, 0]}
                >
                  <boxGeometry args={[0.42, 0.42, 0.025]} />
                  <meshStandardMaterial
                    color={MINT}
                    emissive={GREEN}
                    emissiveIntensity={1}
                    roughness={0.2}
                  />
                </mesh>
              ))}

              {/* Floor separator */}
              <mesh position={[0, -0.38, 0]}>
                <boxGeometry args={[2.95, 0.055, 2.05]} />
                <meshStandardMaterial
                  color={MINT}
                  emissive={GREEN}
                  emissiveIntensity={0.4}
                />
              </mesh>
            </group>
          ))}

          {/* Rooftop equipment */}
          <mesh position={[0, 3.42, 0]} castShadow>
            <boxGeometry args={[1.2, 0.15, 0.8]} />
            <meshStandardMaterial
              color="#64748B"
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>

          <mesh position={[0, 3.65, 0]}>
            <boxGeometry args={[0.85, 0.3, 0.55]} />
            <meshStandardMaterial
              color={MINT}
              emissive={GREEN}
              emissiveIntensity={1.2}
            />
          </mesh>

          <mesh
            position={[0.75, 3.65, 0]}
            rotation={[0, 0, -0.2]}
          >
            <cylinderGeometry args={[0.025, 0.04, 0.7, 8]} />
            <meshStandardMaterial
              color={MINT}
              emissive={GREEN}
              emissiveIntensity={1}
            />
          </mesh>
        </group>

        {/* Orbiting energy ring */}
        <group ref={energyRing} rotation={[0.9, 0.2, 0.2]}>
          <mesh>
            <torusGeometry args={[2.35, 0.012, 8, 120]} />
            <meshBasicMaterial color={MINT} transparent opacity={0.75} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

function TravellingParticle({ index, total }) {
  const particle = useRef(null);

  useFrame((state) => {
    if (!particle.current) return;

    const time = state.clock.elapsedTime;
    const angle = time * (0.35 + (index % 3) * 0.08)
      + (index / total) * Math.PI * 2;

    const radius = 2.35 + (index % 3) * 0.18;

    particle.current.position.set(
      Math.cos(angle) * radius,
      Math.sin(time * 0.65 + index) * 1.65,
      Math.sin(angle) * radius * 0.65
    );

    const pulse = 0.75 + (Math.sin(time * 3 + index) + 1) * 0.3;
    particle.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={particle}>
      <sphereGeometry
        args={[index % 4 === 0 ? 0.045 : 0.025, 10, 10]}
      />
      <meshBasicMaterial
        color={index % 4 === 0 ? "#FFFFFF" : MINT}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

function EnergyParticles() {
  const total = 24;

  return (
    <group>
      {Array.from({ length: total }, (_, index) => (
        <TravellingParticle
          key={index}
          index={index}
          total={total}
        />
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={1.3} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={2}
        castShadow
      />
      <pointLight
        position={[-4, 2, 3]}
        color={GREEN}
        intensity={25}
        distance={10}
      />

      <BuildingModel />
      <EnergyParticles />

      <ContactShadows
        position={[0, -1.15, 0]}
        opacity={0.35}
        scale={8}
        blur={2.5}
        far={4}
      />

      <Environment preset="city" />
    </>
  );
}

export default function Building3D() {
  return (
    <div className="building-3d-scene">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [5.5, 4.2, 7], fov: 36 }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <Scene />
      </Canvas>

      {/* Floating energy indicators */}
      
        <div>
          <span className="building-badge-label">ENERGY MONITOR</span>
          <strong>Live twin preview</strong>
        </div>
        <span className="building-badge-icon">↗</span>
      

      
        <div>
          <span className="building-badge-label">SAVINGS POTENTIAL</span>
          <strong>Test a smarter scenario</strong>
        </div>
      
    </div>
  );
}
