"""Exhaust original isolated quarter-scaling words; no calls, state or audio."""
import argparse,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--shift',type=int,choices=[2,8],default=2);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
machines=[]
regions=[(a.legacy,0x7550,0x755e),(a.modern,0x7585,0x7589)] if a.shift==2 else [(a.legacy,0x7c05,0x7c13),(a.modern,0x7c19,0x7c1d)]
for path,start,end in regions:
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,path.read_bytes());m.reg_write(UC_X86_REG_CS,0);machines.append((m,start,end))
exceptions=[];differences=0
for word in range(65536):
 signed=word if word<32768 else word-65536;values=[]
 for index,(m,start,end) in enumerate(machines):
  m.reg_write(UC_X86_REG_AX,word);m.emu_start(start,end,count=20)
  result=m.reg_read(UC_X86_REG_AX);result=result if result<32768 else result-65536;values.append(result)
  expected=int(signed/(2**a.shift)) if index==0 else signed>>a.shift
  if result!=expected:exceptions.append((index,signed,result,expected))
 differences+=values[0]!=values[1]
edge=32768>>a.shift
assert exceptions==[(0,-32768,edge,-edge)],exceptions
assert differences==(24577 if a.shift==2 else 32641),differences
print(f'All65536 words per engine checked at shift{a.shift}: legacy truncation has one original overflow exception (-32768→{edge}); modern signed shift exact;{differences} differing inputs')
