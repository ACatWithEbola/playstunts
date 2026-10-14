"""Original UI polling captures with explicit host hardware services."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--legacy',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=a.image.read_bytes();mapping={at:at+0xd4 for at in range(0x3382,0x3397,2)}
mapping.update({0x9ad4:0xa1c8,0xa77c:0xae70,0xa7de:0xaed2,0x893a:0x8ff4})
flags={0x131:0x18f,0x132:0x190,0x133:0x191};rows=[]
code_segment=0x20e5;mouse_segment=0x2d8c;entry=0x132e
key_entry,controls_entry,shift_entry,mouse_entry,hide_entry,show_entry=0x1af5,0x1bd8,0x1b14,0x1bc,0x1932,0x196e
if a.legacy:
 mapping={at:at for at in range(0x3382,0x3397,2)}
 mapping.update({0x9ad4:0x9f30,0xa77c:0xabd8,0xa7de:0xac3a,0x893a:0x8d96})
 flags={at:at for at in [0x131,0x132,0x133]}
 code_segment=0x209e;mouse_segment=0x2d2c;entry=0x122e
 key_entry,controls_entry,shift_entry,mouse_entry,hide_entry,show_entry=0x1af9,0x1bdc,0x1b18,0x1c0,0x1832,0x186e
for controls in range(64):
 for delta in [0,1,20,501]:
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  initial={at:0 for at in mapping};initial.update({0x3396:19999,0x3384:19970,0x3382:19970})
  before_flags={0x131:1,0x132:1,0x133:1}
  for at,value in initial.items():m.mem_write(0x60000+mapping[at],struct.pack('<H',value))
  for at,value in before_flags.items():m.mem_write(0x60000+flags[at],bytes([value]))
  sample={'key':13 if controls%7==0 else 0,'controls':controls,'shift':controls&3,'x':0 if controls%2 else 17,'y':0 if controls%3 else 29,'buttons':controls%4};effects=[]
  def return_far(uc):
   sp=uc.reg_read(UC_X86_REG_SP);ip,cs=struct.unpack('<2H',uc.mem_read(0x60000+sp,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  def hook(uc,address,size,user):
   value=None
   if address==code_segment*16+key_entry:value=sample['key']
   elif address==code_segment*16+controls_entry:value=sample['controls']
   elif address==code_segment*16+shift_entry:value=sample['shift']
   elif address==mouse_segment*16+mouse_entry:
    for at,key in [(mapping[0xa77c],'x'),(mapping[0xa7de],'y'),(mapping[0x893a],'buttons')]:uc.mem_write(0x60000+at,struct.pack('<H',sample[key]))
    value=0
   elif address in [0x198d0+hide_entry,0x198d0+show_entry]:
    show=address==0x198d0+show_entry;effects.append('showCursor' if show else 'hideCursor');uc.mem_write(0x60000+flags[0x133],bytes([int(show)]));value=0
   if value is not None:uc.reg_write(UC_X86_REG_AX,value);return_far(uc)
  m.hook_add(UC_HOOK_CODE,hook)
  m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,delta))
  for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0x198d0+entry,0x1000,count=3000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  after={at:struct.unpack('<H',m.mem_read(0x60000+actual,2))[0] for at,actual in mapping.items()}
  after_flags={at:m.mem_read(0x60000+actual,1)[0] for at,actual in flags.items()}
  rows.append({'initial':initial,'flags':before_flags,'sample':sample,'delta':delta,'after':after,'afterFlags':after_flags,'key':m.reg_read(UC_X86_REG_AX),'effects':effects})
assert a.image.read_bytes()==image
with a.output.open('x') as out:json.dump(rows,out)
print(json.dumps({'actualOriginalPollCases':len(rows),'edition':'legacy' if a.legacy else 'modern','hardwareServicesExplicitlyDoubled':True,'sourcesUnchanged':True}))
