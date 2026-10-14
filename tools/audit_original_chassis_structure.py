"""Bounded structural diff of complete original routines; not semantic proof."""
import argparse,sys,json,difflib,re,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
from capstone.x86 import X86_OP_IMM
c=Cs(CS_ARCH_X86,CS_MODE_16);c.detail=True
def decode(path,start,end,prefix):
 image=path.read_bytes();signature=bytes.fromhex(prefix);assert image[start:start+len(signature)]==signature
 assert image[end-6:end]==bytes.fromhex('5e5f8be55dcb')
 ops=list(c.disasm(image[start:end],start));assert sum(i.size for i in ops)==end-start
 def key(i):
  # Relocation/field addresses are omitted only for finding changed blocks;
  # raw instruction text remains in the report for subsequent semantic audit.
  text=re.sub(r'0x[0-9a-f]+','ADDR',i.op_str)
  if i.mnemonic.startswith('j') or i.mnemonic in ('call','lcall','loop'):return i.mnemonic
  constants=[o.imm for o in i.operands if o.type==X86_OP_IMM]
  return (i.mnemonic,text,tuple(constants))
 return image,ops,[key(i) for i in ops]
old,lo,lk=decode(a.legacy,0x74de,0x8f7c,'558bec81ece2015756')
new,mo,mk=decode(a.modern,0x751c,0x8f4a,'558bec81ece4015756')
blocks=[]
for tag,x,y,z,w in difflib.SequenceMatcher(None,lk,mk,autojunk=False).get_opcodes():
 if tag=='equal':continue
 blocks.append(dict(kind=tag,legacy=[dict(at=hex(i.address),op=i.mnemonic+' '+i.op_str) for i in lo[x:y]],modern=[dict(at=hex(i.address),op=i.mnemonic+' '+i.op_str) for i in mo[z:w]],modernAnchor=hex(mo[z].address) if z<len(mo) else None))
assert a.legacy.read_bytes()==old and a.modern.read_bytes()==new
def branches(ops,start,end):
 boundaries={i.address for i in ops};rows=[]
 for i in ops:
  if not (i.mnemonic.startswith('j') or i.mnemonic.startswith('loop')):continue
  immediate=[o.imm for o in i.operands if o.type==X86_OP_IMM]
  if not immediate:rows.append(dict(at=hex(i.address),op=i.mnemonic+' '+i.op_str,indirect=True));continue
  target=immediate[0]
  if start<=target<end:assert target in boundaries,(hex(i.address),hex(target))
  rows.append(dict(at=hex(i.address),op=i.mnemonic+' '+i.op_str,target=hex(target),internal=start<=target<end,backward=target<i.address))
 return rows
legacy_branches=branches(lo,0x74de,0x8f7c);modern_branches=branches(mo,0x751c,0x8f4a)
# Bound the final commit region explicitly: six deleted BX reloads are safe
# because no intervening instruction modifies BX or calls another routine.
commit_globals={0x9436:0x96ca,0x9438:0x96cc,0x943e:0x96d2,0x9440:0x96d4,0x9442:0x96d6,0x9444:0x96d8,0x9414:0x96a4,0x9402:0x9692,0x8e0c:0x906a}
commit=[];removed=0
for index,(ops,start) in enumerate([(lo,0x8f24),(mo,0x8f04)]):
 region=[i for i in ops if i.address>=start];assert region[0].mnemonic=='mov' and region[0].op_str=='bx, word ptr [bp + 6]'
 rows=[]
 for at,i in enumerate(region):
  if at and i.mnemonic=='mov' and i.op_str=='bx, word ptr [bp + 6]':
   assert index==0;removed+=1;continue
  assert i.mnemonic not in ('call','lcall')
  assert not (at and i.op_str.startswith('bx,'))
  operand=i.op_str
  if not index:
   for old_field,new_field in commit_globals.items():operand=operand.replace(f'[{hex(old_field)}]',f'[{hex(new_field)}]')
   operand=operand.replace('[bx + 0xb0]','[bx + 0xc8]')
  rows.append((i.mnemonic,operand))
 commit.append(rows)
assert removed==6 and commit[0]==commit[1]
initial=[];initial_removed=0;initial_globals={**commit_globals,0x99b0:0xa19a}
for index,(ops,start,end) in enumerate([(lo,0x74e7,0x7534),(mo,0x7525,0x7569)]):
 region=[i for i in ops if start<=i.address<end];assert sum(i.size for i in region)==end-start
 assert region[0].mnemonic=='mov' and region[0].op_str=='bx, word ptr [bp + 6]'
 rows=[]
 for at,i in enumerate(region):
  if at and i.mnemonic=='mov' and i.op_str=='bx, word ptr [bp + 6]':assert index==0;initial_removed+=1;continue
  assert i.mnemonic not in ('call','lcall') and not i.mnemonic.startswith(('j','loop'))
  assert not (at and i.op_str.startswith('bx,'))
  operand=i.op_str
  if not index:
   for old_field,new_field in initial_globals.items():operand=operand.replace(f'[{hex(old_field)}]',f'[{hex(new_field)}]')
  rows.append((i.mnemonic,operand))
 initial.append(rows)
assert initial_removed==3 and initial[0]==initial[1]
wall=[]
stack_fields={0x1be:0x1c0,0xdc:0xde,0x174:0x176,0x144:0x146,0x1a:0x1c,0x18:0x1a,0x16:0x18,0xf2:0xf4,0xe4:0xe6}
for index,(ops,start,end) in enumerate([(lo,0x7c5b,0x7d82),(mo,0x7c65,0x7d8c)]):
 region=[i for i in ops if start<=i.address<end];assert sum(i.size for i in region)==end-start
 rows=[]
 for i in region:
  operand=i.op_str
  if not index:
   # One regex pass prevents cascading mappings (18->1A->1C).
   operand=re.sub(r'\[bp - (0x[0-9a-f]+)\]',lambda m:'[bp - '+hex(stack_fields.get(int(m[1],16),int(m[1],16)))+']',operand)
  if i.mnemonic.startswith(('j','loop')):
   target=int(i.op_str,16)
   if start<=target<end:operand=f'local:{target-start}'
   else:assert target==(0x7878 if not index else 0x788c);operand='contact-retry'
  if i.mnemonic=='lcall':
   assert operand in ('0x1ec1, 0x1c8c','0x1ec1, 0x1bf0') if not index else operand in ('0x1f07, 0x1c94','0x1f07, 0x1bf8')
   operand='long-multiply' if operand.endswith(('0x1c8c','0x1c94')) else 'long-divide'
  rows.append((i.address-start,i.mnemonic,operand))
 wall.append(rows)
