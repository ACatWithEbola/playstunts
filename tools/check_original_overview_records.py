"""Run original overview tile loop; capture model records before drawing.

Drawing is deliberately intercepted, so this is not a pixel-output oracle.
"""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--raised',action='store_true');p.add_argument('--multi-tile',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
rows=[]
for engine,path,start,end,camera,roadptr,terrainptr,roadrows,terrainrows,xcoords,zcoords,roadtable,groundtable,render,drain in [
 ('ms-1990',a.legacy,0xe91d,0xed52,0x8f6,0x97b2,0x9f2c,0xa7ac,0x8e30,0xa83e,0xabf2,0x2018,0x2bda,0x1696*16+0x140,0x1696*16+0x1296),
 ('ms-1991',a.modern,0xf141,0xf54c,0x99e,0x9a4a,0xa1c4,0xaa44,0x90b8,0xaad6,0xae8a,0x209e,0x2c60,0x1718*16+0x146,0x1718*16+0x129e)]:
 image=path.read_bytes();u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
 d=0x70000;s=d;u.mem_write(d,bytes(65536))
 def word(offset,value):u.mem_write(d+offset,struct.pack('<H',value&65535))
 for field,segment in [(roadptr,0x5000),(terrainptr,0x5100)]:word(field,0);word(field+2,segment)
 u.mem_write(0x50000,bytes([1])+bytes(899));u.mem_write(0x51000,bytes([6 if a.raised else 0])+bytes(899))
 word(0x124 if engine=='ms-1990'else 0x182,512)
 for i in range(30):
  word(roadrows+i*2,i*30);word(terrainrows+i*2,i*30)
  word(xcoords+i*2,512+i*1024);word(zcoords+i*2,512+i*1024)
 for i,value in enumerate([1,3,5]):word(camera+i*2,value)
 word(roadtable+14+2,64);word(roadtable+14+6,0x1234)
 if a.multi_tile:
  assert not a.raised
  u.mem_write(0x50000,bytes([105])+bytes(899))
  for offset in [0,1,30,31]:u.mem_write(0x51000+offset,b'\x01')
  word(roadtable+105*14+2,64);word(roadtable+105*14+6,0x1234)
  word(groundtable+14+2,32);word(groundtable+14+4,0x1111);word(groundtable+14+6,0x2222)
 records=[];drains=[0];unknown=[]
 def hook(machine,address,size,user):
  if address not in (render,drain):return
  sp=machine.reg_read(UC_X86_REG_SP);ss=machine.reg_read(UC_X86_REG_SS)*16
  ret_ip,ret_cs=struct.unpack('<2H',bytes(machine.mem_read(ss+sp,4)))
  if address==render:
   pointer=struct.unpack('<H',bytes(machine.mem_read(ss+sp+4,2)))[0]
   record=bytes(machine.mem_read(ss+pointer,20));records.append({'position':list(struct.unpack('<3h',record[:6])),'descriptor':struct.unpack('<H',record[6:8])[0],'angles':list(struct.unpack('<3h',record[10:16])),'flags':record[18],'paint':record[19]})
  else:drains[0]+=1
  machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,ret_cs);machine.reg_write(UC_X86_REG_IP,ret_ip)
 u.hook_add(UC_HOOK_CODE,hook)
 for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x7000),(UC_X86_REG_SS,0x7000),(UC_X86_REG_BP,0xf000),(UC_X86_REG_SP,0xef00)]:u.reg_write(reg,value)
 u.emu_start(start,end,count=1000000);assert u.reg_read(UC_X86_REG_IP)==end
 assert drains[0]==900 and len(records)==(8 if a.multi_tile else 2 if a.raised else 1),(engine,drains,records)
 height=512 if a.raised else 0
 expected=[(512-1)//2,(height-3)//2,(512-5)//2]if engine=='ms-1991'else [int((512-1)/2),int((height-3)/2),int((512-5)/2)]
 road_record=records[4]if a.multi_tile else records[-1]
 assert road_record['position']==expected and road_record['descriptor']==0x1234 and road_record['angles']==[0,0,64],(engine,records)
 if a.multi_tile:
  corners=[(0,0),(1,0),(0,1),(1,1)]
  for index,(x,y)in enumerate(corners):
   half=lambda value:value//2 if engine=='ms-1991'else int(value/2)
   position=[half(512+x*1024-1),half(-3),half(512+y*1024-5)]
   assert records[index]=={'position':position,'descriptor':0x1111,'angles':[0,0,32],'flags':5,'paint':0},(engine,index,records)
  for index,(x,y)in enumerate(corners[1:],5):
   position=[half(512+x*1024-1),half(-3),half(512+y*1024-5)]
   assert records[index]=={'position':position,'descriptor':0x2222,'angles':[0,0,32],'flags':5,'paint':0},(engine,index,records)
 if a.raised:
  assert records[0]['position']==expected and records[0]['descriptor']==(0x7c80 if engine=='ms-1990'else 0x7ebe)and records[0]['angles']==[0,0,0]and records[0]['flags']==5 and records[0]['paint']==0,(engine,records)
 assert path.read_bytes()==image
 rows.append({'engine':engine,'records':records,'drains':drains[0]})
print(json.dumps({'fixture':'four-tile-terrain'if a.multi_tile else'raised-road'if a.raised else'ordinary-road','rows':rows,'sourceUnchanged':True,'drawingIntercepted':True,'originalPixelParityClaimed':False}))
