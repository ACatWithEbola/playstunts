"""Complete timer comparison with explicit relocations and two cadence changes."""
import argparse,json,re,sys,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
fields={0x8936:0x8ff0,0x8a46:0x9100,0x8ffc:0x96f0,0x9332:0x9a26,0x955e:0x9c3e,0x8ff4:0x96e6,0xaa77:0xb16b,0x9aca:0xa1c0,0xa3c2:0xaab6,0x8c20:0x92da,0x8c1e:0x92d8,0x90a0:0x9794,0xaa78:0xb16c,0x8ffe:0x96f2,0x9b43:0xa233}
callbacks=[{'0x209e, 0x18f7':'stack-match','0x6e7, 0x3c50':'audio-sample','0x6e7, 0x3800':'pause'}, {'0x20e5, 0x18f9':'stack-match','0x6e8, 0x4326':'audio-sample','0x6e8, 0x3eec':'pause'}]
results=[];scopes=[]
for index,(path,start,end) in enumerate([(a.legacy,0x14318,0x14413),(a.modern,0x149be,0x14abf)]):
 image=path.read_bytes();ops=list(d.disasm(image[start:end],start));assert sum(i.size for i in ops)==end-start
 rows=[];anchors={};skip=set();cadence_sites=[0x14340,0x143c2] if index==0 else [0x149e6,0x14a6c]
 for i,op in enumerate(ops):
  if op.address in skip or op.mnemonic=='nop':continue
  anchors[op.address]=len(rows)
  if index==1 and op.address==0x14a35:
   assert (op.mnemonic,op.op_str)==('je','0x14a3a')
   assert (ops[i+1].mnemonic,ops[i+1].op_str)==('jmp','0x14aba')
   skip.add(ops[i+1].address);rows.append(('jne','0x14aba'));continue
  if op.address==cadence_sites[0]:
   if index==0:assert (op.mnemonic,op.op_str)==('cmp','word ptr [0x8a46], 5')
   else:
    assert (op.mnemonic,op.op_str)==('mov','ax, word ptr [0x96a8]')
    assert (ops[i+1].mnemonic,ops[i+1].op_str)==('cmp','word ptr [0x9100], ax');skip.add(ops[i+1].address)
   rows.append(('versioned-audio-interval-comparison',''));continue
  if op.address==cadence_sites[1]:
   if index==0:assert (op.mnemonic,op.op_str)==('mov','byte ptr [0x90a0], 5')
   else:
    assert (op.mnemonic,op.op_str)==('mov','al, byte ptr [0x96a8]')
    assert (ops[i+1].mnemonic,ops[i+1].op_str)==('mov','byte ptr [0x9794], al');skip.add(ops[i+1].address)
   rows.append(('versioned-recording-countdown-reload',''));continue
  operand=op.op_str
  if op.mnemonic=='lcall':assert operand in callbacks[index];operand=callbacks[index][operand]
  elif op.mnemonic=='call':assert operand==('0x14414' if index==0 else '0x14ac0');operand='input-selector'
  elif not op.mnemonic.startswith('j') and index==0:
   operand=re.sub(r'0x[0-9a-f]+',lambda match:hex(fields.get(int(match[0],16),int(match[0],16))),operand)
  rows.append((op.mnemonic,operand))
 for position,(mnemonic,operand) in enumerate(rows):
  if mnemonic.startswith('j'):
   target=int(operand,16);assert target in anchors;rows[position]=(mnemonic,'instruction:'+str(anchors[target]))
 results.append(rows);scopes.append({'bytes':end-start,'instructions':len(ops),'sha256':hashlib.sha256(image[start:end]).hexdigest()})
assert results[0]==results[1],('Unclassified timer instruction or branch difference',[(i,x,y) for i,(x,y) in enumerate(zip(*results)) if x!=y][:12],list(map(len,results)))
print(json.dumps({'scopes':scopes,'completeTimerCompared':True,'explicitCadenceChanges':2,'equivalentLongBranchExpansion':1,'remainingTimerDifferences':0,'hardwareCallbacksSeparatelyVerified':False}))
