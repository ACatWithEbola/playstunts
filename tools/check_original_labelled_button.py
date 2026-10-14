"""Compare full labelled-button request sequences; string helpers execute real."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
editions=[];cases=0
for path,seg,entry,line,rectangle,colour,measure,draw in [(a.legacy,0x209e,0x1d46,0x13b8,0x5908,0x9130,0x3c99,0x5de6),(a.modern,0x20e5,0x1e1a,0x13ba,0x5a90,0x92b8,0x3e1f,0x5f6e)]:
 image=path.read_bytes();edition=[]
 for text,coordinate,extent in itertools.product([b'',b'A',b'OK',b'AB]CD'],[0,31,65535,32767,32768],[1,8,20,100]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x90000,text+b'\0');events=[]
  def read_text(uc,at):
   result=bytearray()
   for i in range(100):
    value=uc.mem_read(0x60000+((at+i)&65535),1)[0]
    if not value:return bytes(result)
    result.append(value)
   raise AssertionError('Unterminated button text')
  def hook(uc,address,size,user):
   services={seg*16+line:('line',5),seg*16+rectangle:('rectangle',5),seg*16+colour:('colour',2),seg*16+measure:('measure',1),seg*16+draw:('text',3)}
   if address not in services:return
   kind,count=services[address];sp=uc.reg_read(UC_X86_REG_SP);args=list(struct.unpack('<'+'H'*count,uc.mem_read(0x60000+sp+4,count*2)))
   if kind in ('measure','text'):
    content=read_text(uc,args[0]);args[0]=content.decode();uc.reg_write(UC_X86_REG_AX,len(content)*6 if kind=='measure' else 0)
   else:uc.reg_write(UC_X86_REG_AX,0)
   events.append([kind,args]);ip,cs=struct.unpack('<2H',uc.mem_read(0x60000+sp,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<12H',0x1000,0,0,0x9000,coordinate,coordinate,extent,extent,15,1,0,15))
  for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0xaaaa),(UC_X86_REG_DI,0xbbbb)]:m.reg_write(reg,value)
  m.emu_start(0x198d0+entry,0x1000,count=20000)
  assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_SI)==0xaaaa and m.reg_read(UC_X86_REG_DI)==0xbbbb
  assert len([e for e in events if e[0]=='line'])==12 and events[0][0]=='rectangle'
  edition.append({'text':text.decode(),'coordinate':coordinate,'extent':extent,'events':events});cases+=1
 editions.append(edition);assert path.read_bytes()==image
assert editions[0]==editions[1]
if a.output:
 with a.output.open('x') as out:json.dump(editions[0],out)
print(json.dumps({'originalLabelledButtonCases':cases,'bothEditionsAllRequestsMatch':True,'copyAndLengthHelpersExecutedReal':True,'drawingAndMeasurementServicesDoubled':True,'pass':True}))
