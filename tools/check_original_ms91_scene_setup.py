"""Original 1991 scene descriptor initialization, with resource I/O supplied."""
import argparse,hashlib,json,struct,sys
from pathlib import Path
from unpack_executables import assemble,unpack_exe
from extract import unpack,resources
p=argparse.ArgumentParser();p.add_argument('game',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--web',type=Path,default=Path('public/game'));p.add_argument('--overview',action='store_true');a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=unpack_exe(assemble(a.game,'MCGA'));d=0x2dba0
packed=[(a.game/name).read_bytes()for name in ['GAME1.P3S','GAME2.P3S']];banks=[unpack(data)for data in packed]
u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
for address,bank in zip([0x80000,0x90000],banks):assert len(bank)<65536;u.mem_write(address,bank)
loads=[]
panorama_source=(a.web/'menu-panorama-art.json').read_bytes();panorama=json.loads(panorama_source)[0]['resources'];parts=[bytes(panorama[name])for name in ['scen','sce2','sce3','sce4']];offsets=[];payload=b''
for part in parts:offsets.append(len(payload));payload+=part
panorama_bank=struct.pack('<IH',38+len(payload),4)+b'scensce2sce3sce4'+struct.pack('<4I',*offsets)+payload;assert resources(panorama_bank)=={name:data for name,data in zip(['scen','sce2','sce3','sce4'],parts)}
u.mem_write(0xb0000,panorama_bank)
def hook(machine,address,size,user):
 if address not in [0x2c240+0x678,0x2c240+0x654,0x198d0+0x2df8,0x198d0+0x24b2]:return
 sp=machine.reg_read(UC_X86_REG_SP);ip,cs=struct.unpack('<2H',bytes(machine.mem_read(d+sp,4)))
 if address==0x2c240+0x678:ax,dx=0xffff,1
 elif address==0x2c240+0x654:ax,dx=0,0x7000
 elif address==0x198d0+0x24b2:ax,dx=0,0xb000
 else:
  name_at=struct.unpack('<H',bytes(machine.mem_read(d+sp+4,2)))[0];name=bytes(machine.mem_read(d+name_at,8)).split(b'\0')[0].decode('ascii').upper();assert name in ['GAME1','GAME2'],name
  segment={'GAME1':0x8000,'GAME2':0x9000}[name];loads.append(name);ax,dx=0,segment
 machine.reg_write(UC_X86_REG_AX,ax);machine.reg_write(UC_X86_REG_DX,dx);machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
u.hook_add(UC_HOOK_CODE,hook)
for reg,value in [(UC_X86_REG_CS,0xc33),(UC_X86_REG_DS,d>>4),(UC_X86_REG_ES,d>>4),(UC_X86_REG_SS,d>>4),(UC_X86_REG_SP,0xf000)]:u.reg_write(reg,value)
u.mem_write(d+0xf000,struct.pack('<2H',0,0xf000));u.emu_start(0x122bc,0xf0000,count=1000000);assert u.reg_read(UC_X86_REG_CS)==0xf000 and loads==['GAME1','GAME2']
all_resources={**resources(banks[1]),**resources(banks[0])};names=[]
for index in range(116):
 name=bytes(u.mem_read(d+0xa56+index*5,5)).split(b'\0')[0].decode('ascii');descriptor=bytes(u.mem_read(d+0x76ac+index*22,22));vertex_count,offset,segment=struct.unpack_from('<3H',descriptor)
 source=all_resources[name];assert vertex_count==source[0] and descriptor[6]==source[1]and descriptor[8]==source[2],(name,descriptor.hex(),source[:4].hex())
 assert bytes(u.mem_read(segment*16+offset-4,len(source)))==source
 names.append(name)
assert all((a.game/name).read_bytes()==data for name,data in zip(['GAME1.P3S','GAME2.P3S'],packed))
for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_BP,0xef00),(UC_X86_REG_SP,0xee00)]:u.reg_write(reg,value)
u.emu_start(0x281b,0x2895,count=5000);assert u.reg_read(UC_X86_REG_IP)==0x2895
tables=[(0xa5e8,lambda i:30*(29-i)),(0x8c5c,lambda i:30*i),(0x7670,lambda i:(29-i)*1024),(0xaa2e,lambda i:(29-i)*1024+512),(0x933e,lambda i:i*1024),(0x752e,lambda i:i*1024+512),(0x7576,lambda i:i*1024),(0xa67a,lambda i:i*1024+512)]
for at,expected in tables:assert list(struct.unpack('<30H',bytes(u.mem_read(d+at,60))))==[expected(i)for i in range(30)],hex(at)
u.mem_write(d+0xf000,struct.pack('<2H',0,0xf000))
for reg,value in [(UC_X86_REG_CS,0x1718),(UC_X86_REG_SP,0xf000)]:u.reg_write(reg,value)
u.emu_start(0x1718c,0xf0000,count=200000);assert u.reg_read(UC_X86_REG_CS)==0xf000
assert struct.unpack('<2H',bytes(u.mem_read(d+0x5786,4)))==(0,0x7000)
for index,at in enumerate([0x60f2,0x5752,0x5740,0x576c]):
 cosine=[16384,0,-16384,0][index];sine=[0,16384,0,-16384][index]
 assert list(struct.unpack('<9h',bytes(u.mem_read(d+at,18))))==[cosine,0,-sine,0,16384,0,sine,0,cosine],hex(at)
