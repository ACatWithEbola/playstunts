"""Execute original E2/E3 sequencer branches; no callback/driver doubles."""
import argparse,sys,struct,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0;locations=[]
for path,segment in [(a.legacy,0x2edd),(a.modern,0x2f65)]:
 image=path.read_bytes()
 for opcode,needle,length in [(0xe2,bytes.fromhex('8b5efc8b078b57028b773281e6ff00'),46),(0xe3,bytes.fromhex('8b5efc807f32007503e9'),54)]:
  matches=[i for i in range(len(image)) if image.startswith(needle,i)]
  assert len(matches)==1,(path,opcode,matches)
  start=matches[0];locations.append({'edition':path.name,'opcode':opcode,'physical':hex(start)})
  assert segment*16<=start<segment*16+65536
  for depth in (range(4) if opcode==0xe2 else range(5)):
   for argument in [0,1,127,255]:
    size=76 if segment==0x2f65 else 72
    timer=bytearray([0xa5]*size);timer[50]=depth;struct.pack_into('<I',timer,0,0x80001234)
    expected=timer.copy()
    if opcode==0xe2:
     struct.pack_into('<I',expected,51+4*depth,0x80001234);expected[67+depth]=(argument-1)&255;expected[50]+=1
    elif depth:
     struct.pack_into('<I',timer,47+4*depth,0x80005678);timer[66+depth]=argument;expected=timer.copy()
     struct.pack_into('<I',expected,0,0x80005678);expected[66+depth]=(argument-1)&255
     if argument==0:expected[50]-=1
    m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60100,bytes(timer))
    m.mem_write(0x6effc,struct.pack('<H',0x100));m.mem_write(0x6effe,bytes([argument]))
    for reg,value in [(UC_X86_REG_CS,segment),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,0xf000),(UC_X86_REG_SP,0xee00)]:m.reg_write(reg,value)
    visited=[]
    def hook(uc,address,size,user):
     if not start<=address<start+length:uc.emu_stop();return
     visited.append(address)
    m.hook_add(UC_HOOK_CODE,hook);m.emu_start(start,0x100000,count=100)
    assert visited and bytes(m.mem_read(0x60100,size))==bytes(expected),(path,opcode,depth,argument)
    cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalBranchCases':cases,'locations':locations,'completeTimerRecordsCompared':True,'loopPointersAndCountersNotCallbacks':True,'noDriverHardwareOrLiveData':True,'pass':True}))
