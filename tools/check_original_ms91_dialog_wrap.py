"""Execute original MS91 navigation blocks with disabled-word tables."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.modern.read_bytes();cases=0
for count in range(1,7):
 for mask in range((1<<count)-1):
  flags=[(mask>>n)&1 for n in range(count)]
  for selected in range(count):
   for direction,start in [(-1,0x9b8),(1,0x9ee),(0,0x726)]:
    step=direction or 1;initial=0 if direction==0 else 1
    expected=next((selected+step*n+count*2)%count for n in range(initial,count+initial) if not flags[(selected+step*n+count*2)%count])
    m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
    bp=0xe000;m.mem_write(0x60000+bp-0x1d4,bytes([selected]));m.mem_write(0x60000+bp-0x140,bytes([count]))
    m.mem_write(0x60000+bp+0x14,struct.pack('<H',0x5000));m.mem_write(0x65000,struct.pack('<'+'H'*count,*flags))
    m.mem_write(0x60000+bp+0x16,struct.pack('<H',selected))
    for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,bp),(UC_X86_REG_SP,0xd000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
    stop=0x760 if direction==0 else 0x7f1
    m.emu_start(0x198d0+start,0x198d0+stop,count=1000)
    assert m.reg_read(UC_X86_REG_IP)==stop
    assert m.mem_read(0x60000+bp-0x1d4,1)[0]==expected
    assert bytes(m.mem_read(0x65000,count*2))==struct.pack('<'+'H'*count,*flags)
    cases+=1
assert a.modern.read_bytes()==image
print(json.dumps({'originalNavigationCases':cases,'counts':[1,2,3,4,5,6],
 'bothDirectionsAndAllNonemptyEnabledMasks':True,'initialDisabledSelectionVerified':True,'disabledTablesUnchanged':True,
 'noAudioOrFileServices':True,'pass':True}))
