"""Pinned, branch-closed original overview inventory; not a pixel-parity claim."""
import argparse,difflib,hashlib,json,re,subprocess,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
c=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()]
specs=[(0xe7dc,0xed58,'3275d75ddc79d8b5b3c8519e16cc295cf5b988331fc7f643c128c800c5141e6a'),(0xf000,0xf552,'782191bf614fa351bc70f6ecdc965d81d9d537fecdb14d75d5bf2ccd3de3e856')]
bodies=[];inventory=[]
for image,(start,end,digest)in zip(images,specs):
 assert hashlib.sha256(image[start:end]).hexdigest()==digest
 body=list(c.disasm(image[start:end],start));assert sum(i.size for i in body)==end-start and body[-1].mnemonic=='retf'
 anchors={i.address for i in body}
 for i in body:
  if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16)in anchors,(hex(i.address),i.op_str)
 bodies.append(body);inventory.append({'start':hex(start),'endExclusive':hex(end),'bytes':end-start,'instructions':len(body),'sha256':digest,'calls':[[hex(i.address),i.mnemonic,i.op_str]for i in body if i.mnemonic in ('call','lcall')]})
def shape(i):return i.mnemonic,re.sub(r'0x[0-9a-f]+|\b[0-9]+\b','#',i.op_str)
groups=[];operands=[];address_map={}
for tag,x0,x1,y0,y1 in difflib.SequenceMatcher(a=[shape(i)for i in bodies[0]],b=[shape(i)for i in bodies[1]],autojunk=False).get_opcodes():
 if tag=='equal':
  address_map.update({old.address:new.address for old,new in zip(bodies[0][x0:x1],bodies[1][y0:y1])})
  operands.extend([[hex(old.address),hex(new.address),old.mnemonic,old.op_str,new.op_str]for old,new in zip(bodies[0][x0:x1],bodies[1][y0:y1])if old.op_str!=new.op_str])
 else:groups.append({'kind':tag,'legacy':[[hex(i.address),i.mnemonic,i.op_str]for i in bodies[0][x0:x1]],'modern':[[hex(i.address),i.mnemonic,i.op_str]for i in bodies[1][y0:y1]],'classification':'pending'})
classifications={
 ('delete',0xe927):'removed initialization of unused bounds pointer; modern descriptors do not track overview bounds',
 ('replace',0xea0c):'coordinate table relocation wraps signed displacement: 83fe to7ad0; operand/table proof still required',
 ('replace',0xea67):'equivalent conditional branch shortening; branch correspondence proof still required',
 ('replace',0xeabd):'unused bounds pointer assignment removed; flags initialization moved earlier; record execution proof still required',
 ('delete',0xeada):'flags initialization moved to modernf2c5; record execution proof still required',
}
for address in [0xe98e,0xe99c,0xe9b4,0xea95,0xeaa2,0xeab5,0xeb6e,0xeb7c,0xeb8b]:
 classifications[('delete',address)]='removed signed truncation adjustment; arithmetic halving verified by131072 original executions'
for address in [0xea13,0xeb16]:classifications[('delete',address)]='removed alignment NOP; no state mutation'
classifications[('insert',0xf3b5)]='added alignment NOP; no state mutation'
assert len(classifications)==len(groups)==17
for group in groups:
 anchor=int((group['legacy']or group['modern'])[0][0],16)
 group['classification']=classifications[(group['kind'],anchor)]
assert address_map[0xea6c]==0xf27d and address_map[0xeaee]==0xf2f1
assert images[0][0xea65:0xea67]==images[1][0xf279:0xf27b]
for group in groups:
 if group['kind']=='replace'and group['legacy'][0][0]=='0xea67':
  assert group['legacy']==[['0xea67','jne','0xea6c'],['0xea69','jmp','0xeaee']]and group['modern']==[['0xf27b','je','0xf2f1']]
  group['classification']='equivalent conditional branch shortening; both zero/nonzero destinations mapped to corresponding instructions'