assert wall[0]==wall[1]
helper_rows=[]
for label,old_start,new_start,size in [('signed-long-divide',0x1bf0,0x1bf8,0x9c),('long-multiply',0x1c8c,0x1c94,0x34)]:
 old_body=old[0x1ec10+old_start:0x1ec10+old_start+size]
 new_body=new[0x1f070+new_start:0x1f070+new_start+size]
 assert old_body==new_body,(label,'helper bytes differ')
 ops=list(c.disasm(new_body,new_start));assert sum(i.size for i in ops)==size
 boundaries={i.address for i in ops}
 for i in ops:
  assert i.mnemonic not in ('call','lcall','int')
  if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in boundaries
 assert ops[-1].mnemonic=='retf' and ops[-1].op_str=='8'
 helper_rows.append({'name':label,'bytes':size,'instructions':len(ops),'byteIdentical':True,'callsOrInterrupts':False})
assert len(helper_rows)==2
wall_helper_summary={'helpers':helper_rows,'completeBodiesByteIdentical':True}
upstream_calls=[]
for old_target,new_target in [('0x2d94, 0x60','0x2df4, 0x5c'),('0x209e, 0x3d44','0x20e5, 0x3eca'),('0x209e, 0x446a','0x20e5, 0x45f0'),('0x209c, 0xc','0x20e3, 4'),('0x1696, 0x149a','0x1718, 0x14a2')]:
 old_sites=[hex(i.address) for i in lo if 0x79b0<=i.address<0x7c00 and i.mnemonic=='lcall' and i.op_str==old_target]
 new_sites=[hex(i.address) for i in mo if 0x79b0<=i.address<0x7c14 and i.mnemonic=='lcall' and i.op_str==new_target]
 assert len(old_sites)==len(new_sites)>0
 upstream_calls.append({'legacyTarget':old_target,'modernTarget':new_target,'legacySites':old_sites,'modernSites':new_sites,'bodyEquivalenceProven':False})
assert sum(len(x['modernSites']) for x in upstream_calls)==7
old_transform=old[0x209e0+0x3d44:0x209e0+0x3d44+0x104]
new_transform=new[0x20e50+0x3eca:0x20e50+0x3fce]
assert old_transform==new_transform
transform_ops=list(c.disasm(new_transform,0x3eca));assert sum(i.size for i in transform_ops)==0x104
transform_boundaries={i.address for i in transform_ops}
for i in transform_ops:
 assert i.mnemonic not in ('call','lcall','int')
 if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in transform_boundaries
assert transform_ops[-1].mnemonic=='retf'
upstream_calls[1].update(bodyEquivalenceProven=True,bytes=0x104,instructions=len(transform_ops),callsOrInterrupts=False)
old_intersection=old[0x209e0+0x446a:0x209e0+0x446a+0x55]
new_intersection=new[0x20e50+0x45f0:0x20e50+0x4645]
assert old_intersection==new_intersection
intersection_ops=list(c.disasm(new_intersection,0x45f0));assert sum(i.size for i in intersection_ops)==0x55
intersection_boundaries={i.address for i in intersection_ops}
for i in intersection_ops:
 assert i.mnemonic not in ('call','lcall','int')
 if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in intersection_boundaries
assert intersection_ops[-1].mnemonic=='retf'
assert sum(i.mnemonic=='idiv' for i in intersection_ops)==2
upstream_calls[2].update(bodyEquivalenceProven=True,bytes=0x55,instructions=len(intersection_ops),callsOrInterrupts=False)
rotation_rows=[]
for image,segment,start,index in [(old,0x2d94,0x60,0),(new,0x2df4,0x5c,1)]:
 ops=list(c.disasm(image[segment*16+start:segment*16+start+0x58],start));assert sum(i.size for i in ops)==0x58
 rows=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic=='lcall':
   targets={'0x209e, 0x3b82':'cos','0x209e, 0x3b34':'sin'} if not index else {'0x20e5, 0x3d08':'cos','0x20e5, 0x3cba':'sin'}
   assert operand in targets;operand=targets[operand]
  rows.append((i.address-start,i.mnemonic,operand))
 assert ops[-1].mnemonic=='retf';rotation_rows.append(rows)
assert rotation_rows[0]==rotation_rows[1]
import struct
trig_rows=[]
for image,segment,start,table,index in [(old,0x209e,0x3b34,0x4bc6,0),(new,0x20e5,0x3cba,0x4ca4,1)]:
 jump_targets=struct.unpack_from('<4H',image,segment*16+start+0x14)
 assert jump_targets==tuple(start+n for n in [0x1c,0x26,0x33,0x3f])
 rows=[]
 for first,last in [(start,start+0x14),(start+0x1c,start+0x59)]:
  ops=list(c.disasm(image[segment*16+first:segment*16+last],first));assert sum(i.size for i in ops)==last-first
  for i in ops:
   operand=i.op_str.replace(hex(table),'sine-table').replace(hex(start+0x14),'quadrant-jump-table')
   if i.mnemonic=='jmp' and i.op_str.startswith('0x'):assert int(i.op_str,16)==start+6;operand='sin-body'
   assert i.mnemonic not in ('call','lcall','int')
   rows.append((i.address-start,i.mnemonic,operand))
 trig_rows.append(rows)
assert trig_rows[0]==trig_rows[1]
pattern=struct.pack('<8H',0,101,201,302,402,503,603,704);sine_banks=[]
for image in [old,new]:
 at=image.find(pattern);assert at>=0 and image.find(pattern,at+1)<0;sine_banks.append(image[at:at+514])
assert len(sine_banks[0])==514 and sine_banks[0]==sine_banks[1]
upstream_calls[0].update(bodyEquivalenceProven=True,bytes=0x58,instructions=len(rotation_rows[0]),trigBodyAndTableEquivalent=True)
length_rows=[]
for image,segment,start,index in [(old,0x209c,0xc,0),(new,0x20e3,4,1)]:
 ops=list(c.disasm(image[segment*16+start:segment*16+start+0x21],start));assert sum(i.size for i in ops)==0x21
 rows=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic=='lcall':assert operand==('0x209e, 0x1690' if not index else '0x20e5, 0x1692');operand='hypot2d'
  rows.append((i.address-start,i.mnemonic,operand))
 assert ops[-1].mnemonic=='retf';length_rows.append(rows)
