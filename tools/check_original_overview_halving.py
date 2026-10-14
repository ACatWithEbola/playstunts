"""Execute original overview half-coordinate instructions for every signed word."""
import argparse,json,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_AX,UC_X86_REG_DX,UC_X86_REG_CS,UC_X86_REG_IP
rows=[]
for path,starts,code in [(a.legacy,[0xe98e,0xe99c,0xe9b4,0xea95,0xeaa2,0xeab5,0xeb6e,0xeb7c,0xeb8b],'992bc2d1f8'),(a.modern,[0xf1ac,0xf1b7,0xf1cc,0xf2a6,0xf2b0,0xf2c0,0xf370,0xf37b,0xf387],'d1f8')]:
 image=path.read_bytes();expected=bytes.fromhex(code)
 for start in starts:assert image[start:start+len(expected)]==expected,hex(start)
for engine,path,start,end,expected_bytes in [('ms-1990',a.legacy,0xe98e,0xe993,'992bc2d1f8'),('ms-1991',a.modern,0xf1ac,0xf1ae,'d1f8')]:
 image=path.read_bytes();assert image[start:end]==bytes.fromhex(expected_bytes)
 u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image);u.reg_write(UC_X86_REG_CS,0)
 for value in range(-32768,32768):
  u.reg_write(UC_X86_REG_AX,value&65535);u.reg_write(UC_X86_REG_DX,0x1234)
  u.emu_start(start,end,count=4);assert u.reg_read(UC_X86_REG_IP)==end
  result=u.reg_read(UC_X86_REG_AX);result=result-65536 if result&32768 else result
  expected=value//2 if engine=='ms-1991'else int(value/2)
  assert result==expected,(engine,value,result,expected)
 assert path.read_bytes()==image
 rows.append({'engine':engine,'values':65536,'start':hex(start),'endExclusive':hex(end),'pass':True})
print(json.dumps({'rows':rows,'originalExecutions':131072,'identicalInstructionSitesChecked':18,'sourceUnchanged':True}))
