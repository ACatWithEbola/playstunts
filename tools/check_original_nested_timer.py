"""Original complete timer IRQ with reentry guard and explicit callback double."""
import argparse,sys,struct,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
for path,entry,cs,ds,delta in [(a.legacy,0x222e3,0x209e,0x3209,0),(a.modern,0x22755,0x20e5,0x32a9,0xae)]:
 image=path.read_bytes();digest=hashlib.sha256(image).hexdigest();base=ds*16
 cases=0
 for guard,present,disabled,nesting in [(guard,present,disabled,nesting)for guard in [0,1]for present in [False,True]for disabled in [False,True]for nesting in [0,32767,65535]]:
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  m.mem_write(base+0x407a+delta,struct.pack('<I',20));m.mem_write(base+0x407e+delta,struct.pack('<I',10))
  for offset,value in [(0x4086,5),(0x4088,5),(0x408a,0),(0x408c,nesting),(0x4094,0)]:m.mem_write(base+offset+delta,struct.pack('<H',value))
  for offset,value in [(0x4083,0),(0x408e,guard),(0x4090,int(disabled))]:m.mem_write(base+offset+delta,bytes([value]))
  if present:
   m.mem_write(base+0x4092+delta,struct.pack('<4H',0x100,0x7000,0,0))
   m.mem_write(0x70100,bytes([0xb0,0x5a,0xe6,0x80,0xcb]))
  m.mem_write(0x6f000,struct.pack('<HHH',0x1000,0,0x202))
  ports=[]
  m.hook_add(UC_HOOK_INSN,lambda cpu,port,size,value,user:ports.append([port,value]),None,1,0,UC_X86_INS_OUT)
  m.hook_add(UC_HOOK_INSN,lambda cpu,port,size,user:0,None,1,0,UC_X86_INS_IN)
  for reg,value in [(UC_X86_REG_CS,cs),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(entry,0x1000,count=10000)
  assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_SP)==0xf006
  callback=struct.unpack('<I',m.mem_read(base+0x407a+delta,4))[0]
  countdown=struct.unpack('<H',m.mem_read(base+0x4088+delta,2))[0]
  assert callback==(20 if disabled else 21) and countdown==4
  assert bytes(m.mem_read(base+0x408e+delta,1))==bytes([0 if disabled else guard])
  next_nesting=0 if disabled else ((nesting+1)&65535 if guard else 0)
  signed=next_nesting if next_nesting<32768 else next_nesting-65536
  high=next_nesting if guard and not disabled and signed>0 else 0
  assert struct.unpack('<H',m.mem_read(base+0x408c+delta,2))[0]==next_nesting,(guard,present,disabled,nesting,struct.unpack('<H',m.mem_read(base+0x408c+delta,2))[0])
  assert struct.unpack('<H',m.mem_read(base+0x408a+delta,2))[0]==high
  assert ([0x80,0x5a]in ports)==(present and not guard and not disabled)
  cases+=1
 assert hashlib.sha256(path.read_bytes()).hexdigest()==digest
 print(path.name,cases,'original IRQ guard/registration/disable/overflow cases passed')
print('Both complete original IRQ bodies advance hardware counters under reentry guard and skip registered callbacks while guarded; callback body explicitly doubled, images unchanged')