assert length_rows[0]==length_rows[1]
hypot_rows=[]
for image,segment,start,index in [(old,0x209e,0x1690,0),(new,0x20e5,0x1692,1)]:
 ops=list(c.disasm(image[segment*16+start:segment*16+start+0x6a],start));assert sum(i.size for i in ops)==0x6a
 boundaries={i.address for i in ops};rows=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic=='lcall':
   targets={'0x209e, 0x28':'atan2','0x209e, 0x3b82':'cos','0x209e, 0x3b34':'sin'} if not index else {'0x20e5, 0x2a':'atan2','0x20e5, 0x3d08':'cos','0x20e5, 0x3cba':'sin'}
   assert operand in targets;operand=targets[operand]
  elif i.mnemonic.startswith(('j','loop')):target=int(i.op_str,16);assert target in boundaries;operand=f'local:{target-start}'
  rows.append((i.address-start,i.mnemonic,operand))
 hypot_rows.append(rows)
assert hypot_rows[0]==hypot_rows[1]
upstream_calls[3].update(bodyEquivalenceProven=True,bytes=0x21,instructions=len(length_rows[0]),hypotBodyEquivalent=True,atanDependencyProven=False)
atan_rows=[];atan_targets=[]
for image,segment,start,lookup in [(old,0x209e,0x28,0x38c2),(new,0x20e5,0x2a,0x3970)]:
 table=start+0x4d;targets=struct.unpack_from('<8H',image,segment*16+table)
 atan_targets.append(tuple(t-start for t in targets));rows=[]
 boundaries=set()
 for first,last in [(start,table),(table+16,start+0x86)]:
  ops=list(c.disasm(image[segment*16+first:segment*16+last],first));assert sum(i.size for i in ops)==last-first
  boundaries.update(i.address for i in ops)
  for i in ops:
   operand=i.op_str.replace(hex(lookup),'atan-lookup').replace(hex(table),'quadrant-table')
   assert i.mnemonic not in ('call','lcall','int')
   if i.mnemonic.startswith(('j','loop')) and i.op_str.startswith('0x'):operand=f'local:{int(i.op_str,16)-start}'
   rows.append((i.address-start,i.mnemonic,operand))
 assert all(t in boundaries for t in targets)
 atan_rows.append(rows)
assert atan_rows[0]==atan_rows[1] and atan_targets[0]==atan_targets[1]
atan_pattern=bytes([0,1,1,2,3,3,4,4,5,6,6,7,8,8,9,10]);atan_banks=[]
for image in [old,new]:
 at=image.find(atan_pattern);assert at>=0 and image.find(atan_pattern,at+1)<0;atan_banks.append(image[at:at+257])
assert len(atan_banks[0])==257 and atan_banks[0]==atan_banks[1]
upstream_calls[3].update(atanDependencyProven=True,atanCodeTableAndLookupEquivalent=True)
combined=[];combined_targets=[]
matrix_fields={0x8460:0x865e,0xaf30:0xb176,0x979a:0x9a32,0x59ba:0x5bb4,0x59a8:0x5ba2,0x59d4:0x5bce,0x635a:0x6554,0xaea4:0xb13c,0x3310:0x3398}
for image,segment,start,index in [(old,0x1696,0x149a,0),(new,0x1718,0x14a2,1)]:
 table=start+0x168;rows=[];boundaries=set()
 targets=struct.unpack_from('<8H',image,segment*16+table);combined_targets.append(tuple(t-start for t in targets))
 for first,last in [(start,table),(table+16,start+0x180)]:
  ops=list(c.disasm(image[segment*16+first:segment*16+last],first));assert sum(i.size for i in ops)==last-first
  boundaries.update(i.address for i in ops)
  for i in ops:
   operand=i.op_str
   if not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(matrix_fields.get(int(m[0],16),int(m[0],16))),operand)
   if i.mnemonic=='lcall':
    calls={'0x2d94, 0xb8':'rotate-Z','0x2d94, 0xa':'rotate-X','0x2d94, 0x60':'rotate-Y','0x209e, 0x3e48':'matrix-multiply'} if not index else {'0x2df4, 0xb4':'rotate-Z','0x2df4, 6':'rotate-X','0x2df4, 0x5c':'rotate-Y','0x20e5, 0x3fce':'matrix-multiply'}
    assert i.op_str in calls;operand=calls[i.op_str]
   elif i.mnemonic.startswith(('j','loop')):
    if i.op_str.startswith('0x'):assert start<=int(i.op_str,16)<start+0x180;operand=f'local:{int(i.op_str,16)-start}'
    else:operand=operand.replace(hex(table),'rotation-dispatch-table')
   rows.append((i.address-start,i.mnemonic,operand))
 assert all(t in boundaries for t in targets);combined.append(rows)
assert combined[0]==combined[1] and combined_targets[0]==combined_targets[1]
upstream_calls[4].update(bodyEquivalenceProven=True,bytes=0x180,instructions=len(combined[0]),dispatchTableEquivalent=True,remainingTransitiveBodies=['rotate-X','rotate-Z','matrix-multiply'],runtimeCardinalMatricesRequireInitialization=True)
axis_rotation=[]
for label,old_start,new_start in [('rotate-X',0xa,6),('rotate-Z',0xb8,0xb4)]:
 normalized=[]
 for image,segment,start,index in [(old,0x2d94,old_start,0),(new,0x2df4,new_start,1)]:
  ops=list(c.disasm(image[segment*16+start:segment*16+start+0x55],start));assert sum(i.size for i in ops)==0x55
  rows=[]
  for i in ops:
   operand=i.op_str
   if i.mnemonic=='lcall':
    targets={'0x209e, 0x3b82':'cos','0x209e, 0x3b34':'sin'} if not index else {'0x20e5, 0x3d08':'cos','0x20e5, 0x3cba':'sin'}
    assert operand in targets;operand=targets[operand]
   assert not i.mnemonic.startswith(('j','loop')) and i.mnemonic!='int'
   rows.append((i.address-start,i.mnemonic,operand))
  assert ops[-1].mnemonic=='retf';normalized.append(rows)
 assert normalized[0]==normalized[1];axis_rotation.append({'name':label,'bytes':0x55,'instructions':len(normalized[0]),'trigDependenciesVerified':True})
