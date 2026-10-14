"""Compose original BIOS with explicit 8237 byte/count semantics.
DMA grants/IRQ windows are supplied, not CPU timing or measured physical bus.
"""
import argparse,hashlib,json,struct
from pathlib import Path
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN,UC_HOOK_INTR
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('bios',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
rom=a.bios.read_bytes();digest=hashlib.sha256(rom).hexdigest();assert digest=='a3a79791ed4ca85c4206412a2138ca8587e616dad2282a22812ccd6eac6c3c71'
rows=[]
for segment,offset,length in [(0x3000,0x100,1),(0x3000,0x100,4),(0x3fff,15,2),(0x3fff,15,18),(0x3fff,14,4)]:
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0xf0000,rom);m.mem_write(0x4d4,bytes([255]));m.mem_write(0x3c,struct.pack('<HH',0xf000,0x2000))
 state=dict(address=0,count=65535,page=0,flip=0,masked=True);ports={0x21:255,0xc4:0};writes=[];addresses=[];callbacks=[];terminals=[]
 def out(cpu,port,size,value,_):
  assert size==1;writes.append([port,value]);ports[port]=value
  if port==0xc:state['flip']=0
  elif port in [2,3]:
   key='address' if port==2 else 'count';shift=state['flip']*8;state[key]=(state[key]&~(255<<shift))|(value<<shift);state['flip']^=1
  elif port==0x83:state['page']=value
  elif port==0xa and value&3==1:state['masked']=bool(value&4)
 def inp(cpu,port,size,_):
  assert size==1
  if port==3:value=(state['count']>>(state['flip']*8))&255;state['flip']^=1;return value
  return ports.get(port,0)
 def interrupt(cpu,number,_):assert number==0x15;callbacks.append(cpu.reg_read(UC_X86_REG_AX))
 m.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN);m.hook_add(UC_HOOK_INTR,interrupt)
 def execute(entry,request=False):
  m.mem_write(0x6f000,struct.pack('<HHH',0xf000,0x2000,0x202))
  for reg,value in [(UC_X86_REG_CS,0xf000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,segment),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  if request:
   for reg,value in [(UC_X86_REG_AX,0x8307),(UC_X86_REG_BX,offset),(UC_X86_REG_CX,length),(UC_X86_REG_DX,123)]:m.reg_write(reg,value)
  m.emu_start(0xf0000+entry,0x2f000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf006
 execute(0xa43c,True);assert not m.reg_read(UC_X86_REG_EFLAGS)&1
 for grant in range(length+10):
  if state['masked']:break
  addresses.append((state['page']<<16)|state['address']);state['address']=(state['address']+1)&65535
  terminal=state['count']==0;state['count']=(state['count']-1)&65535
  if terminal:
   state['masked']=True;terminals.append(dict(bytes=len(addresses),biosResidual=struct.unpack('<H',bytes(m.mem_read(0x4d0,2)))[0]));execute(0xa5e6)
 assert state['masked'] and callbacks==[0x91fb]
 crosses=(((segment<<4)+offset)&65535)+length>65536
 assert len(addresses)==length+int(crosses)
 assert addresses==list(range((segment<<4)+offset,(segment<<4)+offset+len(addresses)))
 rows.append(dict(request=dict(segment=segment,offset=offset,length=length),transferred=len(addresses),addresses=addresses,terminals=terminals,callbacks=callbacks,writes=writes))
 print(hex((segment<<4)+offset),'requested',length,'transferred',len(addresses),'terminal segments',len(terminals))
assert hashlib.sha256(a.bios.read_bytes()).hexdigest()==digest
with a.output.open('x') as output:json.dump(dict(biosSha256=digest,scope='Original SL/2 firmware plus explicit 8237 count/address semantics; no CPU-cycle or physical timing claim',rows=rows),output,indent=2)