fields={0x124:0x182,0x900:0x9a8,0x8fa:0x9a2,0x8fc:0x9a4,0x8f6:0x99e,0x8fe:0x9a6,0x8f8:0x9a0,0x902:0x9aa,0x908:0x9b0,0x8440:0x863e,0xa03e:0xa2d4,0x9f8c:0xa220,0x9f8e:0xa222,0xa7f4:0xaa8c,0xa7f6:0xaa8e,0xa7f8:0xaa90,0xa7fa:0xaa92,0x94fa:0x9796,0x2bda:0x2c60,0x2018:0x209e,0x57c2:0x552a,0x540e:0x5176,0x71d0:0x6f48,0x9f2c:0xa1c4,0x9f2e:0xa1c6,0x77d8:0x79d8,0x7c80:0x7ebe,0x80a0:0x82de,0x80b6:0x82f4,0x80cc:0x830a,0x5854:0x55bc,0x97b2:0x9a4a,0x97b4:0x9a4c}
assert len(fields)==len(set(fields.values()))
ledger=[]
dependencies=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_model_dependencies.py')),str(a.legacy),str(a.modern),'--libraries',str(a.libraries)],text=True))
verified_calls={}
queue_reset_fields={0x8d94:0x8ff2,0x636c:0x6566,0x59ea:0x5be4,0x5d12:0x5f0c,0x8ea0:0x90fe}
queue_reset=[]
for image,start in zip(images,[0x169e8,0x1720e]):
 body=list(c.disasm(image[start:start+31],start));assert len(body)==6 and body[-1].mnemonic=='retf'and sum(i.size for i in body)==31
 queue_reset.append(body)
for old,new in zip(*queue_reset):
 mapped=re.sub(r'0x[0-9a-f]+',lambda m:hex(queue_reset_fields.get(int(m[0],16),int(m[0],16))),old.op_str)
 assert (old.mnemonic,mapped)==(new.mnemonic,new.op_str)
for row in dependencies['rows']:
 assert row['classification'].startswith('complete')
 left=tuple(int(n,16)for n in row['legacyEntry']);right=tuple(int(n,16)for n in row['modernEntry'])
 verified_calls[left]=(right,row['name'])
shared=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_chassis_structure.py')),str(a.legacy),str(a.modern),'--libraries',str(a.libraries)],text=True))
atan_proof=next(row for row in shared['upstreamWallHelperMappings']if row['legacyTarget']=='0x209c, 0xc')
assert atan_proof['atanCodeTableAndLookupEquivalent']
verified_calls[(0x209e,0x28)]=((0x20e5,0x2a),'atan2 including quadrant and lookup tables')
view_bodies=[]
for image,start in zip(images,[0x16a08,0x1722e]):
 body=list(c.disasm(image[start:start+152],start));assert len(body)==67 and sum(i.size for i in body)==152 and body[-1].mnemonic=='retf'
 assert not any(i.mnemonic.startswith(('j','loop'))or i.mnemonic in ('int','ljmp')for i in body)
 view_bodies.append(body)
view_fields={0xaeb8:0xb150,0x59cc:0x5bc6,0x59ec:0x5be6}
view_near={0x17dfa:0x18622,0x169e8:0x1720e}
for old,new in zip(*view_bodies):
 assert old.mnemonic==new.mnemonic
 if old.mnemonic=='call':assert view_near[int(old.op_str,16)]==int(new.op_str,16)
 elif old.mnemonic=='lcall':
  left=tuple(int(n.strip(),0)for n in old.op_str.split(','));right=tuple(int(n.strip(),0)for n in new.op_str.split(','))
  assert verified_calls[left][0]==right
 else:
  mapped=re.sub(r'0x[0-9a-f]+',lambda m:hex(view_fields.get(int(m[0],16),int(m[0],16))),old.op_str)
  assert mapped==new.op_str,(hex(old.address),old.op_str,new.op_str)
