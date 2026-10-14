"""Compare complete primitive dispatch bodies; drawing callees remain separate."""
import argparse,hashlib,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
c=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()];bodies=[]
fields={0xa78a:0xaa22,0xa7fe:0xaa96,0x8d94:0x8ff2,0x59f2:0x5bec,0x5d14:0x5f0e,0x5d16:0x5f10,0xa0a0:0xa336,0xa444:0xa6da}
calls={'0x209e, 0x2d4a':'0x20e5, 0x2d8e','0x209e, 0x3cdc':'0x20e5, 0x3e62','0x209e, 0x9b4':'0x20e5, 0x9b6','0x209e, 0x13b8':'0x20e5, 0x13ba','0x2d69, 0xe':'0x2dc9, 0xa','0x209e, 0x4d00':'0x20e5, 0x4e86','0x209e, 0xa892':'0x20e5, 0xaa16'}
for image,start in zip(images,[0x17bf6,0x1841e]):
 body=list(c.disasm(image[start:start+516],start));assert len(body)==188 and sum(i.size for i in body)==516 and body[-1].mnemonic=='retf';bodies.append(body)
anchors=[{i.address:n for n,i in enumerate(body)}for body in bodies];branches=0;call_sites=[]
for old,new in zip(*bodies):
 assert old.mnemonic==new.mnemonic
 if old.mnemonic.startswith(('j','loop')):
  assert anchors[0][int(old.op_str,16)]==anchors[1][int(new.op_str,16)];branches+=1
 elif old.mnemonic=='lcall':
  assert calls[old.op_str]==new.op_str;call_sites.append({'legacy':old.op_str,'modern':new.op_str,'classification':'drawing dependency pending'})
 elif old.mnemonic=='call':assert old.op_str=='0x169e8'and new.op_str=='0x1720e'
 else:
  assert old.mnemonic not in ('int','ljmp')
  mapped=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),old.op_str)
  assert mapped==new.op_str,(hex(old.address),old.op_str,new.op_str)
assert a.legacy.read_bytes()==images[0]and a.modern.read_bytes()==images[1]
point_fields={n:n+0x188 for n in [0x9122,0x9124,0x911e,0x9120,0x911c,0x9114]};point_fields.update({0x56c2:0x58bc,0x6eec:0x6d64})
point_rows=[]
for index,(image,segment,start)in enumerate(zip(images,[0x209e,0x20e5],[0xa892,0xaa16])):
 body=list(c.disasm(image[segment*16+start:segment*16+start+187],start));assert len(body)==81 and sum(i.size for i in body)==187 and body[-1].mnemonic=='retf'
 anchors={i.address:n for n,i in enumerate(body)};rows=[]
 for i in body:
  assert i.mnemonic not in ('call','lcall','int','ljmp');operand=i.op_str
  if i.mnemonic.startswith(('j','loop')):operand='instruction:'+str(anchors[int(operand,16)])
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(point_fields.get(int(m[0],16),int(m[0],16))),operand)
  rows.append((i.mnemonic,operand))
 point_rows.append(rows)
assert point_rows[0]==point_rows[1]
assert images[0][0x32090+0x56c2:0x32090+0x56c2+32]==images[1][0x32a90+0x58bc:0x32a90+0x58bc+32]
for row in call_sites:
 if row['legacy']=='0x209e, 0xa892':row['classification']='complete187-byte point leaf and32-byte pixel-mask bank compared; hardware execution separate'
print(json.dumps({'bytesPerBody':516,'instructionsPerBody':188,'directBranchesMatched':branches,'explicitFields':len(fields),'drawingCallSites':call_sites,'pointLeaf':{'bytes':187,'instructions':81,'maskBytes':32,'codeEquivalent':True},'bodyEquivalentWithExplicitRelocations':True,'drawingDependenciesAccepted':False,'originalPixelParityClaimed':False,'sourceUnchanged':True}))
