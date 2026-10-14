"""Execute original track controller, optionally including the actual MT15 driver.
Ready MPU ports are virtual; elapsed CPU/browser timing is not covered.
"""
import argparse,json,struct,sys,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--legacy-driver',type=Path);p.add_argument('--modern-driver',type=Path)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE,UC_HOOK_INSN
from unicorn.x86_const import *
rows=[]
assert bool(a.legacy_driver)==bool(a.modern_driver),'Supply both driver archives or neither'
for modern,path,code,entry,ds,timers,stride,alternate,driver in [
 (False,a.legacy,0x2edd,0x48a,0x3209,0x847a,72,0x4e06,0x4ddc),
 (True,a.modern,0x2f65,0x4b6,0x32a9,0x8678,76,0x4ee4,0x4eba)]:
 image=path.read_bytes()
 driver_archive=a.modern_driver if modern else a.legacy_driver
 if driver_archive:
  with zipfile.ZipFile(driver_archive) as z:driver_bytes=z.read(next(name for name in z.namelist() if name.upper().split('/')[-1]=='MT15.DRV'))
 for channel in [0,9,15,255]:
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  m.mem_write(ds*16+alternate,b'\x01');m.mem_write(ds*16+driver,struct.pack('<2H',0,0x7000));m.mem_write(ds*16+timers+0x47,bytes([channel]));events=[];writes=[]
  if driver_archive:m.mem_write(0x70000,driver_bytes)
  def hook(uc,address,size,user):
   if address!=0x70015:return
   sp=uc.reg_read(UC_X86_REG_SP);stack=ds*16+sp
   events.append({'entry':address-0x70000,'arguments':list(struct.unpack('<4H',uc.mem_read(stack+4,8)))})
   if driver_archive:return
   ip,cs=struct.unpack('<2H',uc.mem_read(stack,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(ds*16+0xf000,struct.pack('<5H',0x1000,0,0,7,66))
  m.hook_add(UC_HOOK_INSN,lambda uc,port,size,value,user:writes.append([port,value]),None,1,0,UC_X86_INS_OUT)
  m.hook_add(UC_HOOK_INSN,lambda uc,port,size,user:0,None,1,0,UC_X86_INS_IN)
  for reg,value in [(UC_X86_REG_CS,code),(UC_X86_REG_DS,ds),(UC_X86_REG_SS,ds),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(code*16+entry,0x1000,count=10000)
  assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000
  assert events==[{'entry':21,'arguments':[channel,0,7,66]}],events
  if driver_archive:assert writes==[[0x330,0xb0|channel],[0x330,7],[0x330,66]],writes
  rows.append({'engine':'ms-1991' if modern else 'ms-1990','channel':channel,'calls':events})
 assert path.read_bytes()==image
print(json.dumps({'originalTrackControllerCases':len(rows),'driverExplicitlyDoubled':not bool(a.legacy_driver),'readyPortsVirtual':True,'calls':rows,'pass':True}))
