"""Original choice drawing loop; record service requests without hardware output."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('modern',type=Path);p.add_argument('output',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=a.modern.read_bytes();rows=[]
for count in [2,3]:
 for mask in range(1<<count):
  flags=[(mask>>n)&1 for n in range(count)]
  for selected in range(count):
   m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);bp=0xe000
   m.mem_write(0x60000+bp-0x140,bytes([count]));m.mem_write(0x60000+bp-0x1d4,bytes([selected]));m.mem_write(0x60000+bp-0x1c0,b'\xff')
   for at,value in [(bp+0x14,0x5000),(0x3426,0),(0x507a,15),(0x50b0,1)]:m.mem_write(0x60000+at,struct.pack('<H',value))
   m.mem_write(0x65000,struct.pack('<'+'H'*count,*flags))
   for n in range(count):
    m.mem_write(0x90000+n*16,bytes([65+n])+b'\0')
    m.mem_write(0x60000+bp-0x13e+n*4,struct.pack('<2H',n*16,0x9000))
    m.mem_write(0x60000+bp-0x98+n,b'\1')
    m.mem_write(0x60000+bp-0x28+n*2,struct.pack('<H',16));m.mem_write(0x60000+bp-0x1be+n*2,struct.pack('<H',20+n*10))
   colours=[0,0];events=[]
   def hook(machine,address,size,user):
    if address not in (0x198d0+0x1920,0x20e50+0x92b8,0x20e50+0x806d):return
    sp=machine.reg_read(UC_X86_REG_SP)
    if address==0x20e50+0x92b8:colours[:]=struct.unpack('<2H',machine.mem_read(0x60000+sp+4,4))
    elif address==0x20e50+0x806d:events.append(colours[:])
    ip,cs=struct.unpack('<2H',machine.mem_read(0x60000+sp,4));machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
   m.hook_add(UC_HOOK_CODE,hook)
   for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,bp),(UC_X86_REG_SP,0xd000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
   m.emu_start(0x198d0+0x7fb,0x198d0+0x8da,count=10000);assert m.reg_read(UC_X86_REG_IP)==0x8da
   assert len(events)==count
   rows.append({'count':count,'selected':selected,'disabled':flags,'colours':events})
assert a.modern.read_bytes()==image
with a.output.open('x') as out:json.dump(rows,out)
print(json.dumps({'originalColourCases':len(rows),'noGraphicsAudioOrFileServices':True,'sourcesUnchanged':True}))
