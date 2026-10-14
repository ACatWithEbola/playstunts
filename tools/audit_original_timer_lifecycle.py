"""Full timer registration/removal/wait helpers under explicit relocations."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()]
fields={0xaa78:0xb16c,0x8936:0x8ff0,0x9b8:0xa1e,0x1396:0x13fa,0x407a:0x4128,0x407c:0x412a,0x4092:0x4140,0x40ae:0x415c}
calls=[{'0x209e, 0x1884':'add','0x209e, 0x18b8':'remove','0x209e, 0x3c5b':'wait','0x209e, 0x3bce':'counter','0x209e, 0xe':'fatal'},{'0x20e5, 0x1886':'add','0x20e5, 0x18ba':'remove','0x20e5, 0x3de1':'wait','0x20e5, 0x3d54':'counter','0x20e5, 6':'fatal'}]
scopes=[('install',0x142dc,0x142f8,0x14982,0x1499e),('remove-after-wait',0x142f8,0x14317,0x1499e,0x149bd),('unsigned-wait',0x2463b,0x24667,0x24c31,0x24c5d),('atomic-counter',0x245ae,0x245b8,0x24ba4,0x24bae),('callback-add',0x22264,0x22298,0x226d6,0x2270a),('callback-remove',0x22298,0x222d7,0x2270a,0x22749)]
out=[]
for name,os,oe,ns,ne in scopes:
 bodies=[];results=[]
 for index,(start,end) in enumerate([(os,oe),(ns,ne)]):
  ops=list(d.disasm(images[index][start:end],start));assert sum(i.size for i in ops)==end-start
  anchors={op.address:i for i,op in enumerate(ops)};result=[]
  for op in ops:
   operand=op.op_str
   if op.mnemonic=='lcall':assert operand in calls[index],(name,index,hex(op.address),operand);operand=calls[index][operand]
   elif op.mnemonic.startswith(('j','loop')):
    target=int(operand,16);assert target in anchors;operand='instruction:'+str(anchors[target])
   elif index==0:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
   result.append((op.mnemonic,operand))
  bodies.append({'bytes':end-start,'instructions':len(ops)});results.append(result)
 assert results[0]==results[1],(name,[(i,x,y) for i,(x,y) in enumerate(zip(*results)) if x!=y])
 out.append({'scope':name,'bodies':bodies,'equivalentUnderExplicitRelocations':True})
print(json.dumps({'scopes':out,'waitTicks':10,'usesAtomicUndividedCounter':True,'differenceClassificationComplete':True,'hardwareTickDeliveryVerified':False}))
