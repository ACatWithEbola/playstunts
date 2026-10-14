"""Reconcile live structural audit evidence, without claiming race acceptance."""
import argparse, json, subprocess, sys
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('legacy',type=Path)
p.add_argument('modern',type=Path)
p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args()
root=Path(__file__).resolve().parent
def run(name,*args):
 return json.loads(subprocess.check_output([sys.executable,str(root/name),*map(str,args),'--libraries',str(a.libraries)],text=True))
inventory=run('audit_ms91_chassis_calls.py',a.modern)
structure=run('audit_original_chassis_structure.py',a.legacy,a.modern)
selector=run('audit_ms91_surface_selection_calls.py',a.modern,'--legacy',a.legacy)
contact=run('audit_original_car_contact_scope.py',a.legacy,a.modern)
audio=run('audit_original_chassis_audio_boundary.py',a.legacy,a.modern)
assert selector['selectorDifferenceInventory']['differenceClassificationComplete']
assert structure['wallArithmeticHelpers']['changedGroupCoverage']['remaining']==0
evidence={}
for row in structure['upstreamWallHelperMappings']:
 assert row['bodyEquivalenceProven']
 evidence[row['modernTarget']]='complete upstream helper comparison'
assert structure['upstreamWallHelperMappings'][4]['allIdentifiedTransitiveCodeAndLookupDependenciesEquivalent']
assert structure['upstreamWallHelperMappings'][3]['atanDependencyProven']
for target in ['0x20e5, 0x2a','0x20e5, 0x3cba','0x20e5, 0x3d08','0x2df4, 6']:
 evidence[target]='complete upstream transitive math comparison and lookup banks'
for row in structure['wallArithmeticHelpers']['helpers']:
 assert row['byteIdentical'] and not row['callsOrInterrupts']
evidence['0x1f07, 0x1bf8']='complete byte-identical signed division body'
evidence['0x1f07, 0x1c94']='complete byte-identical multiplication body'
assert structure['wallArithmeticHelpers']['suspensionHelperClassification']['transitiveCalls']==0
evidence['0xab00']='complete suspension body classification; runtime corpus separate'
paired={row['name']:row for row in selector['pairedHelpers']}
for target,name in {
 '0x1f07, 0x1d62':'unsigned-long-divide',
 '0x20e5, 0x1620':'signed-fixed-point-product',
 '0x20e5, 0x404e':'matrix-transpose',
 '0x74e6':'far-matrix-copy-transform-wrapper',
 '0xb178':'collision-sound-flag-dispatch',
 '0xb50e':'complete-car-overlap',
 '0xbbd6':'plane-movement',
 '0xbd68':'plane-distance',
 '0x105c, 0x194c':'landmark-boundary-builder',
}.items():
 assert paired[name]['bytes']>0
 assert any(value is True for key,value in paired[name].items() if key=='byteIdentical' or key.startswith('equivalentUnder')),(name,'missing body comparison')
 evidence[target]='complete paired body: '+name
evidence['0x105c, 8']='complete selector shape, operand, dispatch and branch reconciliation'
assert selector['crashHandlerScope']['completeThroughNextFunction']
evidence['0xba32']='complete crash body; particle and audio callbacks explicitly separate'
assert selector['particleGeneratorScope']
evidence['0xbe6e']='bounded complete particle generator and RNG classification'
assert contact['sourceUnchanged'] and all(row['branchesInternal'] and row['returnPaths']==2 for row in contact['bodies'])
evidence['0xa990']='complete contact body boundaries, math dependencies and pinned changed arithmetic blocks; runtime corpus separate'
rows=[]
for row in inventory['dependencyRegistry']:
 target=row['target']
 rows.append({**row,'acceptanceStatus':'structural evidence linked' if target in evidence else 'pending evidence link',
 'evidence':evidence.get(target)})
assert set(evidence)<=set(row['target'] for row in rows)
assert len(evidence)==len(rows)==25
assert audio['effectAllocatorScope']['completeBytePartitionCompared']
assert audio['sharedTimerInitialization']['completeInitializerClassification']
assert all(not row['legacyComparisonPending'] for row in audio['deeperAudioScopes'])
assert audio['engineVoiceStopScope']['transitiveCalls']==0
assert audio['pointerLoadScope']['transitiveCalls']==0
print(json.dumps({'dependencies':len(rows),'structuralEvidenceLinked':len(evidence),
 'pending':[row for row in rows if row['evidence'] is None],
 'registry':rows,'audioBoundary':audio,'helperDifferenceClassificationComplete':True,'wholeItemAccepted':False,
 'remainingScope':'original complete chassis branch acceptance and full-race captures remain engine items23/25; selected sound-driver export30 and audible output remain sound category gates'},indent=2))
