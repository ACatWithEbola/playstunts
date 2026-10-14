"""Original duration gate and ordered cause4 request, before recording tail."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=a.image.read_bytes();assert image[0x14c3f:0x14c46]==bytes.fromhex('b8dc05f72edc96')
rows=[]
for rate in [10,20]:
 for count in [0,1,599,600,11999,14999,15000,15001,29999,30000,30001,32767,32768,65534,65535]:
  for adjustment in [0,1,299,300,599,600,15000,30000,32768,65535]:
   m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);events=[];allowed=[False]
   for at,value in [(0x96dc,rate),(0x7a12,count),(0xa728,adjustment)]:m.mem_write(0x60000+at,struct.pack('<H',value))
   m.mem_write(0x696e6,b'\x00')
   def hook(machine,address,size,user):
    if address==0x14c64:allowed[0]=True;machine.emu_stop();return
    sp=machine.reg_read(UC_X86_REG_SP);cause,car=struct.unpack('<2H',bytes(machine.mem_read(0x60000+sp+4,4)));events.append({'cause':cause,'car':car})
    ip,cs=struct.unpack('<2H',bytes(machine.mem_read(0x60000+sp,4)))
    for reg,val in [(UC_X86_REG_SP,sp+4),(UC_X86_REG_CS,cs),(UC_X86_REG_IP,ip)]:machine.reg_write(reg,val)
   for address in [0x14c64,0xba32]:m.hook_add(UC_HOOK_CODE,hook,begin=address,end=address)
   m.mem_write(0x6f000,struct.pack('<3H',0,0x1000,0))
   for reg,val in [(UC_X86_REG_CS,0x105c),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,0xf000),(UC_X86_REG_SP,0xeff2),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,val)
   m.emu_start(0x14c3f,0x1000,count=1000)
   rows.append({'rate':rate,'count':count,'adjustment':adjustment,'allowed':allowed[0],'done':m.mem_read(0x696e6,1)[0],'events':events})
with a.output.open('x') as out:json.dump(rows,out)
assert a.image.read_bytes()==image
print(json.dumps({'originalLimitCases':len(rows),'sourceUnchanged':True}))
