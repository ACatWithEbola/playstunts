"""Full initializer inventory; alignment is not operand semantic proof."""
import argparse,json,re,difflib,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
def decode(path,start,end):
 ops=list(d.disasm(path.read_bytes()[start:end],start));assert sum(i.size for i in ops)==end-start
 bounds={op.address for op in ops}
 for op in ops:
  if op.mnemonic.startswith(('j','loop')):assert int(op.op_str,16) in bounds
 return ops
old=decode(a.legacy,0x9178,0x9578);new=decode(a.modern,0x9100,0x9538)
legacy_height=a.legacy.read_bytes()[0x2d1a0+0x122:0x2d1a0+0x126]
modern_height=a.modern.read_bytes()[0x32a90+0x180:0x32a90+0x184]
assert legacy_height==modern_height==bytes.fromhex('0000c201'),'Start height table must remain0/450'
reset_fields={0x90a0:0x9794,0x9b43:0xa233,0x73b2:0x7a12,0x8ff4:0x96e6,0x7fee:0x8648,0x93dc:0x9ad2}
reset_old=decode(a.legacy,0x142b4,0x142dc);reset_new=decode(a.modern,0x1495a,0x14982)
reset_rows=lambda ops,translate:[(op.mnemonic,re.sub(r'0x[0-9a-f]+',lambda m:hex(reset_fields.get(int(m[0],16),int(m[0],16))),op.op_str) if translate else op.op_str) for op in ops]
assert reset_rows(reset_old,True)==reset_rows(reset_new,False),'Input-reset helper has an unclassified difference'
key=lambda op:(op.mnemonic,re.sub(r'0x[0-9a-f]+','ADDR',op.op_str))
groups=[];pairs=[];mapping={}
for tag,x,y,z,w in difflib.SequenceMatcher(None,list(map(key,old)),list(map(key,new)),autojunk=False).get_opcodes():
 if tag=='equal':
  for left,right in zip(old[x:y],new[z:w]):pairs.append((left,right));mapping[left.address]=right.address
 else:groups.append({'tag':tag,'old':[(hex(op.address),op.mnemonic,op.op_str) for op in old[x:y]],'new':[(hex(op.address),op.mnemonic,op.op_str) for op in new[z:w]]})
assert len(groups)==3
assert groups[0]['tag']=='insert' and [row[0] for row in groups[0]['new']]==['0x914b','0x9150','0x9152','0x9158','0x915a','0x9160','0x9163','0x9167','0x916a','0x916d','0x916e','0x9172','0x9174','0x9177','0x917b','0x917d']
assert groups[1]['new']==[('0x919c','mov','word ptr [0x9494], si')]
assert groups[2]['old']==[('0x91e9','nop','')]
groups[0]['classification']='added cadence cache-offset/spacing/timer divisor and mode-3 early return; original prefix/mode-3 captures linked'
groups[1]['classification']='added previous-route reset; original nonzero seeded full-snapshot regression linked'
groups[2]['classification']='removed padding instruction, no state effect'
branches=[];operands={}
for left,right in pairs:
 if left.mnemonic.startswith(('j','loop')):
  oldTarget=int(left.op_str,16);target=int(right.op_str,16);matched=mapping.get(oldTarget)==target
  if not matched:
   assert (left.address,right.address,oldTarget,target)==(0x9186,0x910e,0x91c3,0x914b)
  branches.append({'old':hex(left.address),'new':hex(right.address),'destinationMapped':matched,'cadenceInsertionEntry':not matched})
 elif left.op_str!=right.op_str:
  k=(left.mnemonic,left.op_str,right.op_str)
  row=operands.setdefault(k,{'instruction':left.mnemonic,'oldOperand':left.op_str,'newOperand':right.op_str,'sites':[]})
  row['sites'].append([hex(left.address),hex(right.address)])
def snapshot_address(value):
 # Canonical 1072-byte state gains a 24-byte body cache in each car record.
 if 0x8ae6<=value<0x8cc4:return value+0x6ba
 if 0x8cc4<=value<0x8d7c:return value+0x6d2
 if 0x8d7c<=value<0x8f16:return value+0x6ea
 return None
