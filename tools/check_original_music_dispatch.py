"""Original full music timer loop; release/sequence bodies traced, not executed."""
import argparse,sys,struct,json,itertools
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0
for path,cs,ds,entry,accumulator,interval,tracks in [(a.legacy,0x2edd,0x3209,0x5a,0x97b8,0x9f2a,0x8d3e),(a.modern,0x2f65,0x32a9,0x56,0x9a50,0xa1c2,0x8f9c)]:
 image=path.read_bytes();start=cs*16+entry
 calls=[i for i in range(start,start+76) if image.startswith(bytes.fromhex('0ee8'),i)]
 assert len(calls)==2
 sequence,release=[i+4+struct.unpack_from('<h',image,i+2)[0] for i in calls]
 for old,rate,count in itertools.product([0,127,65500],[64,128,256,65535],[0,1,4,6,7]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  m.mem_write(ds*16+accumulator,struct.pack('<H',old));m.mem_write(ds*16+interval,struct.pack('<H',rate));m.mem_write(ds*16+tracks,bytes([count]));events=[]
  def hook(uc,address,size,user):
   if address not in [sequence,release]:return
   sp=uc.reg_read(UC_X86_REG_SP);stack=ds*16+sp
   events.append(('sequence',struct.unpack('<H',uc.mem_read(stack+4,2))[0]) if address==sequence else ('release',))
   ip,seg=struct.unpack('<2H',uc.mem_read(stack,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,seg);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(ds*16+0xf000,struct.pack('<2H',0x1000,0))
  for reg,value in [(UC_X86_REG_CS,cs),(UC_X86_REG_DS,ds),(UC_X86_REG_SS,ds),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(start,0x1000,count=100000)
  assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000
  value=(old+128)&65535;expected=[]
  while value>=rate:
   expected.append(('release',));value-=rate;expected.extend(('sequence',i) for i in range(count))
  assert events==expected,(path,old,rate,count,events,expected)
  assert struct.unpack('<H',m.mem_read(ds*16+accumulator,2))[0]==value
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalDispatchCases':cases,'completeTimerLoopExecuted':True,'onlyActiveTrackIndicesDispatched':True,'releaseAndSequenceBodiesExplicitlyDoubled':True,'noHardwareOrLiveData':True,'pass':True}))
