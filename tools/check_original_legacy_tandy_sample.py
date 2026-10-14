"""Legacy B33 sample start with explicitly injected AE7 completion, not latency."""
import argparse,sys,zipfile,struct,json,hashlib,base64
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('package',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INTR
from unicorn.x86_const import *
digest=hashlib.sha256(a.package.read_bytes()).hexdigest()
with zipfile.ZipFile(a.package) as z:driver=z.read(next(n for n in z.namelist() if n.upper().endswith('TD15.DRV')))
assert hashlib.sha256(driver).hexdigest()=='38c79e87a697f6cfa89169c64fb4a4dde742abdb39fc0589f9dd843a0e4b3de9'
rows=[]
for active in [0,1,2]:
 for old_repeat in [0,1,2]:
  for length in [0,6]:
   for rate in [100,200,8000,65535]:
    state=bytearray(driver);state[0x504]=active;state[0x505]=old_repeat;state[0x50e]=7;state[0x516]=14
    for at,value in [(0x506,0x200),(0x508,0x4000),(0x50a,3),(0x50c,16)]:struct.pack_into('<H',state,at,value)
    m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,bytes(state));m.mem_write(0x30108,struct.pack('<H',length));m.mem_write(0x6f000,struct.pack('<7H',0xf000,0x2000,0,0x100,0x3000,rate,1));bios=[];boundaries=[];completion_bios=[]
    def interrupt(cpu,number,user):
     assert number==0x1a
     bios.append({key:cpu.reg_read(reg) for key,reg in [('ax',UC_X86_REG_AX),('es',UC_X86_REG_ES),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX)]});boundaries.append(base64.b64encode(bytes(cpu.mem_read(0x20000,len(driver)))).decode())
     if len(bios)!=1 or active!=1:return
     irq=Uc(UC_ARCH_X86,UC_MODE_16);irq.mem_map(0,0x100000);irq.mem_write(0,bytes(cpu.mem_read(0,0x100000)));irq.mem_write(0x6e000,struct.pack('<HHH',0xf000,0x2000,0x202))
     def nested(machine,number,user):
      assert number==0x1a
      completion_bios.append({key:machine.reg_read(reg) for key,reg in [('ax',UC_X86_REG_AX),('es',UC_X86_REG_ES),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX)]})
     irq.hook_add(UC_HOOK_INTR,nested)
     for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_AX,0x91fb)]:irq.reg_write(reg,value)
     irq.emu_start(0x20ae7,0x2f000,count=10000);assert irq.reg_read(UC_X86_REG_SP)==0xe006;cpu.mem_write(0x20000,bytes(irq.mem_read(0x20000,len(driver))))
    m.hook_add(UC_HOOK_INTR,interrupt)
    for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
    m.emu_start(0x20b33,0x2f000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
    rows.append(dict(active=active,oldRepeat=old_repeat,sample=dict(offset=0x100,segment=0x3000,length=length),rate=rate,repeats=1,before=base64.b64encode(state).decode(),after=base64.b64encode(bytes(m.mem_read(0x20000,len(driver)))).decode(),bios=bios,boundaries=boundaries,completionBios=completion_bios))
assert digest==hashlib.sha256(a.package.read_bytes()).hexdigest()
with a.output.open('x') as f:json.dump(rows,f)
print(str(len(rows))+' original legacy sample-start cases with per-BIOS state and explicit completion; archive unchanged')
