"""Partition both full input functions; compare unchanged regions explicitly."""
import argparse,json,re,sys,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
images=[a.legacy.read_bytes(),a.modern.read_bytes()]
fields={0xa3c2:0xaab6,0x73b2:0x7a12,0x8fd8:0x96c8,0x8ff4:0x96e6,0x9aca:0xa1c0,0x8eac:0x9596,0xa42a:0xab1e,0x7fee:0x8648,0x8c26:0x92e0,0x12c:0x18a,0x4602:0x46b0,0xa7de:0xaed2,0xa77c:0xae70,0x893a:0x8ff4,0x5424:0x5a80,0x306c:0x30f2,0x771c:0x7062,0x76c4:0x700a,0xa034:0xa728,0xa34e:0xaa42,0xaa77:0xb16b,0x9c40:0xa332,0x9c42:0xa334}
calls=[{'0x6e7, 0x3800':'pause','0x6e7, 0x4542':'crash','0x286d, 0x1c4':'mouse','0x209e, 0x1dc3':'joystick','0x209e, 0x1b18':'controls','0x209e, 0x1fe8':'key','0x1ec1, 0x193c':'absolute','0x1ec1, 0x1c8c':'multiply'},{'0x6e8, 0x3eec':'pause','0x6e8, 0x4bb2':'crash','0x2d8c, 0x1bc':'mouse','0x20e5, 0x1dbf':'joystick','0x20e5, 0x1b14':'controls','0x20e5, 0x1fe9':'key','0x1f07, 0x1944':'absolute','0x1f07, 0x1c94':'multiply'}]
sections=[('entry/replay/gates',0x14414,0x14485,0x14ac0,0x14b31,True),('inactivity-rate',0x14485,0x1448c,0x14b31,0x14b3e,False),('crash/mouse-sample',0x1448c,0x144c7,0x14b3e,0x14b79,True),('mouse-word-arithmetic',0x144c7,0x144ff,0x14b79,0x14ba6,False),('buttons/joystick/keys',0x144ff,0x14599,0x14ba6,0x14c3f,True),('duration-rate',0x14599,0x145a5,0x14c3f,0x14c52,False),('duration-exit',0x145a5,0x145b8,0x14c52,0x14c64,True),('rollover-prompt/entry',0x145b8,0x145e4,0x14c64,0x14c94,False),('checkpoint/input-shift',0x145e4,0x146b5,0x14c94,0x14d94,False),('record/return',0x146b5,0x146d4,0x14d94,0x14db3,True)]
# Named external branch destinations are asserted shared semantic boundaries,
# not raw address normalization or a claim about changed arithmetic sections.
destinations=[{0x14422:'forced-zero',0x14599:'duration',0x14462:'active',0x14442:'replay-end',0x146ce:'return',0x1444c:'pause',0x14456:'done',0x1449b:'controls',0x1451c:'joystick',0x1456a:'keyboard',0x14554:'history',0x14571:'keys',0x14585:'second-key'}, {0x14ace:'forced-zero',0x14c3f:'duration',0x14b0e:'active',0x14aee:'replay-end',0x14dad:'return',0x14af8:'pause',0x14b02:'done',0x14b4d:'controls',0x14bc2:'joystick',0x14c10:'keyboard',0x14bfa:'history',0x14c17:'keys',0x14c2b:'second-key'}]
rows=[]
for name,oldStart,oldEnd,newStart,newEnd,equivalent in sections:
 normalized=[];bodies=[]
 for index,(start,end) in enumerate([(oldStart,oldEnd),(newStart,newEnd)]):
  ops=list(d.disasm(images[index][start:end],start));assert sum(i.size for i in ops)==end-start
  kept=[op for op in ops if op.mnemonic!='nop'];anchors={op.address:i for i,op in enumerate(kept)};result=[]
  for op in kept:
   operand=op.op_str
   if op.mnemonic=='lcall':assert operand in calls[index];operand=calls[index][operand]
   elif op.mnemonic.startswith('j'):
    target=int(operand,16)
    operand=destinations[index].get(target,'local:'+str(anchors[target]) if target in anchors else 'external:'+hex(target))
   elif index==0:
    operand=re.sub(r'0x[0-9a-f]+',lambda match:hex(fields.get(int(match[0],16),int(match[0],16))),operand)
    if op.address==0x14417:assert operand=='sp, 8';operand='sp, 0xa'
   result.append((op.mnemonic,operand))
  normalized.append(result);bodies.append({'start':hex(start),'bytes':end-start,'instructions':len(ops),'sha256':hashlib.sha256(images[index][start:end]).hexdigest()})
 if equivalent:assert normalized[0]==normalized[1],(name,[(i,x,y) for i,(x,y) in enumerate(zip(*normalized)) if x!=y][:8])
 rows.append({'section':name,'bodies':bodies,'unchangedUnderExplicitRelocations':equivalent,'changedSectionNeedsRuleEvidence':not equivalent})
assert all(sections[i][2]==sections[i+1][1] and sections[i][4]==sections[i+1][3] for i in range(len(sections)-1))
print(json.dumps({'completeBytePartition':True,'sections':rows,'changedSections':sum(not row['unchangedUnderExplicitRelocations'] for row in rows),'wholeItemAccepted':False}))
