"""Run original prompt assembly with isolated resource/dialog service doubles."""
import argparse, itertools, json, struct, sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=a.modern.read_bytes();cases=0
def cstring(machine,at):
 result=bytearray()
 for n in range(512):
  value=machine.mem_read(at+n,1)[0]
  if not value:return bytes(result)
  result.append(value)
 raise AssertionError('Unterminated isolated dialog text')
for required,filename,choice in itertools.product([0,1],[b'',b'DEFAULT.HIG'],[0,1,2]):
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 m.mem_write(0x60000,image[0x32a90:0x32a90+0x6000])
 m.mem_write(0x6009c,struct.pack('<4H',0x1000,0x9000,0x1100,0x9000))
 m.mem_write(0x60193,bytes([required]));m.mem_write(0x63428,filename+b'\0')
 m.mem_write(0x91000,b'RESOURCE MESSAGE\0');m.mem_write(0x6f000,struct.pack('<2H',0x1000,0))
 events=[]
 def return_far(machine):
  sp=machine.reg_read(UC_X86_REG_SP);ip,cs=struct.unpack('<2H',machine.mem_read(0x60000+sp,4))
  machine.reg_write(UC_X86_REG_SP,(sp+4)&65535);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
 def hook(machine,address,size,user):
  if address in (0x198d0+0x25f8,0x198d0+0x2614):
   events.append('save' if address==0x198d0+0x25f8 else 'restore');return_far(machine)
  elif address==0x198d0+0x160c:
   machine.reg_write(UC_X86_REG_AX,0x1000);machine.reg_write(UC_X86_REG_DX,0x9000);return_far(machine)
  elif address==0x198d0+0x1e4:
   sp=machine.reg_read(UC_X86_REG_SP)
   count,kind,offset,segment=struct.unpack('<4H',machine.mem_read(0x60000+sp+4,8))
   events.append({'count':count,'kind':kind,'text':cstring(machine,segment*16+offset).decode('ascii')})
   machine.reg_write(UC_X86_REG_AX,choice);return_far(machine)
 m.hook_add(UC_HOOK_CODE,hook)
 for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0xbeef),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
 m.emu_start(0x198d0+0x2c20,0x1000,count=10000)
 prefix=0x34b3 if required else 0x34bc;suffix=0x34b5 if required else 0x34be
 expected=b'RESOURCE MESSAGE'+(cstring(m,0x60000+prefix)+filename+cstring(m,0x60000+suffix) if filename else b'')
 assert events==['save',{'count':2 if required else 1,'kind':1,'text':expected.decode('ascii')},'restore'],events
 assert m.reg_read(UC_X86_REG_AX)==(int(choice==0) if required else 1)
 assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_BP)==0xbeef
 assert cstring(m,0x63428)==filename
 cases+=1
assert a.modern.read_bytes()==image
print(json.dumps({'originalPromptCases':cases,'actualCopyAndAppendHelpersExecuted':True,'dialogTextAndChoiceMappingMatch':True,'stackRestored':True,'serviceDoublesNotRenderedUI':True,'noRealFileOrAudioAccess':True,'wholeItemAccepted':False,'pass':True}))