verified_calls[(0x1696,0xa8)]=((0x1718,0xae),'view selector including rotation/vector/atan tables and queue reset')
drawing_leaves=[]
projection=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_model_projection.py')),str(a.legacy),str(a.modern),'--libraries',str(a.libraries)],text=True))
assert len(projection['structuralGroups'])==11 and projection['sameShapeOperandChanges']==374
assert all(row['classification']!='pending'for row in projection['operandLedger'])and projection['sourceUnchanged']
verified_calls[(0x1696,0x140)]=((0x1718,0x146),'model projection with explicit version-specific halving/sort/region differences; complete dependency ledger')
for name,old_start,new_start,size,field_map in [
 ('clip-window setter',0x4f23,0x50ab,53,{0x912c:0x92b4,0x911e:0x92a6,0x912e:0x92b6,0x9120:0x92a8,0x9122:0x92aa,0x9124:0x92ac}),
 ('retained-window fill',0x4f8c,0x5114,352,{**{n:n+0x188 for n in [0x9114,0x911c,0x911e,0x9120,0x9122,0x9124,0x9126]},0x6eec:0x6d64})]:
 normalized=[]
 for index,(image,segment,start)in enumerate(zip(images,[0x209e,0x20e5],[old_start,new_start])):
  body=list(c.disasm(image[segment*16+start:segment*16+start+size],start));assert sum(i.size for i in body)==size and any(i.mnemonic=='retf'for i in body)
  anchors={i.address:n for n,i in enumerate(body)};rows=[]
  for i in body:
   assert i.mnemonic not in ('call','lcall','int','ljmp')
   operand=i.op_str
   if i.mnemonic.startswith(('j','loop')):operand='instruction:'+str(anchors[int(operand,16)])
   elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(field_map.get(int(m[0],16),int(m[0],16))),operand)
   rows.append((i.mnemonic,operand))
  normalized.append(rows)
 assert normalized[0]==normalized[1]
 verified_calls[(0x209e,old_start)]=((0x20e5,new_start),name+' complete branch-closed leaf')
 drawing_leaves.append({'name':name,'bytes':size,'instructions':len(normalized[0]),'completeCodeEquivalent':True,'hardwarePixelExecutionClaimed':False})
old_slope=images[0][0xfcc0+0x3b8e:0xfcc0+0x3b8e+287]
new_slope=images[1][0x105c0+0x38c2:0x105c0+0x38c2+287]
assert len(old_slope)==len(new_slope)==287 and old_slope==new_slope
slope_ops=list(c.disasm(new_slope,0x38c2));slope_anchors={i.address for i in slope_ops}
assert sum(i.size for i in slope_ops)==287 and slope_ops[-1].mnemonic=='retf'
for i in slope_ops:
 assert i.mnemonic not in ('call','lcall','int','ljmp')
 if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16)in slope_anchors
for old_at,new_at,mnemonic,old,new in operands:
 classification='pending'
 if mnemonic.startswith(('j','loop')):
  if address_map.get(int(old,16))==int(new,16):classification='corresponding direct branch destination'
 elif mnemonic=='lcall':
  classification='callee relocation; dependency proof remains separate'
  left=tuple(int(n.strip(),0)for n in old.split(','));right=tuple(int(n.strip(),0)for n in new.split(','))
  if left in verified_calls:
   mapped,name=verified_calls[left];assert mapped==right
   classification='complete reconciled dependency: '+name
  if old=='0xfcc, 0x3b8e':
   assert new=='0x105c, 0x38c2';classification='complete287-byte branch-closed slope helper identical across editions'
 else:
  mapped=re.sub(r'\[bp - (0x[0-9a-f]+|[0-9]+)\]',lambda m:'[bp - '+(hex(int(m[1],0)-8)if int(m[1],0)-8>=10 else str(int(m[1],0)-8))+']',old)
  mapped=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),mapped)
  if mapped==new:classification='explicit stack/data address relocation'
  elif old=='sp, 0x4a'and new=='sp, 0x42':classification='temporary stack workspace shortened by8 bytes'
 ledger.append({'legacy':old_at,'modern':new_at,'classification':classification,'oldOperand':old,'newOperand':new})
assert len(ledger)==264 and all(row['classification']!='pending'for row in ledger)
assert a.legacy.read_bytes()==images[0]and a.modern.read_bytes()==images[1]
print(json.dumps({'bodies':inventory,'structuralGroups':groups,'operandChanges':operands,'operandLedger':ledger,'drawingLeaves':drawing_leaves,'viewSelector':{'bytes':152,'instructions':67,'completeCodeAndIdentifiedDependenciesEquivalent':True},'viewQueueReset':{'bytes':31,'instructions':6,'explicitFieldRelocations':5,'completeLeafEquivalent':True},'sourceUnchanged':True,'originalPixelParityClaimed':False,'wholeItemAccepted':False}))