classified=0;helper_classified=0;context_classified=0
context_operands={
 ('ax, word ptr [bx + 0x122]','ax, word ptr [bx + 0x180]'):'original height tables compared byte-for-byte0/450; caller BX indexes hill flag times2',
 ('word ptr [0xa034], si','word ptr [0xa728], si'):'checkpoint count; reset/input rollover original captures',
 ('ax, 0x430','ax, 0x460'):'1072 to1120 checkpoint stride; full original reset prefix capture',
 ('ax, 0x3c4','ax, 0x3f4'):'checkpoint marker offset after inserted48 body-cache bytes',
 ('ax, word ptr [0xa030]','ax, word ptr [0xa724]'):'checkpoint far pointer offset; original reset prefix',
 ('dx, word ptr [0xa032]','dx, word ptr [0xa726]'):'checkpoint far pointer segment; original reset prefix',
 ('ax, word ptr [0x9b2a]','ax, word ptr [0xa21a]'):'analyzed track start heading; full initialized-snapshot oracle',
 ('cx, word ptr [0x9b2a]','cx, word ptr [0xa21a]'):'analyzed track start heading; full initialized-snapshot oracle',
 ('al, byte ptr [0x8fba]','al, byte ptr [0x96a6]'):'analyzed start column; full initialized-snapshot oracle',
 ('al, byte ptr [0x8fbb]','al, byte ptr [0x96a7]'):'analyzed start hill flag; scanStart column/hill/row tuple and original collision context',
 ('al, byte ptr [0x8fbc]','al, byte ptr [0x96aa]'):'analyzed start terrain row; scanStart column/hill/row tuple and original collision context',
 ('cx, word ptr [bx + 0x7f9e]','cx, word ptr [bx + 0x7ad0]'):'reverse terrain-row coordinate table (29-row)*1024; original allocated track oracle',
 ('ax, word ptr [bx - 0x586a]','ax, word ptr [bx - 0x5176]'):'centered reverse-row table DS A796 toAE8A; original allocated track oracle',
 ('ax, word ptr [bx - 0x5c1e]','ax, word ptr [bx - 0x552a]'):'centered column table DS A3E2 toAAD6; original allocated track oracle',
 ('bx, word ptr [0x7ff4]','bx, word ptr [0x864e]'):'opponent allocated path offset; original opponent preparation checks allocated third link table',
 ('es, word ptr [0x7ff6]','es, word ptr [0x8650]'):'opponent allocated path segment; original opponent preparation checks allocated third link table',
 ('ax, 0xa46a','ax, 0xab5e'):'player simulation bank; all11-car full initialized-snapshot oracle',
 ('ax, 0x9c52','ax, 0xa344'):'opponent simulation bank; inactive/active/mixed-car full snapshot oracle',
 ('al, byte ptr [0x8fc7]','al, byte ptr [0x96b5]'):'selected transmission passed to player car initializer; replay header configuration byte5',
 ('byte ptr [0x8fc8], 0','byte ptr [0x96b6], 0'):'selected opponent gate for initial route target; replay header configuration byte6',
}
verified_helpers={
 ('0x8f7c','0x8f4a'):'complete car initializer inventory and528 original/native retained-state cases; audit_original_car_initialization.py/compare_original_car_initialization.ts',
 ('0xab1a','0xb200'):'complete route helper inventory,242 midpoint and128 complete-helper original cases; audit_original_route_target_inventory.py/compare_original_ms91_route_target.ts',
 ('0x1396, 0x954','0x13fa, 0x9ba'):'complete input reset compared directly in this audit (40 bytes each), equivalent under six explicit field relocations',
 ('0x1ec1, 0x1c8c','0x1f07, 0x1c94'):'long multiplication; audit_original_chassis_structure.py',
 ('0x209e, 0x3b34','0x20e5, 0x3cba'):'sine including lookup bank; reconcile_ms91_chassis_dependencies.py',
 ('0x209e, 0x3b82','0x20e5, 0x3d08'):'cosine including lookup bank; reconcile_ms91_chassis_dependencies.py',
 ('0x209e, 0x161e','0x20e5, 0x1620'):'signed fixed-point product; audit_ms91_surface_selection_calls.py',
}
for row in operands.values():
 if row['instruction'] in ('call','lcall') and (row['oldOperand'],row['newOperand']) in verified_helpers:
  row['classification']='previous complete helper comparison: '+verified_helpers[(row['oldOperand'],row['newOperand'])]
  helper_classified+=1
  continue
 if row['instruction'] not in ('call','lcall') and (row['oldOperand'],row['newOperand']) in context_operands:
  row['classification']='explicit initialization context: '+context_operands[(row['oldOperand'],row['newOperand'])]
  context_classified+=1
  continue
 left=list(re.finditer(r'0x[0-9a-f]+',row['oldOperand']))
 right=list(re.finditer(r'0x[0-9a-f]+',row['newOperand']))
 if row['instruction'] not in ('call','lcall') and len(left)==len(right)==1:
  before=int(left[0].group(),16);after=int(right[0].group(),16)
  # Indexed negative displacements address the same canonical state banks.
  if ' - ' in row['oldOperand']:
   before=(-before)&0xffff;after=(-after)&0xffff
  if snapshot_address(before)==after:
   row['classification']='canonical race-state relocation with inserted car body caches'
   classified+=1
print(json.dumps({'legacyInstructions':len(old),'modernInstructions':len(new),'fullBodiesDecoded':True,'changedShapeGroups':groups,'pairedBranches':branches,'operandCandidates':list(operands.values()),'snapshotRelocationsClassified':classified,'verifiedHelperRelocations':helper_classified,'contextReferencesClassified':context_classified,'remainingOperandCandidates':len(operands)-classified-helper_classified-context_classified,'operandCandidatesRequireSemanticMapping':True,'wholeItemAccepted':False}))
