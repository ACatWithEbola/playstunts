"""Both original outlined-text wrappers; real colour setters, captured glyph requests."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('output',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
rows=[]
for index,(path,start,segment,font_field,height_field,bounds) in enumerate([(a.legacy,0x1a72,0x209e,0x4dd2,0xa460,0x6d6c),(a.modern,0x1b72,0x20e5,0x4eb0,0xa6f6,0x6f66)]):
 image=path.read_bytes()
 for x,y,height,text in itertools.product([0,1,100,32767],[0,20],[6,8],['A','ABC']):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  m.mem_write(0x60000+font_field,struct.pack('<H',0x7000));m.mem_write(0x60000+height_field,struct.pack('<H',height));m.mem_write(0x65000,text.encode()+b'\0')
  m.mem_write(0x6f000,struct.pack('<7H',0x1000,0,0x5000,x,y,15,0));events=[]
  def hook(machine,address,size,user):
   measure=segment*16+(0x3c99 if index==0 else 0x3e1f);draw=segment*16+(0x5de6 if index==0 else 0x5f6e)
   if address not in (measure,draw):return
   sp=machine.reg_read(UC_X86_REG_SP)
   if address==measure:machine.reg_write(UC_X86_REG_AX,len(text))
   else:
    offset,px,py=struct.unpack('<3H',machine.mem_read(0x60000+sp+4,6));assert offset==0x5000
    fg,bg=struct.unpack('<2H',machine.mem_read(0x70000,4));events.append({'x':px,'y':py,'foreground':fg,'background':bg})
   ip,cs=struct.unpack('<2H',machine.mem_read(0x60000+sp,4));machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook)
  for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0x1234),(UC_X86_REG_DI,0x5678),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(0x198d0+start,0x1000,count=10000)
  assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_SI)==0x1234 and m.reg_read(UC_X86_REG_DI)==0x5678
  assert m.reg_read(UC_X86_REG_AX)==bounds
  values=list(struct.unpack('<4H',m.mem_read(0x60000+bounds,8)))
  assert values==[(x-1)&65535,(x+len(text)+1)&65535,(y-1)&65535,(y+height+1)&65535]
  rows.append({'engine':'ms-1991' if index else 'ms-1990','x':x,'y':y,'height':height,'text':text,'events':events})
 assert path.read_bytes()==image
with a.output.open('x') as out:json.dump(rows,out)
print(json.dumps({'originalOutlinedTextCases':len(rows),'boundsAndRegistersVerified':True,'noHardwareAudioOrFileServices':True}))
