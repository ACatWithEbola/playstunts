"""Complete like-for-like score-table body; transitive drawing acceptance separate."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
fields={0x975e:0x9e,0x975c:0x9c,0xae50:0xb0e6,0x942b:0x96bd,
 0x4e8a:0x507a,0x9794:0x9a2c,0x9792:0x9a2a,0x9446:0x96da,0x4ec2:0x50b2}
strings={0x2d8:0x336,0x2dc:0x33a,0x2df:0x33d,0x2e1:0x33f,
 0x2e5:0x343,0x2e9:0x347,0x2ed:0x34b}
fields.update(strings)
calls={'0x198d, 0x19d4':'0x198d, 0x1ad4','0x198d, 0x150c':'0x198d, 0x160c',
 '0x198d, 0x1540':'0x198d, 0x1640','0x1ec1, 0x169a':'0x1f07, 0x16a2',
 '0x198d, 0x2070':'0x198d, 0x20ee','0x198d, 0x1a72':'0x198d, 0x1b72',
 '0x198d, 0x22f4':'0x198d, 0x2372','0x209e, 0x9130':'0x20e5, 0x92b8',
 '0x209e, 0x5de6':'0x20e5, 0x5f6e','0x198d, 0x2312':'0x198d, 0x2390',
 '0x40a8':'0x40ae'}
images=[a.legacy.read_bytes(),a.modern.read_bytes()]
def text(image,base,at):
 end=image.index(b'\0',base+at,base+at+80)
 return image[base+at:end]
for old,new in strings.items():assert text(images[0],0x32090,old)==text(images[1],0x32a90,new)
rows=[];branch_count=0;call_count=0
for index,(image,start) in enumerate(zip(images,[0x3e62,0x3e68])):
 ops=list(d.disasm(image[start:start+581],start));assert len(ops)==219 and sum(i.size for i in ops)==581
 assert ops[-1].mnemonic=='retf';anchors={i.address:n for n,i in enumerate(ops)};result=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic in ('call','lcall'):
   if index==0:assert operand in calls;operand=calls[operand];call_count+=1
  elif i.mnemonic.startswith(('j','loop')):
   operand='instruction:'+str(anchors[int(operand,16)])
   if index==0:branch_count+=1
  elif index==0:
   operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  result.append((i.mnemonic,operand))
 rows.append(result)
assert rows[0]==rows[1],[(n,x,y) for n,(x,y) in enumerate(zip(*rows)) if x!=y]
# The nested MS91 row formatter temporarily forces the canonical HIG cadence
# to20, then restores the active game cadence. This is not table-body relocation.
row_ops=list(d.disasm(images[1][0x40ae:0x41e8],0x40ae))
assert sum(i.size for i in row_ops)==314 and row_ops[-1].mnemonic=='retf'
row_by={i.address:i for i in row_ops}
for at,pair in {
 0x4190:('mov','ax, word ptr [0x96dc]'),
 0x4193:('mov','word ptr [bp - 0x14], ax'),
 0x4196:('mov','word ptr [0x96dc], 0x14'),
 0x41b7:('lcall','0x198d, 0x23a0'),
 0x41dc:('mov','ax, word ptr [bp - 0x14]'),
 0x41df:('mov','word ptr [0x96dc], ax'),
}.items():assert (row_by[at].mnemonic,row_by[at].op_str)==pair
print(json.dumps({'bytesPerVersion':581,'instructionsPerVersion':219,
 'completeBodyCompared':True,'branchesMatched':branch_count,'callsMapped':call_count,
 'resourceStringsMatched':len(strings),'noStructuralDifference':True,
 'nestedMS91RowForces20HzAndRestoresCadence':True,
 'transitiveDrawingAndRowFormatterAcceptance':False,'wholeItemAccepted':False}))
