"""Close every direct branch before accepting a bitmap kernel's return boundary."""
import argparse,json,re,sys,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()]
fields={at:at+0x188 for at in [0x9114,0x911c,0x911e,0x9120,0x9122,0x9124,0x9126,0x6134,0x613a,0x613c,0x6144,0x7c20,0x7c30]}
fields.update({0x5908:0x5a90,0x209e:0x20e5})
kernel_pairs=[(0xb220,0xb3a4),(0xb286,0xb40a),(0xb2ec,0xb470),(0xbe56,0xbfe2),(0xbedc,0xc068),(0xbf62,0xc0ee)]
for old,new in kernel_pairs:
 assert images[0][0x209e0+old-8:0x209e0+old]==images[1][0x20e50+new-8:0x20e50+new]
 fields[65536-(old-8)]=65536-(new-8)
def closed(image,base,start):
 if start in (0x7c40,0x7dc8):
  # Decoder tails jump back to earlier returns; a mask bank follows, not code.
  body=list(d.disasm(image[base+start:base+start+627],start))
  assert sum(i.size for i in body)==627 and body[-1].mnemonic=='jmp'
  bounds={i.address for i in body}
  assert all(int(i.op_str,16) in bounds for i in body if i.mnemonic.startswith(('j','loop')))
  assert image[base+start+627]==0 and image[base+start+637:base+start+640]==bytes.fromhex('558bec')
  assert all(i.op_str in ('0x209e, 0x5908','0x20e5, 0x5a90') for i in body if i.mnemonic=='lcall')
  return body
 ops=[];targets=set()
 for i in d.disasm(image[base+start:base+start+2048],start):
  if i.mnemonic=='lcall':assert i.op_str in ('0x209e, 0x5908','0x20e5, 0x5a90'),('Unexpected dependency',i.op_str)
  else:assert i.mnemonic not in ('call','ljmp','int'),('Transitive dependency',hex(i.address),i.mnemonic,i.op_str)
  ops.append(i)
  if i.mnemonic.startswith(('j','loop')):targets.add(int(i.op_str,16))
  if i.mnemonic in ('ret','retf') and targets<={op.address for op in ops}:return ops
 raise AssertionError('No complete branch-closed return at '+hex(start))
results=[]
assert images[0][0x209e0+0x7eb4:0x209e0+0x7ebd]==images[1][0x20e50+0x803c:0x20e50+0x8045]
for old,new in kernel_pairs+[(0x7c40,0x7dc8)]:
 try:captured=[closed(image,base,start) for image,base,start in zip(images,[0x209e0,0x20e50],[old,new])]
 except AssertionError as error:
  if (old,new)!=(0x7c40,0x7dc8):raise
  results.append({'entries':[hex(old),hex(new)],'pending':str(error)});continue
 rows=[];sizes=[]
 for index,(image,base,start) in enumerate(zip(images,[0x209e0,0x20e50],[old,new])):
  ops=captured[index];anchors={i.address:n for n,i in enumerate(ops)};row=[]
  for i in ops:
   operand=i.op_str
   if i.mnemonic.startswith(('j','loop')):operand='instruction:'+str(anchors[int(operand,16)])
   elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
   row.append((i.mnemonic,operand))
  rows.append(row);sizes.append(ops[-1].address+ops[-1].size-start)
 assert rows[0]==rows[1],(hex(old),[(n,x,y) for n,(x,y) in enumerate(zip(*rows)) if x!=y][:10])
 results.append({'entries':[hex(old),hex(new)],'bytes':sizes,'instructions':len(rows[0]),'allBranchesClosed':True})
rectangle=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_rectangle_fill.py')),str(a.legacy),str(a.modern),'--libraries',str(a.libraries)],text=True))
assert rectangle['completeCodeBodiesMatch'] and rectangle['noTransitiveCalls']
print(json.dumps({'kernels':results,'completeKernelBodiesMatched':sum('pending' not in r for r in results),'pendingBodies':sum('pending' in r for r in results),'rectangleFillDependencyBodyCompared':True,'hardwareExecutionAccepted':False,'wholeItemAccepted':False}))
