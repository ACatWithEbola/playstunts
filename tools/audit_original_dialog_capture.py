"""Full backdrop capture helper inventory, with explicit relocated operands."""
import argparse,difflib,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
fields={0x9556:0x97f0,0xac3c:0xaed4,0x136:0x194,0x7820:0x7a20,0x7822:0x7a22,0x50d8:0x4e92,0x50bc:0x4e76,0x9460:0x96fa,0x9462:0x96fc}
calls={'0x1ec1, 0x1c8c':'0x1f07, 0x1c94','0x1ec1, 0x1bf0':'0x1f07, 0x1bf8','0x3059, 0x4c8':'0x30e3, 0x626','0x1820':'0x1920','0x209e, 0x98ca':'0x20e5, 0x9a4e','0x209e, 0x3a64':'0x20e5, 0x3bea','0x209e, 0xa870':'0x20e5, 0xa9f4','0x209e, 0x8e60':'0x20e5, 0x8fe8'}
rows=[];bodies=[]
for index,(path,start,end) in enumerate([(a.legacy,0xa,0x11f),(a.modern,8,0x124)]):
 image=path.read_bytes();ops=list(d.disasm(image[0x198d0+start:0x198d0+end],start));assert sum(i.size for i in ops)==end-start and ops[-1].mnemonic=='retf'
 bounds={i.address for i in ops};row=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic.startswith(('j','loop')):assert int(operand,16) in bounds;operand='BRANCH'
  elif not index:
   if i.mnemonic in ('call','lcall'):assert operand in calls;operand=calls[operand]
   else:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  row.append((i.mnemonic,operand))
 rows.append(row);bodies.append(ops)
groups=[]
for tag,x,y,z,w in difflib.SequenceMatcher(None,rows[0],rows[1],autojunk=False).get_opcodes():
 if tag!='equal':groups.append({'tag':tag,'legacy':[(hex(i.address),i.mnemonic,i.op_str) for i in bodies[0][x:y]],'modern':[(hex(i.address),i.mnemonic,i.op_str) for i in bodies[1][z:w]]})
assert len(groups)==3
assert [g['modern'][0][0] for g in groups]==['0x10','0x63','0xde']
assert [(i.address,i.mnemonic,i.op_str) for i in bodies[0] if i.mnemonic.startswith('j')]==[(0x4e,'jg','0x60'),(0x50,'jl','0x57'),(0x55,'ja','0x60')]
assert [(i.address,i.mnemonic,i.op_str) for i in bodies[1] if i.mnemonic.startswith('j')]==[(0x15,'jne','0x20'),(0x5c,'jg','0x65'),(0x5e,'jl','0x17'),(0x63,'jbe','0x17')]
notes=['Added depth==3 failure guard, six original guard executions verify; malformed larger depths not accepted','Same signed high-word/unsigned low-word availability threshold; inverted JA success becomes JBE shared failure, both reject equality','Second state copy reuses ES loaded by earlier LES DI; intervening straight-line copy has no segment-register write or service call; caller-owned nonaliasing state bank remains explicit precondition']
for group,note in zip(groups,notes):group['classification']=note
print(json.dumps({'completeBodyBytes':[277,284],'structuralGroups':groups,'remainingGroups':0,'branchTargetsClassified':True,'differenceClassificationComplete':True,'wholeHelperAccepted':False,'hardwareAndMalformedAliasingNotInferred':True}))