old_matrix=old[0x209e0+0x3e48:0x209e0+0x3e48+0x80]
new_matrix=new[0x20e50+0x3fce:0x20e50+0x404e]
assert old_matrix==new_matrix
matrix_ops=list(c.disasm(new_matrix,0x3fce));assert sum(i.size for i in matrix_ops)==0x80
matrix_boundaries={i.address for i in matrix_ops}
for i in matrix_ops:
 assert i.mnemonic not in ('call','lcall','int')
 if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in matrix_boundaries
assert sum(i.mnemonic=='retf' for i in matrix_ops)==2
upstream_calls[4].update(remainingTransitiveBodies=[],axisRotationBodies=axis_rotation,matrixMultiplyBody={'bytes':0x80,'instructions':len(matrix_ops),'byteIdentical':True},allIdentifiedTransitiveCodeAndLookupDependenciesEquivalent=True)
wall_geometry=[]
geometry_globals={0xa802:0xaa9a,0x8e0c:0x906a,0x9402:0x9692,0x9414:0x96a4}
for index,(ops,start,end) in enumerate([(lo,0x7a1d,0x7c00),(mo,0x7a31,0x7c14)]):
 region=[i for i in ops if start<=i.address<end];assert sum(i.size for i in region)==end-start
 rows=[]
 for i in region:
  operand=i.op_str
  if not index:
   operand=re.sub(r'\[bp - (0x[0-9a-f]+)\]',lambda m:'[bp - '+hex(int(m[1],16)+(0 if int(m[1],16)==12 else 2))+']',operand)
   operand=re.sub(r'\[(0x[0-9a-f]+)\]',lambda m:'['+hex(geometry_globals.get(int(m[1],16),int(m[1],16)))+']',operand)
  if i.mnemonic=='lcall':
   mapping={r['modernTarget' if index else 'legacyTarget']:str(n) for n,r in enumerate(upstream_calls)}
   assert i.op_str in mapping;operand='verified-wall-helper:'+mapping[i.op_str]
  elif i.mnemonic.startswith(('j','loop')):
   target=int(i.op_str,16)
   if start<=target<end:operand=f'local:{target-start}'
   elif target==end:operand='wall-threshold-entry'
   else:assert target==(0x805c if not index else 0x806e),(hex(i.address),hex(target));operand='no-wall-response'
  rows.append((i.address-start,i.mnemonic,operand))
 wall_geometry.append(rows)
assert wall_geometry[0]==wall_geometry[1]
wall_helper_summary['upstreamCallerGeometry']={'instructions':len(wall_geometry[0]),'bytes':0x1e3,'equivalentUnderExplicitStackGlobalsAndVerifiedHelpers':True}
entry_rows=[]
entry_fields={0x8d3c:0x8f9a,0x9404:0x9694,0xa46c:0xa702,0x94fe:0x9798,0x7830:0x7a30,0x783e:0x7a3c}
for index,(ops,start,end) in enumerate([(lo,0x7990,0x7a1d),(mo,0x79a4,0x7a31)]):
 region=[i for i in ops if start<=i.address<end];assert sum(i.size for i in region)==end-start
 rows=[]
 for i in region:
  operand=i.op_str
  if not index:
   operand=re.sub(r'\[bp - (0x[0-9a-f]+)\]',lambda m:'[bp - '+hex(int(m[1],16)+2)+']',operand)
   operand=re.sub(r'\[(0x[0-9a-f]+)\]',lambda m:'['+hex(entry_fields.get(int(m[1],16),int(m[1],16)))+']',operand)
  assert i.mnemonic not in ('call','lcall','int')
  if i.mnemonic.startswith(('j','loop')):
   target=int(i.op_str,16)
   if start<=target<end:operand=f'local:{target-start}'
   else:assert target==(0x805c if not index else 0x806e);operand='no-wall-response'
  rows.append((i.address-start,i.mnemonic,operand))
 entry_rows.append(rows)
assert entry_rows[0]==entry_rows[1]
wall_helper_summary['wallEntryStateSetup']={'instructions':len(entry_rows[0]),'bytes':0x8d,'equivalentUnderExplicitStackAndGlobals':True}
orientation_copy=[]
for index,(ops,start,end) in enumerate([(lo,0x758c,0x75b7),(mo,0x75c8,0x75f3)]):
 region=[i for i in ops if start<=i.address<end];assert sum(i.size for i in region)==end-start
 rows=[]
 for i in region:
  operand=i.op_str
  if not index:
   for old_field,new_field in {0x8e0c:0x906a,0x9402:0x9692,0x9414:0x96a4,0x8d80:0x8fde}.items():operand=operand.replace(hex(old_field),hex(new_field))
  if i.mnemonic=='lcall':assert i.op_str==('0x1696, 0x149a' if not index else '0x1718, 0x14a2');operand='verified-combined-rotation'
  rows.append((i.address-start,i.mnemonic,operand))
 orientation_copy.append(rows)