materials=list(struct.unpack('<4H',bytes(u.mem_read(d+0x53be,8))))
assert materials==[0x50b8,0x50b8,0x51ba,0x52bc]
u.mem_write(d+0xf000,struct.pack('<7H',0,0xf000,*materials,0))
for reg,value in [(UC_X86_REG_CS,0x1718),(UC_X86_REG_SP,0xf000)]:u.reg_write(reg,value)
u.emu_start(0x171ea,0xf0000,count=1000);assert u.reg_read(UC_X86_REG_CS)==0xf000
for at,expected in zip([0x9eda,0xa27e,0xa5c6,0xa63a,0xa2a4],[*materials,0]):assert struct.unpack('<H',bytes(u.mem_read(d+at,2)))[0]==expected
queue_fields=[(0x8b96,0),(0x6104,0),(0x5782,0),(0x5aaa,0xffff),(0x8ca2,400)]
for at,expected in queue_fields:u.mem_write(d+at,struct.pack('<H',0xaaaa))
u.mem_write(d+0xf000,struct.pack('<2H',0,0xf000))
for reg,value in [(UC_X86_REG_CS,0x1718),(UC_X86_REG_SP,0xf000)]:u.reg_write(reg,value)
u.emu_start(0x1720e,0xf0000,count=1000);assert u.reg_read(UC_X86_REG_CS)==0xf000
for at,expected in queue_fields:assert struct.unpack('<H',bytes(u.mem_read(d+at,2)))[0]==expected,hex(at)
u.mem_write(d+0x18e,b'\0');u.mem_write(d+0xf000,struct.pack('<3H',0,0xf000,0))
for reg,value in [(UC_X86_REG_CS,0xc33),(UC_X86_REG_SP,0xf000)]:u.reg_write(reg,value)
u.emu_start(0xfbc6,0xf0000,count=200000);assert u.reg_read(UC_X86_REG_CS)==0xf000
for index,part in enumerate(parts):
 offset,segment=struct.unpack('<2H',bytes(u.mem_read(d+0xa628+index*4,4)));assert bytes(u.mem_read(segment*16+offset,len(part)))==part
 assert struct.unpack('<H',bytes(u.mem_read(d+0x9dc0+index*2,2)))[0]==struct.unpack_from('<H',part,2)[0]
