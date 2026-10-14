"""Original hover/shortcut/accept/cancel/navigation iteration, device services doubled."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('modern',type=Path);p.add_argument('output',type=Path);p.add_argument('--libraries',type=Path,required=True)
p.add_argument('--expanded',action='store_true',help='Cover larger menus with representative disabled-choice patterns')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=a.modern.read_bytes();rows=[]
for count in ([1,4,5,6,7,8,10] if a.expanded else [2,3]):
 masks=sorted({0,1,1<<(count-1),sum(1<<i for i in range(0,count,2)),((1<<count)-1)^1}-{(1<<count)-1}) if a.expanded else range((1<<count)-1)
 for mask in masks:
  flags=[(mask>>n)&1 for n in range(count)]
  for selected,hover,key in itertools.product(range(count),range(-1,count),[0,13,32,27,89,121,78,110,0x4800,0x5000]):
   m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);bp=0xe000
   for at,value in [(-0x1d4,selected),(-0x140,count),(-0x84,1)]:m.mem_write(0x60000+bp+at,bytes([value]))
   for at,value in [(-0x142,key),(-0x1c8,121),(-0x1cc,110),(0x14,0x5000)]:m.mem_write(0x60000+bp+at,struct.pack('<H',value))
   m.mem_write(0x65000,struct.pack('<'+'H'*count,*flags))
   for code in range(65,91):m.mem_write(0x6384f+code,b'\1')
   def hook(machine,address,size,user):
    if address!=0x198d0+0x1a4e:return
    sp=machine.reg_read(UC_X86_REG_SP);ip,cs=struct.unpack('<2H',machine.mem_read(0x60000+sp,4))
    machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
   m.hook_add(UC_HOOK_CODE,hook)
   for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,bp),(UC_X86_REG_SP,0xd000),(UC_X86_REG_AX,hover&65535),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
   m.emu_start(0x198d0+0x921,0x198d0+0x7f1,count=1000)
   assert m.reg_read(UC_X86_REG_IP)==0x7f1
   value=m.mem_read(0x60000+bp-0x1d4,1)[0]
   rows.append({'input':{'count':count,'selected':selected,'hover':hover,'key':key,'disabled':flags,'shortcuts':[121,110],'physicsEngine':'ms-1991'},
    'expected':{'selected':value if value<128 else value-256,'done':m.mem_read(0x60000+bp-0x84,1)[0]==0}})
assert a.modern.read_bytes()==image
with a.output.open('x') as out:json.dump(rows,out)
print(json.dumps({'originalInputCases':len(rows),'noGraphicsAudioOrFileServices':True,'sourcesUnchanged':True}))
