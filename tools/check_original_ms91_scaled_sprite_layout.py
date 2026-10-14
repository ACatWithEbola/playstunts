"""Read-only original MS91 EGA scaling preparation, before any hardware drawing."""
import json,struct,sys
from pathlib import Path
sys.path.insert(0,sys.argv[2])
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,Path(sys.argv[1]).read_bytes())
visible=False
def stop(uc,address,size,user):
 global visible
 if address==0x2a0df:visible=True;uc.emu_stop()
 elif address==0x1f000:uc.emu_stop()
u.hook_add(UC_HOOK_CODE,stop);rows=[]
for scale in [2,64,128,255,256,384,512,768]:
 for x in [0,7,8,169]:
  for y in [0,80]:
   for clip in [[0,320,0,200],[169,174,75,86]]:
    data=bytearray(65536);sprite=bytearray(128);struct.pack_into('<6H',sprite,0,12,9,6,4,0,17)
    u.mem_write(0x60000,bytes(data));u.mem_write(0x90000,bytes(sprite))
    for at,value in [(0x92b4,clip[0]),(0x92b6,clip[1]),(0x92aa,clip[2]),(0x92ac,clip[3]),(0x92ae,40)]:u.mem_write(0x20e50+at,struct.pack('<H',value))
    u.mem_write(0x6e000,struct.pack('<7H',0xf000,0x1000,scale,0,0x9000,x,y));visible=False
    for reg,value in [(UC_X86_REG_CS,0x20e5),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_ES,0xa000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_BP,0xf000),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
    u.emu_start(0x29f70,0x100000,count=100000)
    result=None
    if visible:
     bp=u.reg_read(UC_X86_REG_BP)
     word=lambda offset:struct.unpack('<H',bytes(u.mem_read(0x60000+bp+offset,2)))[0]
     result=dict(x=word(-2),y=word(-4),width=word(-6),height=word(-8),originalWidth=word(-10),cursor=word(-14),step=word(-16),fractionY=word(-18),fractionX=word(-20),phase=word(-22)>>4)
    rows.append(dict(scale=scale,x=x,y=y,clip=clip,result=result))
print(json.dumps(rows))