assert orientation_copy[0]==orientation_copy[1]
wall_helper_summary['chassisOrientationMatrixCopy']={'bytes':0x2b,'exactUnderVerifiedRotationAndFieldMappings':True,'matrixWords':9}
# Connect changed groups to the bounded comparisons above. A group spanning
# a boundary remains pending: do not extrapolate evidence into adjacent code.
classified_regions=[
 ('local-stack-frame-growth',0x74e1,0x74e5,0x751f,0x7523,'local allocation grows by2 bytes; BP-relative argument identity retained, per-local mappings reviewed separately'),
 ('initial-state-copy',0x74e7,0x7534,0x7525,0x7569,'exact mapped state copy; redundant pointer reloads'),
 ('steering-quarter-rounding',0x7550,0x755e,0x7585,0x7589,'exhaustive original signed-word corpus; legacy minimum-word exception documented separately'),
 ('single-nop-padding',0,0,0x758f,0x7590,'decoded NOP has no state effect; later branch targets remain explicitly checked'),
 ('movement-cadence-divisor',0,0,0x7596,0x75a5,'exact added10Hz divisor selection; original20Hz divisor retained'),
 ('positive-divisor-high-word',0x756d,0x756e,0x75a5,0x75a7,'CWD and XOR DX are equivalent because both reachable divisor constants are positive'),
 ('redundant-added-car-pointer-reload',0,0,0x75af,0x75b2,'BX remains original car pointer from7525 with no intervening writes/calls or changed argument'),
 ('wall-entry',0x7990,0x7a1d,0x79a4,0x7a31,'exact mapped entry/coordinate setup'),
 ('wall-geometry',0x7a1d,0x7c00,0x7a31,0x7c14,'exact mapped geometry plus verified helper chain'),
 ('wall-threshold-decision',0x7c00,0x7c53,0x7c14,0x7c5d,'original arithmetic/decision corpus; implemented MS91 rounding'),
 ('wall-reposition',0x7c5b,0x7d82,0x7c65,0x7d8c,'exact mapped loop/helpers plus original execution corpus'),
 ('fall-slot-addressing',0x7d95,0x7da4,0x7d9f,0x7da2,'216 original fall-step cases cover allfour wheel indices and native retained fall speed'),
 ('slow-mode-second-fall-step',0,0,0x7dad,0x7dcc,'216 original10/20Hz signed fall corpus verifies second increment and displacement only at10Hz'),
 ('landing-sound-limit',0x83f7,0x83fc,0x83f5,0x83fa,'paired original landing sequence384-case corpus verifies signed190->250 limit and retained sound flags'),
 ('landing-crash-limit',0x840c,0x8414,0x840a,0x840f,'paired original landing sequence384-case corpus verifies signed931->23275 limit,event request and reset'),
 ('cached-body-plane-crossing-rule',0x8a01,0x8a27,0x89ab,0x89d5,'676 paired original guard executions prove old strict+-6 crossing versus modern strictzero crossing with mode1 bypass; native modern decisions match; selection/global event side effects separate'),
 ('final-state-commit',0x8f24,0x8f7c,0x8f04,0x8f4a,'exact mapped final commit; redundant pointer reloads'),
]
# Both complete four-wheel rotation loops and intervening pitch decision.
# Explicit two-byte local relocation is applied once; branch destinations
# retain their position within the block. Helpers are already body-verified.
rotation_rows=[]
for index,(ops,start,end) in enumerate([(lo,0x87b3,0x88b7),(mo,0x877b,0x887f)]):
 region=[i for i in ops if start<=i.address<end]
 assert sum(i.size for i in region)==end-start
 rows=[]
 for i in region:
  operand=i.op_str
  if not index:
   operand=re.sub(r'\[bp - (0x[0-9a-f]+)\]',lambda m:'[bp - '+hex(int(m[1],16)+2)+']',operand)
   operand=operand.replace('di, 0x1dc','di, 0x1de').replace('[0x9402]','[0x9692]')
  if i.mnemonic.startswith(('j','loop')):
   target=int(i.op_str,16);assert start<=target<=end
   operand=f'local:{target-start}'
  if i.mnemonic=='lcall':
   targets={'0x209e, 0x3d44':'transform','0x20e5, 0x3eca':'transform','0x209e, 0x28':'atan','0x20e5, 0x2a':'atan','0x2d94, 0xa':'rotation-X','0x2df4, 6':'rotation-X'}
   assert operand in targets;operand=targets[operand]
  rows.append((i.address-start,i.mnemonic,operand))
 rotation_rows.append(rows)
assert rotation_rows[0]==rotation_rows[1]
wall_helper_summary['chassisWheelRotationLoops']={'bytes':0x104,'instructions':len(rotation_rows[0]),'exactUnderExplicitLocalAndVerifiedHelperMappings':True}
# Both branch choices that reach891C retain the car pointer; paths exiting
# to892A or8F04 do not reach that anchor. No calls occur before the merge.
pointer_ops={i.address:i for i in mo if 0x88de<=i.address<0x891c}
assert pointer_ops[0x88de].op_str=='bx, word ptr [bp + 6]'
assert pointer_ops[0x88e1].op_str=='di, bx'
for i in pointer_ops.values():
 if i.address in (0x88de,0x88e1):continue
 assert i.mnemonic not in ('call','lcall','int')
 assert not any(i.reg_name(r) in ('bx','bl','bh','di','bp') for r in i.regs_access()[1])
 assert not i.op_str.startswith(('word ptr [bp + 6],','byte ptr [bp + 6],'))
 if i.mnemonic.startswith('j'):
  assert int(i.op_str,16) in set(pointer_ops)|{0x891c,0x892a,0x8f04}
old_divisor=list(c.disasm(old[0x756a:0x756e],0x756a))
assert [(i.mnemonic,i.op_str) for i in old_divisor]==[('mov','ax, 0x3c00'),('cdq','')]
new_divisor=list(c.disasm(new[0x7596:0x75a7],0x7596));assert sum(i.size for i in new_divisor)==0x11
assert [(i.mnemonic,i.op_str) for i in new_divisor]==[
 ('cmp','word ptr [0x96dc], 0xa'),('jne','0x75a2'),('mov','ax, 0x1e00'),
 ('jmp','0x75a5'),('mov','ax, 0x3c00'),('sub','dx, dx')]
assert all(0<=n<32768 for n in [0x1e00,0x3c00])
assert old[0x74e1:0x74e5]==bytes.fromhex('81ece201') and new[0x751f:0x7523]==bytes.fromhex('81ece401')
retained_bx=[i for i in mo if 0x7525<=i.address<0x75af]
assert retained_bx[0].mnemonic=='mov' and retained_bx[0].op_str=='bx, word ptr [bp + 6]'
for i in retained_bx[1:]:
 assert i.mnemonic not in ('call','lcall','int')
 assert not any(i.reg_name(r) in ('bx','bl','bh','bp') for r in i.regs_access()[1]),(hex(i.address),i.op_str)
 assert not (i.op_str.startswith('word ptr [bp + 6],') or i.op_str.startswith('byte ptr [bp + 6],'))
