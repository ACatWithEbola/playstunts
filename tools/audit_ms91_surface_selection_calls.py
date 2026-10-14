"""Bounded dependency inventory; not semantic or runtime acceptance."""
import argparse, hashlib, json, sys, struct, re, difflib
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('image',type=Path)
p.add_argument('--libraries',type=Path,required=True)
p.add_argument('--legacy',type=Path)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
b=a.image.read_bytes();base=0x105c0;start=8;end=0x194c
assert b[base+start:base+start+6]==bytes.fromhex('558bec83ec40')
assert b[base+end-6:base+end]==bytes.fromhex('5e5f8be55dcb')
tables=[(0x15b8,0x164e),(0x16e6,0x16fe)]
regions=[(start,0x15b8),(0x164e,0x16e6),(0x16fe,end)]
decoder=Cs(CS_ARCH_X86,CS_MODE_16);decoder.detail=True;ops=[]
for lo,hi in regions:
 part=list(decoder.disasm(b[base+lo:base+hi],lo))
 assert sum(i.size for i in part)==hi-lo
 ops.extend(part)
boundaries={i.address for i in ops};calls={};branches=0;indirect=[];unaligned=[]
for i in ops:
 if i.mnemonic in ('call','lcall'):
  calls.setdefault(i.mnemonic+' '+i.op_str,[]).append(hex(i.address))
 if i.mnemonic.startswith(('j','loop')):
  if not i.op_str.startswith('0x'):
   indirect.append({'at':hex(i.address),'operand':i.op_str});continue
  target=int(i.op_str,16)
  if target not in boundaries:
   unaligned.append({'at':hex(i.address),'target':hex(target)});continue
  branches+=1
