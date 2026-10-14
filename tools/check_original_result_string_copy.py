"""Both result resource-string copies with disjoint caller buffers and wrapped offsets."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
cases=0
for path,start in [(a.legacy,0x1540),(a.modern,0x1640)]:
 image=path.read_bytes()
 for offset,length in itertools.product([0x1000,0xfffc,0xffff],[1,4,63]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  text=bytes(65+i%26 for i in range(length))+b'\0'
  for index,value in enumerate(text):m.mem_write(0x90000+((offset+index)&65535),bytes([value]))
  m.mem_write(0x6f000,struct.pack('<5H',0x1000,0,0x5000,offset,0x9000))
  for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x7000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(0x198d0+start,0x1000,count=10000)
  assert bytes(m.mem_read(0x65000,len(text)))==text
  assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_ES)==0x9000
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalStringCopyCases':cases,'wrappedSourceOffsets':True,'outputAndRetainedSegmentMatch':True,'sourcesUnchanged':True,'pass':True}))