assert new[0x75af:0x75b2]==bytes.fromhex('8b5e06')
merge_ops={i.address:i for i in mo if 0x75f3<=i.address<0x7640};merge_states={};queue=[(0x75f3,'unknown')];merge_outputs=set()
while queue:
 address,state=queue.pop()
 if address==0x7640:merge_outputs.add(state);continue
 assert address in merge_ops
 if state in merge_states.setdefault(address,set()):continue
 merge_states[address].add(state);i=merge_ops[address]
 assert not any(i.reg_name(r)=='bp' for r in i.regs_access()[1])
 assert not i.op_str.startswith(('word ptr [bp + 6],','byte ptr [bp + 6],'))
 if i.mnemonic=='mov' and i.op_str=='bx, word ptr [bp + 6]':state='car-argument'
 elif i.mnemonic in ('call','lcall') or any(i.reg_name(r) in ('bx','bl','bh') for r in i.regs_access()[1]):state='unknown'
 if i.mnemonic=='jmp':queue.append((int(i.op_str,16),state))
 elif i.mnemonic.startswith('j'):queue.extend([(int(i.op_str,16),state),(i.address+i.size,state)])
 else:queue.append((i.address+i.size,state))
assert merge_outputs=={'car-argument'}
# Fully reviewed suspension helper: no transitive calls, external branches,
# globals or additional state fields. Versioned rounding is intentional.
suspension_bodies=[]
for image,start,end,digest in [
 (old,0x18e12,0x18fd7,'c3321e12ca27c13bb83e0f5349a0bf4f9913848c2c7cbdb5399d6963ee02e642'),
 (new,0xab00,0xac79,'3dd5ce130d727ff165b8e60b4ac2c03e5b689cc7b282c0bf525ee255bd548e85')]:
 body=image[start:end];assert hashlib.sha256(body).hexdigest()==digest
 ops=list(c.disasm(body,start));assert sum(i.size for i in ops)==len(body)
 boundaries={i.address for i in ops}
 for i in ops:
  assert i.mnemonic not in ('call','lcall','int')
  if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in boundaries
 assert ops[-1].mnemonic=='retf'
 suspension_bodies.append({'start':hex(start),'bytes':len(body),'instructions':len(ops),'hash':digest})
wall_helper_summary['suspensionHelperClassification']={'bodies':suspension_bodies,'transitiveCalls':0,'changedRule':'signed quarter rounding on wrapped triple negative distance','corpus':'1000 full-range original cases per engine across allfour wheel slots'}
# Opcode98 is CBW in this 16-bit image, although Capstone labels it CWDE.
# Pin the entire bounded copy block: CBW changes AH, not AL; remaining
# instructions address/copy memory or preserve SI, and none writes AX/AL.
# Its destination BP-1C6..BP-1C1 cannot overwrite the wheel slot BP-E8.
assert new[0x776a:0x7789].hex()=='8a8618ff988bf8d1e703f8d1e78b5e08568db1d2008dbe3afe1607a5a5a55e'
assert new[0x7789]==0x98
wheel_copy=[i for i in mo if 0x776a<=i.address<0x7789]
assert wheel_copy[0].op_str=='al, byte ptr [bp - 0xe8]'
for i in wheel_copy[1:]:
 if i.address==0x776e:
  assert bytes(i.bytes)==b'\x98' # no operand-size prefix: preserves AL
 else:
  assert not any(i.reg_name(r) in ('al','ax','eax','bp') for r in i.regs_access()[1])
