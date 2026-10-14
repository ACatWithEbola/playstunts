"""Execute original release callback and report voice mutations; ready MPU fixture."""
import argparse,sys,struct,zipfile,json,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
for path in [a.legacy,a.modern]:
 digest=hashlib.sha256(path.read_bytes()).digest()
 with zipfile.ZipFile(path) as archive:driver=archive.read(next(n for n in archive.namelist() if n.upper().split('/')[-1]=='MT15.DRV'))
 for remaining in [0,1,65535,4294967295]:
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,driver)
  before=bytearray(46);before[0]=2;before[1]=2;before[6]=61;struct.pack_into('<I',before,12,remaining)
  m.mem_write(0x60100,bytes(before));m.mem_write(0x6f000,struct.pack('<7H',0,0x5000,2,0x100,0x200,0,0))
  writes=[]
  m.hook_add(UC_HOOK_INSN,lambda uc,port,size,value,user:writes.append([port,value]),None,1,0,UC_X86_INS_OUT)
  m.hook_add(UC_HOOK_INSN,lambda uc,port,size,user:0,None,1,0,UC_X86_INS_IN)
  for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0x2000c,0x50000,count=10000)
  assert m.reg_read(UC_X86_REG_SP)==0xf004
  after=bytes(m.mem_read(0x60100,46))
  assert writes==[[0x330,0x82],[0x330,61],[0x330,0]],writes
  print(json.dumps({'archive':path.name,'remaining':remaining,'changes':[[i,before[i],after[i]] for i in range(46) if before[i]!=after[i]],'remainingAfter':struct.unpack_from('<I',after,12)[0]}))
 assert hashlib.sha256(path.read_bytes()).digest()==digest
