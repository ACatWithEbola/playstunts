"""Original SL/2 DMA IRQ execution with explicitly supplied terminal state.
Port/IF ordering only; no CPU-cycle or autonomous DMA timing claim.
"""
import argparse,hashlib,json,struct
from pathlib import Path
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE,UC_HOOK_INSN,UC_HOOK_INTR
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('bios',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
rom=a.bios.read_bytes();digest=hashlib.sha256(rom).hexdigest();assert digest=='a3a79791ed4ca85c4206412a2138ca8587e616dad2282a22812ccd6eac6c3c71'
rows=[]
for remaining in [0,1,17]:
 machine=Uc(UC_ARCH_X86,UC_MODE_16);machine.mem_map(0,0x100000);machine.mem_write(0xf0000,rom)
 machine.mem_write(0x4d0,struct.pack('<HHBBHH',remaining,0xf07b,0x30,255,0x1234,0x5678));machine.mem_write(0x3c,struct.pack('<HH',0xa5e6,0xf000))
 machine.mem_write(0x6f000,struct.pack('<HHH',0xf000,0x2000,0x202))
 ports={0xc4:0x1f};writes=[];callbacks=[];instructions=[]
 def out(cpu,port,size,value,_):assert size==1;writes.append([port,value]);ports[port]=value
 def inp(cpu,port,size,_):assert size==1;return ports.get(port,0)
 def code(cpu,address,size,_):instructions.append(dict(offset=address-0xf0000,ifEnabled=bool(cpu.reg_read(UC_X86_REG_EFLAGS)&0x200)))
 def interrupt(cpu,number,_):assert number==0x15;callbacks.append(dict(ax=cpu.reg_read(UC_X86_REG_AX),irqVector=bytes(cpu.mem_read(0x3c,4)).hex(),instructionCount=len(instructions),writesBefore=len(writes)))
 machine.hook_add(UC_HOOK_CODE,code);machine.hook_add(UC_HOOK_INTR,interrupt);machine.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);machine.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
 for reg,value in [(UC_X86_REG_CS,0xf000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x3000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:machine.reg_write(reg,value)
 machine.emu_start(0xfa5e6,0x2f000,count=10000);assert machine.reg_read(UC_X86_REG_SP)==0xf006
 assert writes[-1]==[0x20,0x20]
 if remaining==0:
  assert len(callbacks)==1 and callbacks[0]['ax']==0x91fb
  assert callbacks[0]['irqVector']==struct.pack('<HH',0x1234,0x5678).hex()
 else:
  assert callbacks==[] and bytes(machine.mem_read(0x4d4,1))==bytes([0x31])
  assert [0xa,1] in writes
 dmaCountWrites=[value for port,value in writes if port==3]
 rows.append(dict(remaining=remaining,writes=writes,dmaCountWrites=dmaCountWrites,callbacks=callbacks,instructions=instructions,bdaAfter=bytes(machine.mem_read(0x4d0,10)).hex(),returnIf=bool(machine.reg_read(UC_X86_REG_EFLAGS)&0x200)))
 print('remaining',remaining,'callbacks',len(callbacks),'DMA count bytes',dmaCountWrites,'instructions',len(instructions))
assert hashlib.sha256(a.bios.read_bytes()).hexdigest()==digest
with a.output.open('x') as output:json.dump(dict(biosSha256=digest,entry=0xa5e6,scope='Original BIOS IRQ, terminal state/ports supplied; not autonomous CPU/DMA timing',rows=rows),output,indent=2)