wall_helper_summary['movementDivisorClassification']={'legacy':0x3c00,'modern10Hz':0x1e00,'modernOtherCadence':0x3c00,'cwdToZeroHighWordEquivalentForAllReachableConstants':True}
for number,block in enumerate(blocks,1):
 block['id']=number;block['classification']='pending'
 if number in (58,71):
  regions=[(0x895a,0x8993,'cee6422a3376784c798926050925fc61bbdbf7f6b621f970b5e8065231e35c67'),(0x8a98,0x8adc,'9aef6e96773aa14e496faac2a24f5dada72c82923628c8cc84108d2d3e4ac43a')]
  for start,end,digest in regions:
   assert hashlib.sha256(new[start:end]).hexdigest()==digest
   region=[i for i in mo if start<=i.address<end]
   assert sum(i.size for i in region)==end-start
  assert [(i.address,i.op_str) for i in mo if 0x895a<=i.address<0x8adc and i.mnemonic=='lcall' and i.op_str=='0x105c, 8']==[(0x8983,'0x105c, 8'),(0x8ab6,'0x105c, 8')]
  block.update(classification='modern-two-point-surface-selection-caller',evidence='complete57-byte reverse-selection and68-byte current-selection blocks decoded/hash-pinned; both pass current local point first with retained point second, reverse path uses copied old point and current snapshot; four-byte cleanup, SI/DI copy preservation and same-plane guard explicit; transitive selection helper remainsitem24 and fullrace acceptance separate')
 if number==60:
  assert hashlib.sha256(new[0x8993:0x89ab]).hexdigest()=='231eec79487a57ac2bf9f114245a61d72afb5f7f0a5f32d2192f4596e1db376b'
  assert [(i.mnemonic,i.op_str) for i in mo if 0x8993<=i.address<0x89a0]==[('push','word ptr [bp - 0x1c2]'),('push','word ptr [bp - 0x1c4]'),('push','word ptr [bp - 0x1c6]'),('push','ax')]
  block.update(classification='modern-retained-point-plane-distance-arguments',evidence='complete24-byte caller pins Z/Y/X/selectedplane push order, far-return ABI,8-byte argument cleanup and signed result local; original planeDistance1072 cases cover all536 shipped planes cached/uncached and match native; prior selection helper classification remains separate')
 if number in (57,59):
  assert hashlib.sha256(old[0x8999:0x89e9]).hexdigest()=='88a5daa2979a3f9242ac87a5ebc0af4f655fb83d037abce1e2cfe96c748512aa'
  region=[i for i in lo if 0x8999<=i.address<0x89e9]
  assert sum(i.size for i in region)==0x50
  assert [(i.address,int(i.op_str,16)) for i in region if i.mnemonic=='jne']==[(0x89b7,0x89b1),(0x89cd,0x89c7),(0x89e3,0x89dd)]
  assert [(i.mnemonic,i.op_str) for i in region[:6]]==[('mov','cx, ax'),('shl','ax, 1'),('add','ax, cx'),('shl','ax, 1'),('shl','ax, 1'),('mov','di, ax')]
  assert hashlib.sha256(new[0x895a:0x8979]).hexdigest()=='e2587d4626d835e0039a8ae63b32e8d1cc3620570c44c245e9a1460c4205f20b'
  block.update(classification='replaced-legacy-long-position-reconstruction',evidence='complete80-byte legacy block computes12*wheel and three signed32 SAR6 reductions into localword point; modern31-byte copy block instead reads retained threeword point at car+8C+6*wheel; intentional state-source change, not equivalence; modern selection helpers remain separately pending')
 if number==56:
  assert block['modern']==[{'at':'0x8953','op':'nop '},{'at':'0x8954','op':'mov ax, word ptr [0x9ace]'},{'at':'0x8957','op':'mov word ptr [bp - 0xe], ax'}]
  assert [(i.mnemonic,i.op_str) for i in mo if i.address==0x898e]==[('cmp','word ptr [bp - 0xe], ax')]
  assert [(i.mnemonic,i.op_str) for i in mo if i.address==0x8991]==[('jne','0x89d5')]
  block.update(classification='modern-selected-plane-snapshot',evidence='explicit new planeId global snapshot into BP-E; later898E comparison and8991 branch bypass crossing check when previous-point selection changes plane; native bodyPlaneContact has same-plane condition; selection helper semantics remain separate')
 if number==65:
  assert new[0x89d5:0x89f4].hex()=='8a8618ff988bf8d1e703f8d1e78b5e06568db98c008db684fe1e07a5a5a55e'
  region=[i for i in mo if 0x89d5<=i.address<0x89f4]
  assert sum(i.size for i in region)==0x1f
  assert not any(i.mnemonic.startswith(('j','loop')) or i.mnemonic in ('call','lcall','int') for i in region)
  block.update(classification='modern-retained-body-cache-commit',evidence='exact31-byte block computes6*wheel, copies three words from BP-17C to car+8C+6*wheel and preservesSI; intentional modern retained-cache state, not legacy equivalence; original/native40 consecutive PMIN tunnel steps match cache,pose,crash and roadSpeed; helper selection remains separate')
 if number==72:
  assert hashlib.sha256(old[0x18c8e:0x18e12]).hexdigest()=='645710bc12c6d7d398e1e4501057ff99673fce212f17053d8134446389f63df6'
  assert hashlib.sha256(new[0xa990:0xab00]).hexdigest()=='667a471db24cc8bfaa7178d4d4e992edf55ed2dc69740a584c0ac0b63e469552'
  for image,start,end in [(old,0x18c8e,0x18e12),(new,0xa990,0xab00)]:
   ops=list(c.disasm(image[start:end],start));assert sum(i.size for i in ops)==end-start
   boundaries={i.address for i in ops}
   for i in ops:
    if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in boundaries
  block.update(classification='relocated-versioned-car-contact-response',evidence='complete bodies decoded/pinned; original1000 paired cases match nativeincluding681 versiondifferences; modern signedrounding and unsignedspeedclamp intentionallyrouted; transitivehelper classification remainsitem24')
 if number in (73,74):
  assert new[0x8c18:0x8c1b].hex()=='8bf857' and new[0x8c26:0x8c28].hex()=='8bc7'
  block.update(classification='retained-selected-car-across-crash-call',evidence='modern saves signextended selectedcar inDI before first crashrequest and reuses it for XOR1 request; originalhandler preserves DI in2000 cases acrossallcauses,cars,cadences; no DI write in interveningcaller instructions')
 if number in (76,77,78,79):
  bank=bytes.fromhex('0500280005000a00060079000600090001000a0001000a00')
  assert old[0x32090+0x592:0x32090+0x5aa]==new[0x32a90+0x5f0:0x32a90+0x608]==bank
  mapping={0x5a2:0x600,0x592:0x5f0,0x59a:0x5f8}
  assert len(block['legacy'])==len(block['modern'])==1
  target=int(block['legacy'][0]['op'].split(', ')[1],16)
  assert block['modern'][0]['op']==f'mov ax, {hex(mapping[target])}'
  block.update(classification='collision-dimension-bank-relocation',evidence='entire24-byte bank identical at explicit DS image offsets; three8-byte dimension/radius records unchanged:5/40/5/10,6/121/6/9,1/10/1/10; surrounding collision helper acceptance separate')
 if number in (66,67,68,69,70):
  assert hashlib.sha256(old[0x8a35:0x8a63]).hexdigest()=='e1a33987dae5609ac35b5c694df5afce5c3bc05ae3037e8d0732b0c2b25e0fae'
  assert hashlib.sha256(new[0x8a02:0x8a31]).hexdigest()=='99ea97b6a9d06b124920a9a67815a161b52460051dda46a878efab90c6154126'
  block.update(classification='retained-body-wheel-index-preparation',evidence='1024 paired original local preparations match three coordinates and shiftedheight; modern hoists6*wheel before DI and preservesDI around copy; BX survives so deleted reload redundant; SI/SP preserved')
 if number in (53,55):
  assert block['modernAnchor']==('0x88ef' if number==53 else '0x891c')
  assert not block['modern']
  block.update(classification='retained-car-pointer-through-status-branches',evidence='BX/DI defined88DE/88E1; complete pre891C region has no pointer/argument writes or calls; branch exits either remain in audited region,reach anchor,or leave without reaching it')
 if number in (51,52):
  assert block['legacy'][0]['op']=='sub di, 0x1dc' and block['modern'][0]['op']=='sub di, 0x1de'
  block.update(classification='rotation-loop-local-bank-relocation',evidence='complete260-byte paired rotation-loop/pitch block matches with explicit2-byte local relocation,verified atan/transform/X helpers,and every internal branch mapped')
 if number==44:
  assert block['legacy']==[{'at':'0x8575','op':'lcall 0x187a, 0x672'}]
  assert block['modern']==[{'at':'0x854d','op':'push cs'},{'at':'0x854e','op':'call 0xab00'}]
  block.update(classification='relocated-versioned-suspension-helper',evidence='PUSH CS plus near CALL preserves far-return argument ABI; complete helpers decoded/hash-pinned/internal branches audited; native versioned rounding matches1000 original cases per engine,allfour wheels')
 if number in (40,41,42,43):
  assert hashlib.sha256(old[0x84e7:0x8562]).hexdigest()=='753e1310999247c75a5190af83b87a55fb7bfda9e4df46ece839f40f8ba29243'
  assert hashlib.sha256(new[0x84e3:0x853a]).hexdigest()=='5712947284a54a4d6ac921e4f280bcea776e6ff80963d5622b8294bad1c4c520'
  block.update(classification='hoisted-wheel-commit-address',evidence='modern computes car+6*wheel once in DI; three unchanged SAR/RCR six-bit reductions store axes at74/76/78. Paired original1024-case checker independently verifies all four wheels and signed32 boundaries; scratch registers are not claimed identical')
 if block['legacy']==[{'at':'0x7759','op':'mov al, byte ptr [bp - 0xe6]'}] and not block['modern']:
  assert block['modernAnchor']=='0x7789'
  block.update(classification='retained-wheel-index-through-copy',evidence='exact16-bit776A..7789 block retains AL loaded from BP-E8; opcode98 CBW modifies AH only; six-byte destination does not overlap source wheel slot')
 if block['legacy']==[{'at':'0x7604','op':'mov bx, word ptr [bp + 6]'}] and not block['modern']:
  assert block['modernAnchor']=='0x7640'
  block.update(classification='branch-merge-car-pointer-reload',evidence='all explicit CFG paths from75F3 merge at7640 with BX equal car argument; calls conservatively invalidate BX until reloaded')
 for label,os,oe,ns,ne,evidence in classified_regions:
  if all(os<=int(row['at'],16)<oe for row in block['legacy']) and all(ns<=int(row['at'],16)<ne for row in block['modern']):
   block.update(classification=label,evidence=evidence);break
 if block['classification']=='pending' and len(block['legacy'])==len(block['modern'])==1:
  old_op=block['legacy'][0]['op'];new_op=block['modern'][0]['op']
  if old_op in ('mov ax, 0x8d80','mov di, 0x8d80') and new_op==old_op.replace('0x8d80','0x8fde'):
   block.update(classification='orientation-matrix-bank-relocation',evidence='verified inverse-angle rotation call and exact nine-word bank copy; pointer constant changes to corresponding new bank')
 if block['classification']=='pending' and all(row['op']=='nop ' for row in block['legacy']+block['modern']):
  for image,rows in [(old,block['legacy']),(new,block['modern'])]:
   for row in rows:
    at=int(row['at'],16);assert image[at]==0x90
    ins=next(c.disasm(image[at:at+1],at));assert ins.mnemonic=='nop' and not ins.regs_access()[1]
  block.update(classification='nop-padding-only',evidence='all changed bytes are decoded90 NOP with no register/flag state writes; full routine branch-target alignment independently verified')
 if block['classification']=='pending' and len(block['legacy'])==1 and not block['modern']:
  old_op=block['legacy'][0]['op']
  if old_op=='mov bx, word ptr [bp - 0xdc]' and block['modernAnchor']:
   anchor=int(block['modernAnchor'],16);candidate=[i for i in mo if i.address<anchor]
   retained=None
   for i in reversed(candidate):
    if i.mnemonic in ('call','lcall','int') or i.mnemonic.startswith(('j','loop')):break
    if i.op_str.startswith(('word ptr [bp - 0xde],','byte ptr [bp - 0xde],')):break
    writes=[i.reg_name(r) for r in i.regs_access()[1]]
    if any(r in ('bx','bl','bh','bp') for r in writes):
     if i.mnemonic=='mov' and i.op_str=='bx, word ptr [bp - 0xde]':retained=i.address
     break
   if retained is not None:block.update(classification='retained-point-pointer-reload',evidence=f'straight-line modern BX retained from{retained:04X} until{anchor:04X}; no intervening BX/BP writes,calls,branches or direct pointer-slot changes',pointerDefinition=hex(retained))
 if block['classification']=='pending' and block['legacy'] and not block['modern'] and block['modernAnchor']:
  definitions=[];anchor=int(block['modernAnchor'],16)
  for row in block['legacy']:
   match=re.fullmatch(r'mov (bx|di|al), (word|byte) ptr \[bp ([+-]) (0x[0-9a-f]+)\]',row['op'])
   if not match:break
   reg,width,sign,slot=match.groups();slot=int(slot,16)+(2 if sign=='-' else 0)
   expected=f'{reg}, {width} ptr [bp {sign} {hex(slot)}]';aliases={'bx':('bx','bl','bh'),'di':('di',),'al':('al','ax','eax')}[reg];definition=None
   for i in reversed([i for i in mo if i.address<anchor]):
    if i.mnemonic in ('call','lcall','int') or i.mnemonic.startswith(('j','loop')):break
    if i.op_str.startswith((f'word ptr [bp {sign} {hex(slot)}],',f'byte ptr [bp {sign} {hex(slot)}],')):break
    writes=[i.reg_name(r) for r in i.regs_access()[1]]
    if 'bp' in writes:break
    if any(r in aliases for r in writes):
     if i.mnemonic=='mov' and i.op_str==expected:definition=i.address
     break
   if definition is None:break
   definitions.append({'register':reg,'definition':hex(definition),'slot':f'bp {sign} {hex(slot)}'})
  if len(definitions)==len(block['legacy']):block.update(classification='retained-register-load-batch',evidence='all removed loads individually proven by straight-line register definitions with no writes/calls/branches/direct source-slot mutation',retainedDefinitions=definitions)
classified=sum(block['classification']!='pending' for block in blocks)
wall_helper_summary['changedGroupCoverage']={'total':len(blocks),'classified':classified,'remaining':len(blocks)-classified,'pendingIds':[b['id'] for b in blocks if b['classification']=='pending']}
print(json.dumps(dict(legacyInstructions=len(lo),modernInstructions=len(mo),changedBlocks=len(blocks),blocks=blocks,legacyBranches=legacy_branches,modernBranches=modern_branches,upstreamWallHelperMappings=upstream_calls,wallArithmeticHelpers=wall_helper_summary,wallRepositionLoopClassification={'instructions':len(wall[0]),'equivalentUnderExplicitStackAndCallMappings':True,'transitiveHelperEquivalenceProven':True},initialCopyReloadClassification={'removedReloads':initial_removed,'equivalentUnderExplicitStateOffsets':True},finalCommitReloadClassification={'removedReloads':removed,'equivalentUnderExplicitStateOffsets':True,'scope':'final car-position/orientation commit only'},normalizationIsNotSemanticEquivalence=True,fullBranchAuditComplete=False)))