assert (a.web/'menu-panorama-art.json').read_bytes()==panorama_source
overview=None;overviews=[]
if a.overview:
 tracks=json.loads((a.web/'assets.json').read_text())['tracks'];baseline=(a.web/'native-render-resources.bin').read_bytes();prepared=bytes(u.mem_read(0,0x100000))
 model_calls=[0];drain_calls=[0]
 def observe(machine,address,size,user):
  if address==0x172c6:model_calls[0]+=1
  elif address==0x1841e:drain_calls[0]+=1
 u.hook_add(UC_HOOK_CODE,observe)
 for track in tracks:
  u.mem_write(0,prepared);raw=track['raw'];selected=json.loads(panorama_source)[raw[900]&3]['resources'];parts=[bytes(selected[name])for name in ['scen','sce2','sce3','sce4']];offsets=[];payload=b''
  for part in parts:offsets.append(len(payload));payload+=part
  bank=struct.pack('<IH',38+len(payload),4)+b'scensce2sce3sce4'+struct.pack('<4I',*offsets)+payload;u.mem_write(0xb0000,bank)
  u.mem_write(d+0x18e,b'\0');u.mem_write(d+0xf000,struct.pack('<3H',0,0xf000,raw[900]))
  for reg,value in [(UC_X86_REG_CS,0xc33),(UC_X86_REG_SP,0xf000),(UC_X86_REG_DS,d>>4),(UC_X86_REG_ES,d>>4),(UC_X86_REG_SS,d>>4)]:u.reg_write(reg,value)
  u.emu_start(0xfbc6,0xf0000,count=200000);assert u.reg_read(UC_X86_REG_CS)==0xf000
  u.mem_write(d+0x99e,baseline[0x2d1a0+0x8f6:0x2d1a0+0x908])
  for field,address,data in [(0x95ee,0x50000,raw[:900]),(0x9d68,0x51000,raw[901:1801])]:u.mem_write(d+field,struct.pack('<2H',0,address>>4));u.mem_write(address,bytes(data))
  c=0x20e50;u.mem_write(0xd0000,bytes(65536))
  for offset,value in [(0x5f1e,0xd000),(0x5f26,0x6500),(0x5f28,0),(0x5f2a,320),(0x5f36,0),(0x5f38,320),(0x5f2c,0),(0x5f2e,200),(0x5f30,320)]:u.mem_write(c+offset,struct.pack('<H',value))
  u.mem_write(c+0x6500,struct.pack('<256H',*[(i*320)&65535 for i in range(256)]));u.mem_write(d+0x4c62,bytes(4));u.mem_write(d+0xf000,struct.pack('<6H',0,0xf000,40,40,320,200))
  for reg,value in [(UC_X86_REG_CS,0x20e5),(UC_X86_REG_SP,0xf000)]:u.reg_write(reg,value)
  u.emu_start(0x2471f,0xf0000,count=200000);assert u.reg_read(UC_X86_REG_CS)==0xf000
  model_calls[0]=drain_calls[0]=0;u.mem_write(d+0xf000,struct.pack('<2H',0,0xf000))
  for reg,value in [(UC_X86_REG_CS,0xc33),(UC_X86_REG_SP,0xf000)]:u.reg_write(reg,value)
  u.emu_start(0xf000,0xf0000,count=100000000);assert u.reg_read(UC_X86_REG_CS)==0xf000
  pixels=bytes(u.mem_read(0xd0000,65536));overview={'track':track['name'],'landscape':raw[900],'sha256':hashlib.sha256(pixels).hexdigest(),'modelCalls':model_calls[0],'queueDrains':drain_calls[0]};assert model_calls[0]>0 and drain_calls[0]==900,overview;overviews.append(overview)
 assert all((a.game/name).read_bytes()==data for name,data in zip(['GAME1.P3S','GAME2.P3S'],packed))and(a.web/'menu-panorama-art.json').read_bytes()==panorama_source
print(json.dumps({'originalSceneDescriptors':len(names),'coordinateTables':len(tables),'coordinateWords':240,'quarterTurnMatrices':4,'materialBindings':5,'queueResetFields':5,'queueAllocationBytes':10400,'panoramaResources':4,'resourceLoads':loads,'sourceUnchanged':True,'overview':overview,'overviews':overviews,'pixelParityClaimed':False}))