assert a.image.read_bytes()==b
table_results=[]
for lo,hi in tables:
 targets=struct.unpack('<'+'H'*((hi-lo)//2),b[base+lo:base+hi])
 assert all(t in boundaries for t in targets)
 table_results.append({'start':hex(lo),'entries':len(targets),'allTargetsAligned':True})
assert not unaligned
crash_ops=list(decoder.disasm(b[0xba32:0xbbd6],0xba32))
assert sum(i.size for i in crash_ops)==420
crash_bounds={i.address for i in crash_ops};crash_calls=[]
for i in crash_ops:
 if i.mnemonic.startswith('j'):assert int(i.op_str,16) in crash_bounds
 if i.mnemonic in ('call','lcall'):crash_calls.append((i.mnemonic,i.op_str))
assert crash_calls==[('call','0xbe6e'),('lcall','0x18fd, 0x74c'),('lcall','0x18fd, 0x74c')]
crash_scope={'bytes':420,'instructions':len(crash_ops),'completeThroughNextFunction':True,'branchesInternal':True,'particleCallback':'0xbe6e','audioCallback':'0x18fd, 0x74c','callbackSemanticsSeparate':True,'sha256':hashlib.sha256(b[0xba32:0xbbd6]).hexdigest()}
if a.legacy:
 legacy_image=a.legacy.read_bytes()
 legacy_crash_ops=list(decoder.disasm(legacy_image[0xb3b2:0xb55c],0xb3b2))
 assert sum(i.size for i in legacy_crash_ops)==426
 for old_at,new_at in [(0xb475,0xbaf0),(0xb4ea,0xbb65)]:
  old_timer=[i for i in legacy_crash_ops if i.address==old_at];assert [(i.mnemonic,i.op_str) for i in old_timer]==[('mov','word ptr [0x907c], 0x50')]
  new_timer=[i for i in crash_ops if new_at<=i.address<new_at+10]
  assert [(i.mnemonic,i.op_str) for i in new_timer]==[('mov','ax, word ptr [0x96dc]'),('shl','ax, 1'),('shl','ax, 1'),('mov','word ptr [0x92da], ax')]
 assert [(i.mnemonic,i.op_str) for i in legacy_crash_ops if i.address==0xb510]==[('mov','word ptr [0x907c], 0x14')]
 assert [(i.mnemonic,i.op_str) for i in crash_ops if i.address==0xbb8e]==[('mov','ax, word ptr [0x96dc]')]
 crash_scope['versionedTimerRules']={'legacyCrashTicks':80,'modernCrashTicks':'4*framesPerSecond','legacyFinishTicks':20,'modernFinishTicks':'framesPerSecond','runtimeCorpusCases':2000}
particle_ops=list(decoder.disasm(b[0xbe6e:0xbfd0],0xbe6e));assert sum(i.size for i in particle_ops)==354
particle_bounds={i.address for i in particle_ops};particle_calls=[]
for i in particle_ops:
 if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in particle_bounds
 if i.mnemonic in ('call','lcall'):particle_calls.append(i.op_str)
assert set(particle_calls)=={'0xc1e, 0xbf','0x1f07, 0x1c94','0x1f07, 0x1bf8'}
rng_ops=list(decoder.disasm(b[0xc29f:0xc2ed],0xbf));assert sum(i.size for i in rng_ops)==78
rng_bounds={i.address for i in rng_ops}
for i in rng_ops:
 assert i.mnemonic not in ('call','lcall','int')
 if i.mnemonic.startswith('j'):assert int(i.op_str,16) in rng_bounds
particle_scope={'bytes':354,'instructions':len(particle_ops),'branchesInternal':True,'uniqueCalls':sorted(set(particle_calls)),'randomHelperBytes':78,'randomHelperTransitiveCalls':0,'randomHelperBranchesInternal':True,'runtimeAndRenderingAcceptanceSeparate':True}
if a.legacy:
 legacy_particle_ops=list(decoder.disasm(a.legacy.read_bytes()[0xb7f4:0xb97c],0xb7f4));assert sum(i.size for i in legacy_particle_ops)==392
 assert [(i.mnemonic,i.op_str) for i in particle_ops if 0xbf93<=i.address<0xbf9b]==[('mov','cx, ax'),('shl','ax, 1'),('add','ax, cx'),('shl','ax, 1')]
 assert [(i.mnemonic,i.op_str) for i in particle_ops if 0xbf9d<=i.address<0xbfa1]==[('mov','cl, 2'),('sar','di, cl')]
 assert [(i.mnemonic,i.op_str) for i in particle_ops if 0xbfb4<=i.address<0xbfba]==[('sar','ax, 1'),('sar','ax, 1'),('mov','word ptr [bx - 0x6aa2], ax')]
 particle_scope['versionedGenerationRules']={'randomContribution':'6*random arithmetic quarter shift','verticalVelocity':'wrapped signed product arithmetic quarter shift','legacyRule':'signed magnitude truncation with wrapped intermediate','originalNativeCases':400}
geometry_scopes=[]
for name,start,end,allowed in [('plane-movement',0xbbd6,0xbd68,{'0x20e5, 0x3eca','0x20e5, 0x404e','0x20e5, 0x2a','0x2df4, 0x5c','0x74e6'}),('plane-distance',0xbd68,0xbdf4,{'0xbdf4'}),('normal-product',0xbdf4,0xbe6e,{'0x1f07, 0x1c94','0x1f07, 0x1bf8'})]:
 decoded=list(decoder.disasm(b[start:end],start));assert sum(i.size for i in decoded)==end-start
 bounds={i.address for i in decoded};targets=set()
 for i in decoded:
  if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in bounds
  if i.mnemonic in ('call','lcall'):targets.add(i.op_str)
 assert targets==allowed
 geometry_scopes.append({'name':name,'bytes':end-start,'instructions':len(decoded),'branchesInternal':True,'uniqueCalls':sorted(targets),'sha256':hashlib.sha256(b[start:end]).hexdigest()})
paired=[];legacy_selector_scope=None;selector_diff=None
if a.legacy:
 old=a.legacy.read_bytes()
 old_base=0xfcc0;old_start=0x8de;old_end=0x246e
 assert old[old_base+old_start:old_base+old_start+6]==bytes.fromhex('558bec83ec3a')
 assert old[old_base+old_end-6:old_base+old_end]==bytes.fromhex('5e5f8be55dcb')
 old_ops=[]
 for lo,hi in [(old_start,0x20da),(0x2170,0x2208),(0x2220,old_end)]:
  part=list(decoder.disasm(old[old_base+lo:old_base+hi],lo));assert sum(i.size for i in part)==hi-lo
  old_ops.extend(part)
 old_bounds={i.address for i in old_ops};old_direct=0
 for i in old_ops:
  if i.mnemonic.startswith(('j','loop')) and i.op_str.startswith('0x'):
   assert int(i.op_str,16) in old_bounds;old_direct+=1
 old_tables=[]
 for lo,hi in [(0x20da,0x2170),(0x2208,0x2220)]:
  targets=struct.unpack('<'+'H'*((hi-lo)//2),old[old_base+lo:old_base+hi]);assert all(t in old_bounds for t in targets)
  old_tables.append({'start':hex(lo),'entries':len(targets),'allTargetsAligned':True})
 legacy_selector_scope={'bytes':old_end-old_start,'codeInstructions':len(old_ops),'directBranchesAligned':old_direct,'jumpTables':old_tables,'pairedBehaviorComparisonStillRequired':True}
 def selector_key(i):
  # Candidate alignment only. Raw operands remain visible; numeric replacement
  # must never be used as evidence that constants or thresholds are unchanged.
  return (i.mnemonic,re.sub(r'0x[0-9a-f]+','ADDR',i.op_str))
 groups=[];aligned_numeric=[];instruction_map={}
 for tag,x,y,z,w in difflib.SequenceMatcher(None,list(map(selector_key,old_ops)),list(map(selector_key,ops)),autojunk=False).get_opcodes():
  if tag=='equal':
   for before,after in zip(old_ops[x:y],ops[z:w]):
    instruction_map[before.address]=after.address
    if before.op_str!=after.op_str:aligned_numeric.append({'oldAt':hex(before.address),'newAt':hex(after.address),'old':before.mnemonic+' '+before.op_str,'new':after.mnemonic+' '+after.op_str})
  else:groups.append({'kind':tag,'legacy':[{'at':hex(i.address),'op':i.mnemonic+' '+i.op_str} for i in old_ops[x:y]],'modern':[{'at':hex(i.address),'op':i.mnemonic+' '+i.op_str} for i in ops[z:w]],'modernAnchor':hex(ops[z].address) if z<len(ops) else None,'classification':'pending'})
 selector_diff={'instructionShapeGroups':groups,'alignedOperandDifferences':aligned_numeric,'normalizationIsNotSemanticEquivalence':True}
 old_dispatch=struct.unpack('<75H',old[old_base+0x20da:old_base+0x2170])
 new_dispatch=struct.unpack('<75H',b[base+0x15b8:base+0x164e])
 dispatch_pairs={}
 for physics,(old_target,new_target) in enumerate(zip(old_dispatch,new_dispatch)):
  dispatch_pairs.setdefault((old_target,new_target),[]).append(physics)
 selector_diff['physicsDispatchPairs']=[{'physicsTypes':types,'legacyTarget':hex(before),'modernTarget':hex(after)} for (before,after),types in dispatch_pairs.items()]
 selector_diff['aliasChanges']=[{'types':[x,y],'legacyShared':old_dispatch[x]==old_dispatch[y],'modernShared':new_dispatch[x]==new_dispatch[y]} for x in range(75) for y in range(x+1,75) if (old_dispatch[x]==old_dispatch[y])!=(new_dispatch[x]==new_dispatch[y])]
 dispatch_fields={'0x9834':'0x9ace','0x97b7':'0x9a4f','0x8d3c':'0x8f9a','0x94fe':'0x9798','0x9404':'0x9694','0x945e':'0x96f8'}
 entry_map={before:after for before,after in dispatch_pairs}
 exact_dispatch=[]
 old_entries=sorted(set(old_dispatch));new_entries=sorted(set(new_dispatch))
 for (before,after),types in dispatch_pairs.items():
  old_limit=next((v for v in old_entries if v>before),0x20da)
  new_limit=next((v for v in new_entries if v>after),0x15b8)
  left=[i for i in old_ops if before<=i.address<old_limit and i.mnemonic!='nop']
  right=[i for i in ops if after<=i.address<new_limit and i.mnemonic!='nop']
  if len(left)!=len(right) or not left:continue
  local_map={x.address:y.address for x,y in zip(left,right)}
  local_map.update({0x2170:0x164e,0xd0a:0x44d,0xd0f:0x452})
  matched=True
  for x,y in zip(left,right):
   operand=x.op_str
   if x.mnemonic.startswith(('j','loop')) and operand.startswith('0x'):
    target=int(operand,16);mapped=local_map.get(target,entry_map.get(target))
    if mapped is None:matched=False;break
    operand=hex(mapped)
   else:
    operand=re.sub(r'0x[0-9a-f]+',lambda m:dispatch_fields.get(m[0],m[0]),operand)
    if x.mnemonic=='lcall':
     verified_math={'0x209e, 0x1690':'0x20e5, 0x1692','0x209e, 0x3b34':'0x20e5, 0x3cba','0x209e, 0x3b82':'0x20e5, 0x3d08','0x209e, 0x161e':'0x20e5, 0x1620','0x1ec1, 0x1c8c':'0x1f07, 0x1c94','0x1ec1, 0x1bf0':'0x1f07, 0x1bf8','0x209e, 0x28':'0x20e5, 0x2a'}
     operand=verified_math.get(operand,operand)
   if (x.mnemonic,operand)!=(y.mnemonic,y.op_str):matched=False;break
  if matched:exact_dispatch.append({'physicsTypes':types,'instructions':len(left),'legacyStart':hex(before),'modernStart':hex(after),'classification':'exact-block-under-explicit-fields-and-verified-dispatch-targets'})
 selector_diff['exactDispatchBlocks']=exact_dispatch
 start_line_rows=[]
 for index,(image,segment,start) in enumerate([(old,old_base,0xcd0),(b,base,0x420)]):
  decoded=list(decoder.disasm(image[segment+start:segment+start+41],0));assert sum(i.size for i in decoded)==41
  rows=[]
  for i in decoded:
   operand=i.op_str
   if not index:operand=operand.replace('0x9307','0x9595').replace('0x9834','0x9ace')
   rows.append((i.address,i.mnemonic,operand))
  start_line_rows.append(rows)
 assert start_line_rows[0]==start_line_rows[1]
 selector_diff['classifiedDispatchBranches']=[{'physics':0,'bytes':41,'classification':'unchanged-start-line-special-planes-under-explicit-mode-and-plane-global-relocations','thresholds':[-380,-300],'planeGroups':[131,132]}]
 def exact_ops(lo,hi):return [(i.mnemonic,i.op_str) for i in ops if lo<=i.address<hi]
 assert exact_ops(0x36f,0x37c)==[('cmp','word ptr [bp - 0x2c], 0'),('jge','0x3f2'),('mov','ax, word ptr [bp - 0x2c]'),('neg','ax'),('jmp','0x3f5')]
 assert exact_ops(0x3f2,0x3f8)==[('mov','ax, word ptr [bp - 0x2c]'),('mov','word ptr [bp - 0x32], ax')]
 assert exact_ops(0x449,0x45b)==[('cmp','word ptr [bp - 0x32], 0x78'),('jl','0x452'),('jmp','0x164e'),('mov','al, byte ptr [bp - 0x12]'),('mov','byte ptr [0x9a4f], al'),('jmp','0x164e')]
 assert exact_ops(0x45c,0x468)==[('cmp','word ptr [bp - 0x32], 0x78'),('jl','0x452'),('cmp','word ptr [bp - 0x2e], 0x78'),('jmp','0x44d')]
 selector_diff['classifiedDispatchBranches'].extend([{'physics':1,'classification':'hoisted-signed-absolute-X-test','threshold':120,'sharedSurfaceAndExitVerified':True},{'physics':12,'classification':'hoisted-signed-absolute-X-or-Z-test','threshold':120,'sharedSurfaceAndExitVerified':True}])
 radius_regions=[]
 for name,lo,hi,ns,ne in [('large-radius',0xd66,0xd8e,0x48c,0x4b2),('small-radius',0xda7,0xdce,0x4b8,0x4e0)]:
  left=[i for i in old_ops if lo<=i.address<hi and i.mnemonic!='nop'];right=[i for i in ops if ns<=i.address<ne and i.mnemonic!='nop'];assert len(left)==len(right)
  targets={x.address:y.address for x,y in zip(left,right)};targets.update({0x2170:0x164e,0xd0a:0x44d})
  for x,y in zip(left,right):
   operand=x.op_str
   if x.mnemonic.startswith('j'):operand=hex(targets[int(operand,16)])
   if x.mnemonic=='lcall':assert operand=='0x209e, 0x1690';operand='0x20e5, 0x1692'
   assert (x.mnemonic,operand)==(y.mnemonic,y.op_str)
  radius_regions.append({'name':name,'instructions':len(left),'exactUnderVerifiedHypotAndBranchMapping':True,'thresholdImmediatesUnchanged':True})
 selector_diff['classifiedSharedRadiusRegions']=radius_regions
 cached_abs_groups=0
 for group in groups:
  left=[r for r in group['legacy'] if r['op']!='nop '];right=[r for r in group['modern'] if r['op']!='nop ']
  if not left and not right:group['classification']='nop-only-padding';continue
  if len(left)!=7 or len(right)!=1:continue
  for source,cache in [('0x2c','0x32'),('0x28','0x2e')]:
   threshold=left[-1]['op'].removeprefix('cmp ax, ')
   expected=[f'cmp word ptr [bp - {source}], 0',f"jge {left[5]['at']}",f'mov ax, word ptr [bp - {source}]','neg ax',f"jmp {left[6]['at']}",f'mov ax, word ptr [bp - {source}]',f'cmp ax, {threshold}']
   if [r['op'] for r in left]==expected and right[0]['op']==f'cmp word ptr [bp - {cache}], {threshold}':
    group['classification']='hoisted-signed-absolute-coordinate-comparison';group['sourceLocal']=source;group['cachedLocal']=cache;group['unchangedThreshold']=threshold;cached_abs_groups+=1;break
 selector_diff['cachedAbsoluteGroupsClassified']=cached_abs_groups
 for lo,anchor,old_at in [(0xeda,0xef9,'0x18fa'),(0x1022,0x103a,'0x1a92')]:
  region=[i for i in ops if lo<=i.address<anchor];assert (region[0].mnemonic,region[0].op_str)==('mov','bx, word ptr [bp + 6]')
  for i in region[1:]:
   assert i.mnemonic not in ('call','lcall','int')
   assert not any(i.reg_name(r) in ('bx','bl','bh','bp') for r in i.regs_access()[1])
   assert not (i.mnemonic=='mov' and i.op_str.startswith('word ptr [bp + 6],'))
  for i in ops:
   if i.mnemonic.startswith(('j','loop')) and i.op_str.startswith('0x'):
    target=int(i.op_str,16)
    if lo<target<=anchor:assert lo<=i.address<anchor
  assert not any(lo<t<=anchor for t in new_dispatch)
  for group in groups:
   if group['classification']=='pending' and group['legacy']==[{'at':old_at,'op':'mov bx, word ptr [bp + 6]'}]:group['classification']='verified-retained-point-pointer-no-external-entry'
 assert [(i.mnemonic,i.op_str) for i in old_ops if 0x1a5d<=i.address<0x1a65]==[('cmp','ax, 0x82'),('jl','0x1a65'),('jmp','0x2170')]
 old_between=[i for i in old_ops if 0x1a65<=i.address<0x1a77]
 assert all(i.mnemonic not in ('call','lcall','int') and not (i.mnemonic=='mov' and i.op_str.startswith('word ptr [bp - 0x2c],')) for i in old_between)
 assert exact_ops(0x1018,0x1022)==[('cmp','word ptr [bp - 0x32], 0x96'),('jl','0x1022'),('jmp','0x164e')]
 assert exact_ops(0x1034,0x103a)==[('mov','al, byte ptr [bp - 0x12]'),('mov','byte ptr [0x9a4f], al')]
 for group in groups:
  if group['classification']=='pending' and group['legacy'] and group['legacy'][0]['at']=='0x1a77':group['classification']='removed-redundant-old-pipe-width-recheck-with-versioned-primary-width'
 old_curve_entry=[(i.mnemonic,i.op_str) for i in old_ops if 0xd8e<=i.address<0xda7 and i.mnemonic!='nop']
 assert old_curve_entry==[('cmp','word ptr [bp - 0x2c], 0'),('jge','0xd9c'),('mov','ax, word ptr [bp - 0x2c]'),('neg','ax'),('jmp','0xd9f'),('mov','ax, word ptr [bp - 0x2c]'),('cmp','ax, 0x78'),('jge','0xda7'),('jmp','0xd0f')]
 assert exact_ops(0x4b2,0x4b8)==[('cmp','word ptr [bp - 0x32], 0x78'),('jl','0x452')]
 for group in groups:
  if group['classification']=='pending' and group['legacy'] and group['legacy'][0]['at']=='0xd8d':group['classification']='verified-cached-absolute-X-curve-entry-with-equivalent-fallthrough'
 old_curve_jump=[i for i in old_ops if 0xdf6<=i.address<0xe00]
 new_curve_jump=[i for i in ops if 0x4f8<=i.address<0x4ff]
 assert len(old_curve_jump)==3 and len(new_curve_jump)==2
 assert (old_curve_jump[0].mnemonic,old_curve_jump[0].op_str)==(new_curve_jump[0].mnemonic,new_curve_jump[0].op_str)
 assert [(i.mnemonic,i.op_str) for i in old_curve_jump[1:]]==[('jge','0xe00'),('jmp','0xd66')]
 assert (new_curve_jump[1].mnemonic,new_curve_jump[1].op_str)==('jl','0x48c')
 for group in groups:
  if group['classification']=='pending' and group['legacy'] and group['legacy'][0]['at']=='0xdfb':group['classification']='equivalent-curve-conditional-jump-shortening'
 road_ops=[(i.mnemonic,i.op_str) for i in old_ops if 0xcf9<=i.address<0xd42 and i.mnemonic!='nop']
 assert road_ops==[('cmp','word ptr [bp - 0x2c], 0'),('jge','0xd04'),('mov','ax, word ptr [bp - 0x2c]'),('jmp','0xd37'),('mov','ax, word ptr [bp - 0x2c]'),('cmp','ax, 0x78'),('jl','0xd0f'),('jmp','0x2170'),('mov','al, byte ptr [bp - 0x12]'),('mov','byte ptr [0x97b7], al'),('jmp','0x2170'),('cmp','word ptr [bp - 0x2c], 0'),('jge','0xd26'),('mov','ax, word ptr [bp - 0x2c]'),('neg','ax'),('jmp','0xd29'),('mov','ax, word ptr [bp - 0x2c]'),('cmp','ax, 0x78'),('jl','0xd0f'),('cmp','word ptr [bp - 0x28], 0'),('jge','0xd3c'),('mov','ax, word ptr [bp - 0x28]'),('neg','ax'),('jmp','0xd07'),('mov','ax, word ptr [bp - 0x28]'),('jmp','0xd07')]
 for group in groups:
  if group['classification']!='pending' or not group['legacy']:continue
  if group['legacy'][0]['at'] in ('0xcf9','0xd18','0xd25'):
   assert all(0xcf9<=int(r['at'],16)<0xd42 for r in group['legacy'])
   assert all(0x449<=int(r['at'],16)<0x468 for r in group['modern'])
   group['classification']='verified-shared-straight-crossroads-absolute-coordinate-flow'
 old_rotation=[i for i in old_ops if 0xc5c<=i.address<0xcd0];new_rotation=[i for i in ops if 0x37e<=i.address<0x3f2];assert len(old_rotation)==len(new_rotation)==43
 rotation_map={x.address:y.address for x,y in zip(old_rotation,new_rotation)};rotation_map[0xc30]=0x357
 for x,y in zip(old_rotation,new_rotation):
  operand=x.op_str
  if x.mnemonic.startswith('j'):operand=hex(rotation_map[int(operand,16)])
  assert (x.mnemonic,operand)==(y.mnemonic,y.op_str)
 assert [(i.mnemonic,i.op_str) for i in old_ops if 0xc1e<=i.address<0xc26]==[('cmp','ax, 0x100'),('jne','0xc26'),('jmp','0xca8')]
 assert exact_ops(0x348,0x34d)==[('cmp','ax, 0x100'),('je','0x3ca')]
 for group in groups:
  if group['legacy']==[{'at':'0xc21','op':'jne 0xc26'},{'at':'0xc23','op':'jmp 0xca8'}] and group['modern']==[{'at':'0x34b','op':'je 0x3ca'}]:group['classification']='equivalent-rotation-conditional-jump-shortening'
 selector_diff['localRotationBlock']={'bytes':116,'instructions':43,'equivalentUnderExplicitBranchDestinations':True}
 assert old[0x32090+0x2e00:0x32090+0x2f28]==b[0x32a90+0x2e20:0x32a90+0x2f48]
 field_map={0x97b2:0x9a4a,0x97b4:0x9a4c,0x9f2c:0xa1c4,0x9f2e:0xa1c6,0x9f32:0xa1ca,0x9f34:0xa1cc,0xaecc:0xb164,0xaece:0xb166,0x7830:0x7a30,0x783e:0x7a3c,0x843e:0x863c,0x9307:0x9595,0x8d3c:0x8f9a,0x9404:0x9694,0x9456:0x96ec,0x945e:0x96f8,0x9468:0x9702,0x94fe:0x9798,0x97b6:0x9a4e,0x97b7:0x9a4f,0x97d2:0x9a6c,0x97d4:0x9a6e,0x9834:0x9ace,0xa802:0xaa9a,0x124:0x182,0x778e:0x798e,0x77d6:0x79d6,0x77d8:0x79d8,0x5854:0x55bc,0x57c2:0x552a,0x71ce:0x6f46,0x71d0:0x6f48,0x6afe:0x6864,0x6b00:0x6866,0x2023:0x20a9}
 operand_classified=0;operand_pending=[]
 for pair in aligned_numeric:
  before=pair['old'];after=pair['new']
  if before.startswith(('j','loop','call','lcall')):continue
  mapped=re.sub(r'\[([^\]]+)\]',lambda m:'['+re.sub(r'0x[0-9a-f]+',lambda v:hex(int(v[0],16)+6) if m[1].startswith('bp - ') and int(v[0],16)>=0x2e else hex(int(v[0],16)+0x20) if 0x2e00<=int(v[0],16)<0x2f28 else hex(field_map.get(int(v[0],16),int(v[0],16))),m[1])+']',before)
  if before=='add ax, 0x2018':mapped='add ax, 0x209e'
  if before=='sub sp, 0x3a':mapped='sub sp, 0x40'
  if mapped==after:operand_classified+=1
  else:operand_pending.append(pair)
 selector_diff['nonBranchOperandReconciliation']={'classified':operand_classified,'pending':operand_pending,'geometryBankBytesIdentical':296,'explicitFieldMap':{hex(k):hex(v) for k,v in field_map.items()}}
 assert old[0xfcc0+0x3b8e:0xfcc0+0x3b8e+287]==b[0x105c0+0x38c2:0x105c0+0x38c2+287]
 call_map={'call 0x3b8e':'call 0x38c2','lcall 0x1ec1, 0x1bf0':'lcall 0x1f07, 0x1bf8','lcall 0x1ec1, 0x1c8c':'lcall 0x1f07, 0x1c94','lcall 0x209e, 0x161e':'lcall 0x20e5, 0x1620','lcall 0x209e, 0x1690':'lcall 0x20e5, 0x1692','lcall 0x209e, 0x28':'lcall 0x20e5, 0x2a','lcall 0x209e, 0x3b34':'lcall 0x20e5, 0x3cba','lcall 0x209e, 0x3b82':'lcall 0x20e5, 0x3d08'}
 call_pairs=[r for r in aligned_numeric if r['old'].startswith(('call ','lcall '))]
 for pair in call_pairs:assert call_map[pair['old']]==pair['new']
 selector_diff['callReconciliation']={'sites':len(call_pairs),'uniqueTargets':len(call_map),'allTargetsExplicitlyMapped':True,'localMappingHelperBytesIdentical':287}
 branch_map={**instruction_map,**entry_map,0xc48:0x40c,0xc53:0x417,0xc55:0x419,0xc56:0x41a,0xd0a:0x44d,0xd0f:0x452,0x2170:0x164e}
 for group in groups:
  if group['legacy'] and group['modern'] and group['classification']=='hoisted-signed-absolute-coordinate-comparison':
   left=[r for r in group['legacy'] if r['op']!='nop '];right=[r for r in group['modern'] if r['op']!='nop ']
   branch_map[int(left[0]['at'],16)]=int(right[0]['at'],16)
   branch_map[int(left[-1]['at'],16)]=int(right[-1]['at'],16)
  if group['legacy'] and not group['modern'] and group['classification']=='verified-retained-point-pointer-no-external-entry':branch_map[int(group['legacy'][0]['at'],16)]=int(group['modernAnchor'],16)
 branch_map.update({0x1650:0xcc4,0x1672:0xcde,0x1a77:0x1034})
 old_by_address={i.address:i for i in old_ops}
 def mapped_destination(target):
  while target in old_by_address and old_by_address[target].mnemonic=='nop':target+=old_by_address[target].size
  return branch_map.get(target)
 branch_agree=0;branch_pending=[]
 for pair in aligned_numeric:
  if not pair['old'].startswith(('j','loop')):continue
  old_operand=pair['old'].split(' ',1)[1];new_operand=pair['new'].split(' ',1)[1]
  if not old_operand.startswith('0x') or not new_operand.startswith('0x'):continue
  expected=mapped_destination(int(old_operand,16))
  if pair['oldAt']=='0xc42' and pair['newAt']=='0x369':
   assert pair['old']=='jge 0xc48' and pair['new']=='jge 0x36f';branch_agree+=1
  elif expected==int(new_operand,16):branch_agree+=1
  else:branch_pending.append({**pair,'candidateMappedTarget':hex(expected) if expected is not None else None})
 selector_diff['branchDestinationReconciliation']={'candidateAgreement':branch_agree,'pending':branch_pending,'alignmentMapRequiresSemanticContext':True}
 assert operand_pending==[{'oldAt':'0xc48','newAt':'0x375','old':'mov ax, word ptr [bp - 0x24]','new':'mov ax, word ptr [bp - 0x2c]'}]
 assert branch_pending==[{'oldAt':'0xc50','newAt':'0x37a','old':'jmp 0x2170','new':'jmp 0x3f5','candidateMappedTarget':'0x164e'},{'oldAt':'0xd23','newAt':'0x466','old':'jmp 0xd29','new':'jmp 0x44d','candidateMappedTarget':None}]
 # These are not equivalent instruction pairs. Their old/new operations are
 # covered independently by exact guard/cache and crossroads CFG assertions.
 selector_diff['independentAlignmentExceptions']=[{'oldAt':'0xc48','newAt':'0x375','evidence':'exact old/new range guard and explicit new absolute-X setup','equivalentInstructionPair':False},{'oldAt':'0xc50','newAt':'0x37a','evidence':'old guard exit and new absolute-X merge verified independently','equivalentInstructionPair':False},{'oldAt':'0xd23','newAt':'0x466','evidence':'complete old/new shared crossroads flows verified independently','equivalentInstructionPair':False}]
 selector_diff['nonBranchOperandReconciliation']['independentlyAccountedExceptions']=operand_pending
 selector_diff['nonBranchOperandReconciliation']['pending']=[]
 selector_diff['branchDestinationReconciliation']['independentlyAccountedExceptions']=branch_pending
 selector_diff['branchDestinationReconciliation']['pending']=[]
 selector_diff['differenceClassificationComplete']=all(g['classification']!='pending' for g in groups)
 selector_diff['classificationIsNotFullRaceAcceptance']=True
 assert exact_ops(0x3f8,0x40c)==[('cmp','word ptr [bp - 0x28], 0'),('jge','0x406'),('mov','ax, word ptr [bp - 0x28]'),('neg','ax'),('jmp','0x409'),('nop',''),('mov','ax, word ptr [bp - 0x28]'),('mov','word ptr [bp - 0x2e], ax')]
 old_guard=[i for i in old_ops if 0xc48<=i.address<0xc5b];new_guard=[i for i in ops if 0x40c<=i.address<0x41f];assert len(old_guard)==len(new_guard)
 guard_map={x.address:y.address for x,y in zip(old_guard,new_guard)};guard_map[0x2170]=0x164e
 for x,y in zip(old_guard,new_guard):
  operand=x.op_str
  if x.mnemonic.startswith('j') and operand.startswith('0x'):operand=hex(guard_map[int(operand,16)])
  operand=operand.replace('0x20da','0x15b8')
  assert (x.mnemonic,operand)==(y.mnemonic,y.op_str)
 for group in groups:
  if group['classification']!='pending':continue
  old_at=group['legacy'][0]['at'] if group['legacy'] else None;new_at=group['modern'][0]['at'] if group['modern'] else None
  if (old_at,new_at) in [(None,'0x36f'),('0xc4b','0x378'),('0xc53','0x37c'),(None,'0x3f2')]:
   group['classification']='verified-common-absolute-cache-and-relocated-dispatch-guard';group['evidence']='exact common X/Z signed-abs paths and unchanged75-entry range/table guard checked as bounded regions; sequence matching crosses independent code roles'
 width_changes=[g for g in groups if any(r['at']=='0x1a5d' and r['op']=='cmp ax, 0x82' for r in g['legacy']) and g['modern']==[{'at':'0x1018','op':'cmp word ptr [bp - 0x32], 0x96'}]]
 assert len(width_changes)==1
 width_changes[0]['classification']='versioned-twisted-pipe-width';width_changes[0]['legacyWidth']=130;width_changes[0]['modernWidth']=150
 abs_helper=list(decoder.disasm(old[0x2054c:0x20561],0x193c));assert sum(i.size for i in abs_helper)==21
 assert [(i.mnemonic,i.op_str) for i in abs_helper]==[('push','bp'),('mov','bp, sp'),('cmp','word ptr [bp + 6], 0'),('jl','0x194a'),('mov','ax, word ptr [bp + 6]'),('jmp','0x194f'),('mov','ax, word ptr [bp + 6]'),('neg','ax'),('pop','bp'),('retf','')]
 for group in groups:
  if group['legacy']==[{'at':'0x1650','op':'push word ptr [bp - 0x2c]'},{'at':'0x1653','op':'lcall 0x1ec1, 0x193c'},{'at':'0x1658','op':'add sp, 2'},{'at':'0x165b','op':'cmp ax, 0x10e'}] and group['modern']==[{'at':'0xcc4','op':'cmp word ptr [bp - 0x32], 0x10e'}]:group['classification']='verified-signed-abs-helper-replaced-by-cache'
 for lo,hi,new_at in [(0xdce,0xde2,0x4e0),(0x1672,0x1686,0xcde)]:
  region=[i for i in old_ops if lo<=i.address<hi and i.mnemonic!='nop'];assert len(region)==7
  assert [(i.mnemonic,i.op_str) for i in region]==[('cmp','word ptr [bp - 0x2c], 0'),('jge',hex(region[5].address)),('mov','ax, word ptr [bp - 0x2c]'),('neg','ax'),('jmp',hex(region[6].address)),('mov','ax, word ptr [bp - 0x2c]'),('cmp','ax, 0x78')]
  assert exact_ops(new_at,new_at+4)==[('cmp','word ptr [bp - 0x32], 0x78')]
  for group in groups:
   if group['classification']=='pending' and group['legacy'] and all(lo<=int(r['at'],16)<hi for r in group['legacy']) and all(int(r['at'],16)==new_at for r in group['modern']):group['classification']='split-diff-group-verified-absolute-cache-comparison'
 legacy_product=old[0x209e0+0x161e:0x209e0+0x1638]
 modern_product=b[0x20e50+0x1620:0x20e50+0x163a]
 assert legacy_product==modern_product
 assert hashlib.sha256(modern_product).hexdigest()=='90cf1ee851e9b7ac712999a3158bc4badc615ef1f485ed40d00081df8f9c4a79'
 product_ops=list(decoder.disasm(modern_product,0x1620))
 assert sum(i.size for i in product_ops)==26
 assert not any(i.mnemonic in ('call','lcall','int') or i.mnemonic.startswith('j') for i in product_ops)
 assert a.legacy.read_bytes()==old
 paired.append({'name':'signed-fixed-point-product','bytes':26,'byteIdentical':True,'transitiveCalls':0})
 plane_fields={'0x9834':'0x9ace','0x97d2':'0x9a6c','0x97d4':'0x9a6e','0x9f32':'0xa1ca','0x9f34':'0xa1cc','0x945e':'0x96f8','0x9456':'0x96ec','0x9468':'0x9702'}
 motion_fields={**plane_fields,'0x99b8':'0xa1a2','0x99b2':'0xa19c','0x99b0':'0xa19a','0x99b4':'0xa19e','0x8d80':'0x8fde','0x99a4':'0xa18e','0x99b6':'0xa1a0','0x604':'0x6ac','0x5874':'0x5a6e','0x99aa':'0xa194','0x602':'0x6aa','0x5862':'0x5a5c'}
 motion_rows=[]
 for index,(image,start,wrapper) in enumerate([(old,0xb55c,0x74a8),(b,0xbbd6,0x74e6)]):
  decoded=list(decoder.disasm(image[start:start+402],0));assert sum(i.size for i in decoded)==402
  bounds={i.address for i in decoded};rows=[]
  for i in decoded:
   operand=i.op_str
   if i.mnemonic.startswith('j'):assert int(operand,16) in bounds
   if i.mnemonic=='call':assert int(operand,16)&65535==(wrapper-start)&65535;operand='verified-matrix-wrapper'
   if not index:
    import re
    operand=re.sub(r'0x[0-9a-f]+',lambda m:motion_fields.get(m[0],m[0]),operand)
    for before,after in [('0x209e, 0x3d44','0x20e5, 0x3eca'),('0x209e, 0x3ec8','0x20e5, 0x404e'),('0x209e, 0x28','0x20e5, 0x2a'),('0x2d94, 0x60','0x2df4, 0x5c')]:operand=operand.replace(before,after)
   rows.append((i.address,i.mnemonic,operand))
  motion_rows.append(rows)
 assert motion_rows[0]==motion_rows[1]
 paired.append({'name':'plane-movement','bytes':402,'instructions':163,'equivalentUnderExplicitFieldsAndVerifiedMath':True,'runtimePlaneCases':536})
 for name,old_start,new_start,size in [('plane-distance',0xb6ee,0xbd68,140),('normal-product',0xb77a,0xbdf4,122)]:
  comparisons=[]
  for index,(image,start) in enumerate([(old,old_start),(b,new_start)]):
   decoded=list(decoder.disasm(image[start:start+size],0));assert sum(i.size for i in decoded)==size
   bounds={i.address for i in decoded};rows=[]
   for i in decoded:
    operand=i.op_str
    if i.mnemonic.startswith('j'):assert int(operand,16) in bounds
    if not index:
     import re
     operand=re.sub(r'0x[0-9a-f]+',lambda m:plane_fields.get(m[0],m[0]),operand)
     operand=operand.replace('0x1ec1, 0x1c8c','0x1f07, 0x1c94').replace('0x1ec1, 0x1bf0','0x1f07, 0x1bf8')
    rows.append((i.address,i.mnemonic,operand))
   comparisons.append(rows)
  assert comparisons[0]==comparisons[1]
  paired.append({'name':name,'bytes':size,'equivalentUnderExplicitFieldsAndVerifiedArithmetic':True})
 wrapper_rows=[]
 for image,start,target in [(old,0x74a8,'0x209e, 0x3d44'),(b,0x74e6,'0x20e5, 0x3eca')]:
  decoded=list(decoder.disasm(image[start:start+54],start));assert sum(i.size for i in decoded)==54
  rows=[]
  for i in decoded:
   operand=i.op_str
   if i.mnemonic=='lcall':assert operand==target;operand='verified-vector-transform'
   else:assert i.mnemonic not in ('call','int') and not i.mnemonic.startswith('j')
   rows.append((i.address-start,i.mnemonic,operand))
  wrapper_rows.append(rows)
 assert wrapper_rows[0]==wrapper_rows[1]
 paired.append({'name':'far-matrix-copy-transform-wrapper','bytes':54,'equivalentUnderVerifiedTransformCall':True,'copiesWords':9})
 sound_rows=[]
 for index,(image,start) in enumerate([(old,0xaa92),(b,0xb178)]):
  decoded=list(decoder.disasm(image[start:start+46],0));assert sum(i.size for i in decoded)==46
  bounds={i.address for i in decoded};rows=[]
  for i in decoded:
   operand=i.op_str
   if not index:operand=operand.replace('0xa446','0xa6dc').replace('0x7ce','0x7cc').replace('0x792','0x790')
   if i.mnemonic.startswith('j'):assert int(operand,16) in bounds
   if i.mnemonic=='lcall':assert operand in ('0x18fd, 0x7cc','0x18fd, 0x790')
   rows.append((i.address,i.mnemonic,operand))
  sound_rows.append(rows)
 assert sound_rows[0]==sound_rows[1]
 paired.append({'name':'collision-sound-flag-dispatch','bytes':46,'equivalentUnderExplicitFlagAndCallbackRelocations':True,'callbackSemanticsSeparate':True})
 overlap_rows=[]
 for index,(image,start) in enumerate([(old,0xae4a),(b,0xb50e)]):
  decoded=list(decoder.disasm(image[start:start+876],0));assert sum(i.size for i in decoded)==876
  bounds={i.address for i in decoded};rows=[]
  for i in decoded:
   operand=i.op_str
   if not index:
    for before,after in [('0x209c, 0xc','0x20e3, 4'),('0x1696, 0x149a','0x1718, 0x14a2'),('0x209e, 0x3d44','0x20e5, 0x3eca'),('0x5fa','0x6a2'),('0x5f2','0x69a')]:operand=operand.replace(before,after)
   if i.mnemonic.startswith('j'):assert int(operand,16) in bounds
   if i.mnemonic=='lcall':assert operand in ('0x20e3, 4','0x1718, 0x14a2','0x20e5, 0x3eca')
   rows.append((i.address,i.mnemonic,operand))
  overlap_rows.append(rows)
 assert overlap_rows[0]==overlap_rows[1]
 paired.append({'name':'complete-car-overlap','bytes':876,'instructions':352,'equivalentUnderExplicitFieldsAndVerifiedMathCalls':True,'runtimeCorpusCases':1000,'fieldInitializationScopeSeparate':True})
 landmark_fields={'0x5854':'0x55bc','0x97b2':'0x9a4a','0x97b4':'0x9a4c','0x57c2':'0x552a','0x540e':'0x5176','0x5856':'0x55be','0x2023':'0x20a9','0x77d6':'0x79d6','0x77d8':'0x79d8','0x2024':'0x20aa','0x2eec':'0x2f0c','0x2ef8':'0x2f18','0x2f04':'0x2f24','0x2f10':'0x2f30','0x2eb6':'0x2ed6','0x2ebc':'0x2edc','0x71d0':'0x6f48','0x9f2c':'0xa1c4','0x9f2e':'0xa1c6','0x124':'0x182','0x201a':'0x20a0'}
 landmark_rows=[]
 for index,(image,start) in enumerate([(old,0x1212e),(b,0x11f0c)]):
  decoded=list(decoder.disasm(image[start:start+944],0));assert sum(i.size for i in decoded)==944
  bounds={i.address for i in decoded};rows=[]
  for i in decoded:
   operand=i.op_str
   assert i.mnemonic not in ('call','lcall','int')
   if i.mnemonic.startswith(('j','loop')):assert int(operand,16) in bounds
   if not index:
    operand=operand.replace('- 0x7c00','+ 0x7ad2').replace('- 0x7c02','+ 0x7ad0')
    import re
    operand=re.sub(r'0x[0-9a-f]+',lambda m:landmark_fields.get(m[0],m[0]),operand)
   rows.append((i.address,i.mnemonic,operand))
  landmark_rows.append(rows)
 assert landmark_rows[0]==landmark_rows[1]
 assert old[0x32090+0x2eb6:0x32090+0x2f1c]==b[0x32a90+0x2ed6:0x32a90+0x2f3c]
 paired.append({'name':'landmark-boundary-builder','bytes':944,'instructions':364,'equivalentUnderExplicitFields':True,'dimensionBankBytesIdentical':102,'transitiveCalls':0,'referencedGlobalsStillRequireContext':True})
 for name,old_start,new_start,size in [('matrix-transpose',0x248a8,0x24e9e,105),('unsigned-long-divide',0x2096a,0x20dd2,97)]:
  body=b[new_start:new_start+size]
  assert old[old_start:old_start+size]==body
  decoded=list(decoder.disasm(body,new_start));assert sum(i.size for i in decoded)==size
  bounds={i.address for i in decoded}
  for i in decoded:
   assert i.mnemonic not in ('call','lcall','int')
   if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in bounds
  paired.append({'name':name,'bytes':size,'byteIdentical':True,'transitiveCalls':0,'branchesInternal':True})
 # Evaluate only after all classification passes have finished.
 selector_diff['differenceClassificationComplete']=all(g['classification']!='pending' for g in groups)
print(json.dumps({'selectorBytes':0x194c-8,'codeInstructions':len(ops),'directBranchesAligned':branches,'jumpTables':table_results,'legacySelectorScope':legacy_selector_scope,'selectorDifferenceInventory':selector_diff,'indirectDispatchSites':indirect,'calls':calls,'pairedHelpers':paired,'crashHandlerScope':crash_scope,'particleGeneratorScope':particle_scope,'geometryHelperScopes':geometry_scopes,'sourceUnchanged':True,'semanticAcceptance':False},indent=2))
