"""Original full duration helper; release driver doubled, caller flags explicit."""
import argparse,sys,struct,itertools,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
needle=bytes.fromhex('8347080183570a00');cases=0
for path,ds,base,stride,driver_field in [(a.legacy,0x3209,0x847a,72,0x4ddc),(a.modern,0x32a9,0x8678,76,0x4eba)]:
 image=path.read_bytes();hits=[i for i in range(len(image)) if image.startswith(needle,i)];assert len(hits)==1
 entry=hits[0]-15;assert image[entry:entry+3]==bytes.fromhex('558bec')
 for remaining,elapsed,owner,flag in itertools.product([0,1,65535,65536,4294967295],[0,4294967295],[0,16],[0,1]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);d=ds*16
  record=bytearray(46);record[0]=owner;record[1]=1;record[22]=1;record[44]=2
  struct.pack_into('<II',record,8,elapsed,remaining);m.mem_write(d+0xe000,bytes(record))
  m.mem_write(d+base+owner*stride+0x25,bytes([flag]));m.mem_write(d+driver_field,struct.pack('<2H',0x100,0x7000))
  events=[]
  def release(uc,address,size,user):
   if address!=0x7010c:return
   sp=uc.reg_read(UC_X86_REG_SP);assert struct.unpack('<2H',uc.mem_read(d+sp+4,4))==(2,0xe000)
   events.append(struct.unpack('<I',uc.mem_read(d+0xe00c,4))[0])
   ip,seg=struct.unpack('<2H',uc.mem_read(d+sp,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,seg);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,release);m.mem_write(d+0xf000,struct.pack('<3H',0x1000,0,0xe000))
  for reg,value in [(UC_X86_REG_CS,entry>>4),(UC_X86_REG_IP,entry&15),(UC_X86_REG_DS,ds),(UC_X86_REG_SS,ds),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(entry,0x1000,count=1000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  after=bytes(m.mem_read(d+0xe000,46))
  assert struct.unpack_from('<I',after,8)[0]==(elapsed+1)&4294967295
  expected=(remaining-1)&4294967295 if path==a.legacy or remaining else 0
  assert struct.unpack_from('<I',after,12)[0]==expected
  assert events==([expected] if remaining==0 else [])
  assert after[1]==(2 if remaining==0 else 1)
  assert after[22]==((3 if flag else 4) if remaining==0 else 1)
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalDurationCases':cases,'legacyZeroWraps':True,'modernZeroRemainsZero':True,'positiveDurationsDecrement':True,'elapsedWraps':True,'releaseCallbackDoubled':True,'sourceUnchanged':True,'pass':True}))
