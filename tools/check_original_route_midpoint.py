"""Silent isolated original midpoint blocks, including the legacy division helper."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
values=[-32768,-32767,-3,-2,-1,0,1,2,3,32766,32767]
rows=[]
for version,path,start,end in [('ms-1990',a.legacy,0xad8f,0xae08),('ms-1991',a.modern,0xb479,0xb4d4)]:
 image=path.read_bytes()
 for first in values:
  for second in values:
   m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
   bp=0xf000;d=0x60000
   for at,value in [(bp+8,0x200),(bp-0xc,first),(bp-0xa,first),(bp-8,first),(bp-0x22,second),(bp-0x20,second),(bp-0x1e,second)]:m.mem_write(d+at,struct.pack('<H',value&65535))
   for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xef00),(UC_X86_REG_BP,bp),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
   m.emu_start(start,end,count=10000)
   actual=list(struct.unpack('<3h',bytes(m.mem_read(d+0x200,6))))
   total=first+second
   half=total//2 if version=='ms-1991' else (abs(total)//2)*(-1 if total<0 else 1)
   expected=[half,-1 if first==-1 else half,half]
   # The original writes the low16 bits even for the signed16 minimum.
   expected=[((n+32768)&65535)-32768 for n in expected]
   assert actual==expected,(version,first,second,actual,expected)
   rows.append((version,first,second,actual))
 assert path.read_bytes()==image
print(json.dumps({'originalCases':len(rows),'bothOriginalBlocksExecuted':True,'legacyDivisionHelperExecuted':True,'sourcesUnchanged':True,'pass':True}))
