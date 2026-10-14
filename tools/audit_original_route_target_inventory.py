"""Complete route-target inventory; structural alignment is not equivalence proof."""
import argparse,difflib,hashlib,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
bodies=[];scopes=[]
for path,start,end in [(a.legacy,0xab1a,0xae4a),(a.modern,0xb200,0xb50e)]:
 image=path.read_bytes();ops=list(d.disasm(image[start:end],start));assert sum(i.size for i in ops)==end-start
 assert ops[-1].mnemonic in ('retf','nop') and sum(op.mnemonic=='retf' for op in ops)==2
 bounds={op.address for op in ops}
 for op in ops:
  if op.mnemonic.startswith(('j','loop')):assert int(op.op_str,16) in bounds
 bodies.append(ops);scopes.append({'start':hex(start),'end':hex(end),'bytes':end-start,'instructions':len(ops),'sha256':hashlib.sha256(image[start:end]).hexdigest()})
key=lambda op:(op.mnemonic,re.sub(r'0x[0-9a-f]+','ADDR',op.op_str))
pairs=[];mapping={};groups=[]
for tag,x,y,z,w in difflib.SequenceMatcher(None,list(map(key,bodies[0])),list(map(key,bodies[1])),autojunk=False).get_opcodes():
 if tag=='equal':
  for old,new in zip(bodies[0][x:y],bodies[1][z:w]):pairs.append((old,new));mapping[old.address]=new.address
 else:groups.append({'tag':tag,'legacy':[(hex(op.address),op.mnemonic,op.op_str) for op in bodies[0][x:y]],'modern':[(hex(op.address),op.mnemonic,op.op_str) for op in bodies[1][z:w]]})
operands={};branches=[]
# Branches enter replacement Y/Z midpoint blocks, whose arithmetic is directly
# executed by check_original_route_midpoint.py, including Y=-1 bypass.
replacement_entries={0xadc2:0xb4a0,0xade5:0xb4ba}
for old,new in pairs:
 if old.mnemonic.startswith(('j','loop')):
  left=int(old.op_str,16);right=int(new.op_str,16)
  aligned=mapping.get(left)==right;replacement=replacement_entries.get(left)==right
  assert aligned or replacement,('Unclassified route branch target',hex(old.address),hex(new.address))
  branches.append({'legacy':hex(old.address),'modern':hex(new.address),'legacyTarget':hex(left),'modernTarget':hex(right),'alignedDestination':aligned,'verifiedMidpointReplacementEntry':replacement})
 elif old.op_str!=new.op_str:
  row=operands.setdefault((old.mnemonic,old.op_str,new.op_str),{'instruction':old.mnemonic,'legacy':old.op_str,'modern':new.op_str,'sites':[]})
  row['sites'].append([hex(old.address),hex(new.address)])
explicit_operands={
 'sp, 0x30':('sp, 0x32','extra cached direction word'),
 'si, ptr [0x8fee]':('si, ptr [0x96e0]','analyzed route tiles far buffer'),
 'si, ptr [0x9aea]':('si, ptr [0xa1da]','analyzed packed direction far buffer'),
 'ax, 0x2018':('ax, 0x209e','versioned14-byte track object records'),
 'al, byte ptr [bx + si - 0x6c9e]':('al, byte ptr [bx + si - 0x65a8]','opponent speed context DS9362 to9A58'),
 'word ptr [bp - 0x30], ax':('word ptr [bp - 0x32], ax','temporary vector far offset moved below cached direction'),
 'word ptr [bp - 0x2e], dx':('word ptr [bp - 0x30], dx','temporary vector far segment moved below cached direction'),
 'ax, word ptr [bp - 0x30]':('ax, word ptr [bp - 0x32]','temporary vector far offset read'),
 'si, ptr [0x9c4e]':('si, ptr [0xa340]','analyzed route columns far buffer'),
 'si, ptr [0x9fec]':('si, ptr [0xa6de]','analyzed terrain rows far buffer'),
 'bx, word ptr [bx - 0x762c]':('bx, word ptr [bx - 0x6f48]','track row index DS89D4 to90B8'),
 'si, ptr [0x9ad0]':('si, ptr [0xa1c4]','terrain tile far buffer'),
 'ax, word ptr [0x124]':('ax, word ptr [0x182]','hill height table entry450'),
 'si, word ptr [bx + 0x7f9e]':('si, word ptr [bx + 0x7ad0]','reverse row edge coordinate table'),
 'si, word ptr [bx - 0x586a]':('si, word ptr [bx - 0x5176]','reverse row center coordinate table'),
 'si, word ptr [bx + 0x7378]':('si, word ptr [bx + 0x79d8]','next column edge coordinate table'),
 'si, word ptr [bx - 0x5c1e]':('si, word ptr [bx - 0x552a]','column center coordinate table'),
}
assert set(row['legacy'] for row in operands.values())==set(explicit_operands)
for row in operands.values():
 target,label=explicit_operands[row['legacy']];assert row['modern']==target
 row['classification']=label
expected_groups={
 ((),('0xb21c',)):'cache original packed direction before masking; no intervening memory write to route buffer',
 (('0xab3b',),('0xb224',)):'reuse cached unmasked direction for independent reverse flag',
 ((),('0xb285',)):'padding only',
 ((),('0xb505',)):'padding after first return; branch skips it to second return path',
 (('0xad8f','0xad92','0xad93','0xad94'),()):'remove divisor2 argument setup, paired with original-tested X midpoint shift',
 (('0xadc2','0xadc5','0xadc6','0xadc7'),()):'remove divisor2 argument setup, paired with original-tested Y midpoint shift',
 (('0xade5','0xade8','0xade9','0xadea'),()):'remove divisor2 argument setup, paired with original-tested Z midpoint shift',
 (('0xada5','0xada6','0xada7'),('0xb489','0xb48b')):'versioned signed32 midpoint rounding X;242 original arithmetic cases',
 (('0xadd8','0xadd9','0xadda'),('0xb4b0','0xb4b2')):'versioned signed32 midpoint rounding Y; sentinel branch and242 original arithmetic cases',
 (('0xadfb','0xadfc','0xadfd'),('0xb4ca','0xb4cc')):'versioned signed32 midpoint rounding Z;242 original arithmetic cases',
 (('0xadb7',),()):'reuse BX output pointer loaded B48D before CMP/JNE, neither changes BX',
 (('0xae08',),()):'reuse BX output pointer loaded B4CE before output write',
 (('0xae16',),()):'reuse BX through MOVSW copies; string operations change SI/DI only',
 (('0xae22',),()):'reuse BX through second MOVSW copies; string operations change SI/DI only',
}
assert len(groups)==len(expected_groups)
for group in groups:
 signature=(tuple(row[0] for row in group['legacy']),tuple(row[0] for row in group['modern']))
 assert signature in expected_groups,('Unclassified structural route group',group)
 group['classification']=expected_groups[signature]
print(json.dumps({'scopes':scopes,'fullBodiesDecoded':True,'groups':groups,'branches':branches,'operandCandidates':list(operands.values()),'operandMappingsExplicit':True,'branchDestinationsReconciled':True,'structuralGroupsClassified':True,'wholeHelperAccepted':False}))
