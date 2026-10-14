import {resolvePhysicsEngine,type PhysicsEngineVersion} from '@/lib/physics/engine-version';
export default function EngineBadge({engine}:{engine?:PhysicsEngineVersion}){
 const version=resolvePhysicsEngine(engine);
 return <span className="scores-engine-badge">{version==='ms-1991'?'MS 1991':version==='bb-1991'?'BB 1991':'MS 1990'}</span>;
}
