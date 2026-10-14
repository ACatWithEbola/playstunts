"""Original modern TD15 idle lifecycle corpus, virtual ports only."""
import argparse,sys,zipfile,random,struct,json,hashlib,base64
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('package',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN,UC_HOOK_INTR
from unicorn.x86_const import *
digest=hashlib.sha256(a.package.read_bytes()).hexdigest()
with zipfile.ZipFile(a.package) as z:driver=z.read(next(n for n in z.namelist() if n.upper().endswith('TD15.DRV')))
legacy=len(driver)==2993
assert hashlib.sha256(driver).hexdigest()==('38c79e87a697f6cfa89169c64fb4a4dde742abdb39fc0589f9dd843a0e4b3de9' if legacy else '45baeedce5368fc07aea9f1e0ecd444fe5e943cc2730db2efe235d5fa561ca24')
r=random.Random(19910225);rows=[]
for case in range(512):
 state=bytearray(driver)
 if legacy:state[0x504]=r.randrange(3)
 else:state[0x595]=0;state[0x5a6]=r.randrange(256);state[0x582]=r.randrange(256);struct.pack_into('<H',state,0x57e,r.randrange(65536))
 action=['initialize','silence','shutdown','stop'][case%4];channel=(case//4)%6;port61=r.randrange(256);writes=[];events=[];vector=bytes([0x34,0x12,0x78,0x56])
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,bytes(state));m.mem_write(0x54,vector);m.mem_write(0x6f000,struct.pack('<3H',0xf000,0x2000,channel))
 def out(machine,port,size,value,user):writes.append([port,value]);events.append(dict(kind='write',port=port,value=value))
 def inp(machine,port,size,user):assert port==0x61;return port61
 bios=[]
 def interrupt(machine,number,user):
  if number==0x1a:
   bios.append({key:machine.reg_read(reg) for key,reg in [('ax',UC_X86_REG_AX),('es',UC_X86_REG_ES),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX)]});events.append(dict(kind='bios',request=bios[-1].copy()));return
  assert number==0x21
  ax=machine.reg_read(UC_X86_REG_AX)
  if ax==0x3515:machine.reg_write(UC_X86_REG_BX,0x1234);machine.reg_write(UC_X86_REG_ES,0x5678)
  else:
   assert ax==0x2515
   machine.mem_write(0x54,struct.pack('<HH',machine.reg_read(UC_X86_REG_DX),machine.reg_read(UC_X86_REG_DS)))
 m.hook_add(UC_HOOK_INTR,interrupt)
 m.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
 for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
 entry=({'initialize':0x579,'silence':0x5d4,'shutdown':0x5c2,'stop':0x71c} if legacy else {'initialize':0x612,'silence':0x647,'shutdown':0x642,'stop':0x793})[action]
 m.emu_start(0x20000+entry,0x2f000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 if not legacy:assert bytes(m.mem_read(0x54,4))==vector
 rows.append(dict(action=action,channel=channel,port61=port61,before=base64.b64encode(state).decode(),after=base64.b64encode(bytes(m.mem_read(0x20000,len(driver)))).decode(),writes=writes))
 rows[-1].update(legacy=legacy,bios=bios,vector=list(m.mem_read(0x54,4)),events=events)
assert digest==hashlib.sha256(a.package.read_bytes()).hexdigest()
with a.output.open('x') as f:json.dump(rows,f)
print('512 original '+('legacy' if legacy else 'modern')+' TD15 idle lifecycle cases captured; full driver/ports,BIOS/vector behavior; no hardware sound')
