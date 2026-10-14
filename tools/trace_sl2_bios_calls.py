"""Execute authentic bounded SL/2 sound BIOS calls with explicit virtual ports.
Unicorn instruction/IF trace is not a CPU cycle measurement or automatic DMA.
"""
import argparse,hashlib,json,struct
from pathlib import Path
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE,UC_HOOK_INSN
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('bios',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
bios=a.bios.read_bytes();digest=hashlib.sha256(bios).hexdigest();assert digest=='a3a79791ed4ca85c4206412a2138ca8587e616dad2282a22812ccd6eac6c3c71'
rows=[]
for name,ax,cx,dx,remaining,page,count,segment,offset in [
 ('status-idle',0x8100,0,0,0,255,65535,0x3000,0x100),
 ('status-busy-length',0x8100,0,0,1,0x30,65535,0x3000,0x100),
 ('status-busy-dma',0x8100,0,0,0,0x30,0,0x3000,0x100),
 ('status-terminal-count',0x8100,0,0,0,0x30,65535,0x3000,0x100),
 ('play-silent-one',0x8300,1,1,0,255,65535,0x3000,0x100),
 ('play-cross-boundary',0x8307,2,123,0,255,65535,0x3fff,15),
]:
 machine=Uc(UC_ARCH_X86,UC_MODE_16);machine.mem_map(0,0x100000);machine.mem_write(0xf0000,bios)
 machine.mem_write(0x4d0,struct.pack('<H',remaining));machine.mem_write(0x4d4,bytes([page]));machine.mem_write(0x3c,struct.pack('<HH',0xf000,0x2000))
 machine.mem_write(0x6f000,struct.pack('<HHH',0xf000,0x2000,0x202))
 ports={0x21:255,0xc4:0};writes=[];reads=[];instructions=[];flip=0
 def out(cpu,port,size,value,_):
  global flip
  assert size==1;writes.append([port,value]);ports[port]=value
  if port==0xc:flip=0
 def inp(cpu,port,size,_):
  global flip
  assert size==1
  if port==3:value=(count>>(flip*8))&255;flip^=1
  else:value=ports.get(port,0)
  reads.append([port,value]);return value
 def code(cpu,address,size,_):instructions.append(dict(offset=address-0xf0000,ifEnabled=bool(cpu.reg_read(UC_X86_REG_EFLAGS)&0x200)))
 machine.hook_add(UC_HOOK_CODE,code);machine.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);machine.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
 for reg,value in [(UC_X86_REG_CS,0xf000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,segment),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_AX,ax),(UC_X86_REG_BX,offset),(UC_X86_REG_CX,cx),(UC_X86_REG_DX,dx),(UC_X86_REG_EFLAGS,2)]:machine.reg_write(reg,value)
 machine.emu_start(0xfa43c,0x2f000,count=10000)
 assert machine.reg_read(UC_X86_REG_SP)==0xf006
 result=dict(ax=machine.reg_read(UC_X86_REG_AX),carry=bool(machine.reg_read(UC_X86_REG_EFLAGS)&1),ifEnabled=bool(machine.reg_read(UC_X86_REG_EFLAGS)&0x200))
 assert result['carry']==(name in ['status-busy-length','status-busy-dma'])
 if name.startswith('status'):assert result['ax']==0xc4
 if name=='play-silent-one':assert [0xc6,1] in writes and [0xc7,0] in writes and [0xa,1] in writes
 if name=='play-cross-boundary':assert struct.unpack('<H',bytes(machine.mem_read(0x4d0,2)))[0]==1
 rows.append(dict(name=name,input=dict(ax=ax,cx=cx,dx=dx,biosRemaining=remaining,dmaPage=page,dmaCount=count,segment=segment,offset=offset),result=result,writes=writes,reads=reads,instructions=instructions,bdaAfter=bytes(machine.mem_read(0x4d0,10)).hex()))
 print(name,result,len(instructions),'executed BIOS instructions')
assert hashlib.sha256(a.bios.read_bytes()).hexdigest()==digest
with a.output.open('x') as output:json.dump(dict(biosSha256=digest,entry=0xa43c,scope='Original firmware, explicit virtual ports; no CPU-cycle or autonomous DMA timing claim',rows=rows),output,indent=2)
