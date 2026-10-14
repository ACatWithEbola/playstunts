"""Run original post-allocation pointer partitioning, not a full race oracle."""
import argparse,struct,sys,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--replay',type=Path);p.add_argument('--analyze',action='store_true');p.add_argument('--game',type=Path)
p.add_argument('--car',type=Path);p.add_argument('--position',type=int,nargs=3);p.add_argument('--heading',type=int,default=0);p.add_argument('--chassis-step',action='store_true');p.add_argument('--road-speed',type=int,default=0);p.add_argument('--front-angle',type=int,default=0);p.add_argument('--wheel-angle',type=int,default=0)
p.add_argument('--fall-speed',type=int,default=0);p.add_argument('--driving-step',type=int);p.add_argument('--driving-steps',type=int,default=1);p.add_argument('--recorded-inputs',action='store_true');p.add_argument('--race-init',action='store_true')
p.add_argument('--full-player',action='store_true');p.add_argument('--update-race',action='store_true');p.add_argument('--state-output',type=Path);p.add_argument('--opponent-resource',type=Path);p.add_argument('--trace-instructions',action='store_true');p.add_argument('--inspect-opponent-frame',type=int);p.add_argument('--car-state',type=Path);p.add_argument('--input-start',type=int,default=0)
p.add_argument('--chassis-steps',type=int,default=1)
p.add_argument('--opponent-car',type=Path)
p.add_argument('--capture-evidence',type=Path)
p.add_argument('--test-player-position',type=int,nargs=3)
p.add_argument('--branch-coverage',action='store_true')
p.add_argument('--race-init-mode',type=int,default=0)
p.add_argument('--race-state-input',type=Path)
p.add_argument('--runtime-mode',type=int,default=0,choices=range(256))
p.add_argument('--selection-probes',action='store_true')
p.add_argument('--selection-catalog',action='store_true')
p.add_argument('--selection-terrain',type=int,default=0,choices=range(19))
p.add_argument('--selection-mode',type=int,default=0,choices=range(256))
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
b=a.image.read_bytes();assert b[0x28f2:0x28f8]==bytes.fromhex('8946fc8956fe')
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,b)
m.mem_write(0x60000,b[0x32a90:0x42a90])
for reg,v in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xee00),(UC_X86_REG_BP,0xf000)]:m.reg_write(reg,v)
assert b[0x281b:0x281d]==bytes.fromhex('2bf6')
m.emu_start(0x281b,0x2895,count=5000)
assert m.reg_read(UC_X86_REG_IP)==0x2895
tables=[(0xaa44,lambda i:30*(29-i)),(0x90b8,lambda i:30*i),(0x7ad0,lambda i:(29-i)*1024),(0xae8a,lambda i:(29-i)*1024+512),(0x979a,lambda i:i*1024),(0x798e,lambda i:i*1024+512),(0x79d6,lambda i:i*1024),(0xaad6,lambda i:i*1024+512)]
for at,expected in tables:
 values=struct.unpack('<30H',bytes(m.mem_read(0x60000+at,60)))
 assert list(values)==[expected(i) for i in range(30)],hex(at)
for reg,v in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xee00),(UC_X86_REG_BP,0xf000),(UC_X86_REG_AX,0),(UC_X86_REG_DX,0x9000)]:m.reg_write(reg,v)
m.emu_start(0x28f2,0x2a4b,count=1000)
assert m.reg_read(UC_X86_REG_IP)==0x2a4b
word=lambda at:struct.unpack('<H',bytes(m.mem_read(0x60000+at,2)))[0]
assert word(0xeffc)==0x6bf3,'Original partition exceeds allocation'
offset=3*1802+4*128+96+384+288+364+240
checks=[('header',0xae66,offset,26),('elements',0x9a4a,offset+26,901),('terrain',0xa1c4,offset+26+901,901),('inputs',0xa332,offset+26+1802,12000),('lastObjects',0xb0e0,0x6bf3-48,48)]
rows=[]
for name,at,expected,size in checks:
 off,seg=word(at),word(at+2)
 assert (off,seg)==(expected,0x9000),(name,off,seg,expected)
 assert off+size<=0x6bf3
 rows.append(dict(name=name,offset=off,segment=seg,bytes=size))
assert a.image.read_bytes()==b
loaded=False;analysis=None;resource_rows=[]
matrices=[]
for destination,angle in [(0x6554,0),(0x5bb4,256),(0x5ba2,512),(0x5bce,768)]:
 m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,destination,angle))
 for reg,v in [(UC_X86_REG_CS,0x2df4),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,v)
 m.emu_start(0x2df9c,0x1000,count=20000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 matrix=list(struct.unpack('<9h',bytes(m.mem_read(0x60000+destination,18))))
 assert any(matrix),'Uninitialized original rotation matrix'
 rows3=[matrix[i:i+3] for i in (0,3,6)]
 for i,row in enumerate(rows3):
  assert sum(v*v for v in row)==16384**2
  for other in rows3[i+1:]:assert sum(x*y for x,y in zip(row,other))==0
 matrices.append(dict(angle=angle,destination=destination,values=matrix))
if a.game:
 from extract import unpack,resources
 packed=a.game.read_bytes();bank=unpack(packed)
 assert len(bank)<0x10000,'GAME resource overlaps track allocation'
 m.mem_write(0x80000,bank)
 for name,at,destination in [('plan',0x31dc,0xa1ca),('wall',0x31e1,0xb164)]:
  m.mem_write(0x6f000,struct.pack('<5H',0x1000,0,0,0x8000,at))
  for reg,v in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,v)
  m.emu_start(0x1aec6,0x1000,count=20000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  off,seg=m.reg_read(UC_X86_REG_AX),m.reg_read(UC_X86_REG_DX)
  expected=resources(bank)[name];assert bytes(m.mem_read(seg*16+off,len(expected)))==expected
  m.mem_write(0x60000+destination,struct.pack('<HH',off,seg))
  resource_rows.append(dict(name=name,offset=off,segment=seg,bytes=len(expected)))
 assert a.game.read_bytes()==packed
if a.replay:
 replay=a.replay.read_bytes();assert len(replay)>=0x724
 rate,frames=struct.unpack_from('<HH',replay,22)
 assert rate in (10,20) and 0<frames<=12000 and len(replay)==0x724+frames
 header=word(0xae66);assert header+len(replay)<=0x6bf3
 # Host file-read boundary only; the header-copy instructions are original.
 m.mem_write(0x90000+header,replay)
 for reg,v in [(UC_X86_REG_CS,0x0c33),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xee00)]:m.reg_write(reg,v)
 m.emu_start(0x150ee,0x15105,count=1000)
 assert m.reg_read(UC_X86_REG_DS)==0x6000 and m.reg_read(UC_X86_REG_SP)==0xee00
 assert bytes(m.mem_read(0x696b0,26))==replay[:26]
 assert bytes(m.mem_read(0x90000+word(0x9a4a),901))==replay[26:927]
 assert bytes(m.mem_read(0x90000+word(0xa1c4),901))==replay[927:1828]
 assert bytes(m.mem_read(0x90000+word(0xa332),frames))==replay[1828:]
 assert a.replay.read_bytes()==replay
 loaded=True
if a.analyze:
 assert loaded,'Track analysis requires an actual replay'
 from unicorn import UC_HOOK_CODE
 events=[]
 def host_boundary(machine,address,size,user):
  if address not in (0x31432,0x23a6d):return
  sp=machine.reg_read(UC_X86_REG_SP);stack=0x60000+sp
  ip,cs=struct.unpack('<HH',bytes(machine.mem_read(stack,4)))
  if address==0x31432:
   name,length,high=struct.unpack('<3H',bytes(machine.mem_read(stack+4,6)))
   assert bytes(machine.mem_read(0x60000+name,6))==b'tcomp\0'
   assert (length,high)==(0x380,0)
   machine.mem_write(0xa0000,bytes(length));machine.reg_write(UC_X86_REG_AX,0);machine.reg_write(UC_X86_REG_DX,0xa000)
   events.append('allocate tcomp')
  else:
   assert bytes(machine.mem_read(stack+4,4))==struct.pack('<HH',0,0xa000)
   events.append('release tcomp')
  machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
 allocation_hook=m.hook_add(UC_HOOK_CODE,host_boundary)
 m.mem_write(0x6f000,struct.pack('<HH',0x1000,0))
 for reg,v in [(UC_X86_REG_CS,0x105c),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,v)
 m.emu_start(0x12afc,0x1000,count=5000000)
 assert m.reg_read(UC_X86_REG_SP)==0xf004,'Track analysis did not return'
 analysis=dict(returnCode=m.reg_read(UC_X86_REG_AX),events=events)
 assert analysis['returnCode']==0,'Original game rejected track analysis'
 assert events==['allocate tcomp','release tcomp']
 m.hook_del(allocation_hook)
 analysis['route']={}
 for name,at in [('tiles',0x96e0),('directions',0xa1da),('columns',0xa340),('rows',0xa6de)]:
  off,seg=word(at),word(at+2)
  analysis['route'][name]=list(bytes(m.mem_read(seg*16+off,901)))
 for name,at in [('primary',0x7a32),('secondary',0x7acc)]:
  off,seg=word(at),word(at+2)
  analysis['route'][name]=list(struct.unpack('<901H',bytes(m.mem_read(seg*16+off,1802))))
 # Capture exact data reached by the indexed-object collision caller rather
 # than merely recording that its pointer operands were relocated.
 collision_indices_off,collision_indices_seg=word(0xab5a),word(0xab5c)
 collision_centres_off,collision_centres_seg=word(0x7740),word(0x7742)
 indices_address=collision_indices_seg*16+collision_indices_off
 centres_address=collision_centres_seg*16+collision_centres_off
 assert 0<indices_address and indices_address+901<=0x100000
 collision_indices=list(bytes(m.mem_read(indices_address,901)))
 active_indices=[value for value in collision_indices if value!=255]
 assert all(value<128 for value in active_indices),'Collision caller signextends indices'
 centre_count=max(active_indices)+1 if active_indices else 0
 assert 0<centres_address and centres_address+centre_count*6<=0x100000
 analysis['collisionAllocation']={'indicesPointer':[collision_indices_off,collision_indices_seg],
  'centresPointer':[collision_centres_off,collision_centres_seg],'tileIndices':collision_indices,
  'centres':[list(struct.unpack('<3h',bytes(m.mem_read(centres_address+i*6,6)))) for i in range(centre_count)],
  'initialProcessedMarkers':list(bytes(m.mem_read(0x60000+0x959a,centre_count)))}
opponent_prepared=None
if a.opponent_resource:
 assert loaded and a.analyze and 1<=replay[6]<=6
 from extract import unpack
 opponent_source=a.opponent_resource.read_bytes();opponent_bank=unpack(opponent_source)
 from extract import resources
 assert 'enam' in resources(opponent_bank),'English original opponent name missing'
 # locate_text_res prefixes names with the selected original language byte.
 # Static executable data does not include main's runtime language selection.
 assert b[0x1aee2:0x1aee5]==bytes.fromhex('a062b1')
 m.mem_write(0x6b162,b'e')
 # DOS normally relocates this embedded data-segment reference. Unlike static
 # GAME names, the language-prefixed name lives on our relocated DS/SS stack.
 assert b[0x233e5:0x233ea]==bytes.fromhex('b8a9328ec0')
 m.mem_write(0x233e6,struct.pack('<H',0x6000))
 assert a.opponent_resource.name.upper()=='OPP'+str(replay[6])+'.PRE'
 opponent_calls=[];opponent_lookups=[];opponent_lookup_trace=[];opponent_costs=[]
 def opponent_file_boundary(machine,address,size,user):
  if address==0x13c63:
   opponent_costs.extend(bytes(machine.mem_read(machine.reg_read(UC_X86_REG_DX)*16+machine.reg_read(UC_X86_REG_AX),256)))
  if 0x1aedc<=address<=0x1af0e or (opponent_lookup_trace and len(opponent_lookup_trace)<22):
   opponent_lookup_trace.append(dict(at=hex(address),bytes=bytes(machine.mem_read(address,size)).hex(),ds=machine.reg_read(UC_X86_REG_DS),ss=machine.reg_read(UC_X86_REG_SS)))
  if address in (0x1aec6,0x1aedc,0x233c9):
   sp=machine.reg_read(UC_X86_REG_SP);stack=machine.reg_read(UC_X86_REG_SS)*16+sp
   values=struct.unpack('<5H',bytes(machine.mem_read(stack,10)))
   name_bytes=bytes(machine.mem_read(machine.reg_read(UC_X86_REG_DS)*16+values[4],8)).hex()
   opponent_lookups.append(dict(at=hex(address),args=list(values[2:]),nameBytes=name_bytes))
  if bytes(machine.mem_read(address,1))[0] in (0xe8,0x9a):
   opponent_calls.append(dict(at=hex(address),bytes=bytes(machine.mem_read(address,size)).hex()))
   if len(opponent_calls)>50:opponent_calls.pop(0)
  if address not in (0x1ae2c,0x238a8):return
  sp=machine.reg_read(UC_X86_REG_SP);stack=0x60000+sp
  if address==0x238a8:
   ip,cs,off,seg=struct.unpack('<4H',bytes(machine.mem_read(stack,8)))
   assert (off,seg)==(0,0xa000),'Release must match the isolated host-loaded opponent resource'
   for reg,v in [(UC_X86_REG_SP,sp+4),(UC_X86_REG_CS,cs),(UC_X86_REG_IP,ip)]:machine.reg_write(reg,v)
   return
  ip,cs,name=struct.unpack('<3H',bytes(machine.mem_read(stack,6)))
  assert bytes(machine.mem_read(0x60000+name,5)).lower()==('opp'+str(replay[6])+'\0').encode()
  # Preserve the original single-pass VLE staging tail: route costs may read
  # beyond the final sixteen-byte sped item into retained allocation bytes.
  assert opponent_source[0]==2
  allocated_paragraphs=(len(opponent_bank)+15)//16+4
  staging=(allocated_paragraphs-(len(opponent_source)+15)//16)*16
  assert 0<=staging and staging+len(opponent_source)<=allocated_paragraphs*16
  machine.mem_write(0xa0000+staging,opponent_source)
  machine.mem_write(0xa0000,opponent_bank)
  for reg,v in [(UC_X86_REG_AX,0),(UC_X86_REG_DX,0xa000),(UC_X86_REG_SP,sp+4),(UC_X86_REG_CS,cs),(UC_X86_REG_IP,ip)]:machine.reg_write(reg,v)
 opponent_hook=m.hook_add(UC_HOOK_CODE,opponent_file_boundary)
 # Resource lookup blocks were already translated before this diagnostic hook.
 m.ctl_flush_tb()
 m.mem_write(0x6f000,struct.pack('<HH',0x1000,0))
 for reg,v in [(UC_X86_REG_CS,0x105c),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,v)
 try:m.emu_start(0x13bf2,0x1000,count=5000000)
 except Exception as error:raise RuntimeError('Original opponent preparation failed at '+hex(m.reg_read(UC_X86_REG_CS)*16+m.reg_read(UC_X86_REG_IP))+' lookups '+json.dumps(opponent_lookups)+' lookupTrace '+json.dumps(opponent_lookup_trace)+' calls '+json.dumps(opponent_calls)) from error
 assert m.reg_read(UC_X86_REG_SP)==0xf004
 m.hook_del(opponent_hook)
 assert a.opponent_resource.read_bytes()==opponent_source
 path_offset,path_segment=word(0x864e),word(0x8650)
 assert (path_offset,path_segment)==(3604,0x9000),'Original opponent path must use the allocated third link table'
 profile=bytes(m.mem_read(0x69a58,16))
 assert profile==resources(opponent_bank)['sped'],'Original opponent profile copy differs'
 assert len(opponent_costs)==256
 opponent_prepared=dict(selected=replay[6],returned=True,profile=list(profile),costs=opponent_costs,path=list(struct.unpack('<901H',bytes(m.mem_read(path_segment*16+path_offset,1802)))))
car_initialized=None
if a.car:
 assert a.position and a.game and a.analyze,'Car context requires explicit position, resources and track analysis'
 if a.recorded_inputs:assert a.car.name.upper()=='CAR'+replay[:4].decode('ascii')+'.RES','Recorded replay car does not match supplied SIMD'
 from extract import resources
 car_source=a.car.read_bytes();tuning=resources(car_source)['simd'];assert len(tuning)==776
 # With no opponent, resource setup retains the unused simulation bank. It
 # must not be silently replaced with the selected player's car parameters.
 opponent_tuning=tuning if replay[6] else bytes(m.mem_read(0x6a344,776));opponent_car_source=None
 if a.opponent_car:
  opponent_car_source=a.opponent_car.read_bytes();opponent_tuning=resources(opponent_car_source)['simd'];assert len(opponent_tuning)==776
 if a.recorded_inputs and replay[6]:
  expected_opponent='CAR'+replay[7:11].decode('ascii')+'.RES'
  assert (a.opponent_car or a.car).name.upper()==expected_opponent,'Opponent SIMD must match recorded opponent car'
 m.mem_write(0x6b800,tuning);m.mem_write(0x692f2,bytes(208))
 m.mem_write(0x6f000,struct.pack('<5H3iH',0x1000,0,0x92f2,0xb800,1,*a.position,a.heading&65535))
 for reg,v in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,v)
 m.emu_start(0x8f4a,0x1000,count=20000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 raw=bytes(m.mem_read(0x692f2,208));expected=[((v>>6)+32768)%65536-32768 for v in a.position]
 for base in (0x74,0x8c):
  assert list(struct.unpack_from('<12h',raw,base))==expected*4,'Original wheel-coordinate bank did not initialize'
 assert list(struct.unpack_from('<3i',raw,0))==[a.position[0],a.position[1]+512,a.position[2]]
 assert a.car.read_bytes()==car_source
 column=bytes(m.mem_read(0x696a6,1))[0];terrain_row=bytes(m.mem_read(0x696aa,1))[0];hill=bytes(m.mem_read(0x696a7,1))[0]
 assert hill in (0,1)
 car_initialized=dict(resource=a.car.name,position=a.position,heading=a.heading,wheelBanksVerified=2,raw=raw.hex(),tuning=tuning.hex(),collisionContext=dict(column=column,terrainRow=terrain_row,height=word(0x180+hill*2),heading=word(0xa21a),hillHeight=word(0x182)))
selection_probes=[]
if a.selection_probes or a.selection_catalog:
 assert loaded and a.game
 elements_address=word(0x9a4a)+word(0x9a4c)*16
 terrain_address=word(0xa1c4)+word(0xa1c6)*16
 # The extracted route/object catalogue has198 primary entries. Higher byte
 # values include unused255-physics slots and bytes beyond the table, not
 # additional ordinary editor elements. Multi-tile markers253..255 separate.
 tile_cases=[(row,column,None) for row in range(30) for column in range(30)] if not a.selection_catalog else [(15,15,element) for element in range(198)]
 for row,column,element in tile_cases:
  saved_element=bytes(m.mem_read(elements_address+row*30+column,1));saved_terrain=bytes(m.mem_read(terrain_address+(29-row)*30+column,1))
  if element is not None:
   m.mem_write(elements_address+row*30+column,bytes([element]));m.mem_write(terrain_address+(29-row)*30+column,bytes([a.selection_terrain]))
  locations=[(0,0),(-120,0),(120,0),(-270,0),(270,0),(-511,-511),(511,511),(0,-511),(0,511)]
  if a.selection_catalog:locations += [(x,0) for x in (-150,-149,-130,-129,129,130,149,150)]
  for dx,dz,height in [(dx,dz,height) for dx,dz in locations for height in (0,144,450)]:
   point=[column*1024+512+dx,height,row*1024+512+dz];previous=[point[0],height,point[2]-16]
   m.mem_write(0x6f100,struct.pack('<6h',*point,*previous))
   m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,0xf100,0xf106))
   m.mem_write(0x69595,bytes([a.selection_mode]))
   for reg,value in [(UC_X86_REG_CS,0x105c),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
   m.emu_start(0x105c8,0x1000,count=100000)
   assert m.reg_read(UC_X86_REG_SP)==0xf004
   signed=lambda at:(word(at)+32768)%65536-32768
   selection_probes.append(dict(point=point,previous=previous,element=element,terrain=a.selection_terrain,planeId=word(0x9ace),surface=bytes(m.mem_read(0x69a4f,1))[0],wall=signed(0x8f9a),tileOrigin=[signed(at) for at in (0x96ec,0x96f8,0x9702)],wallLower=signed(0x9694),wallUpper=signed(0x9798)))
   if dx==0 and dz==0 and height==0:
    m.mem_write(0x6f200,bytes(48));m.mem_write(0x6f000,struct.pack('<5H',0x1000,0,column,29-row,0xf200))
    for reg,value in [(UC_X86_REG_CS,0x105c),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
    m.emu_start(0x11f0c,0x1000,count=100000);assert m.reg_read(UC_X86_REG_SP)==0xf004
    count=m.reg_read(UC_X86_REG_AX);assert count<=8
    selection_probes[-1]['landmarkPoints']=[list(struct.unpack('<3h',bytes(m.mem_read(0x6f200+i*6,6)))) for i in range(count)]
    selection_probes[-1]['hillHeight']=signed(0x182)
  m.mem_write(elements_address+row*30+column,saved_element);m.mem_write(terrain_address+(29-row)*30+column,saved_terrain)
chassis=None
if a.chassis_step:
 assert car_initialized,'Original chassis requires initialized car/resource/track context'
 if loaded and replay[6]:
  assert opponent_prepared,'Two-car checks require the original opponent loader'
  assert replay[7:11]==replay[:4] or (a.opponent_car and a.race_init),'Mixed cars require actual opponent SIMD and original two-car race initialization'
 # Explicit cadence and no selected opponent; no sound device is invoked.
 m.mem_write(0x696dc,struct.pack('<H',rate))
 m.mem_write(0x693c2,bytes(208))
 assert 0<=a.road_speed<=65535 and -32768<=a.front_angle<=32767 and -32768<=a.wheel_angle<=32767
 for offset,value in [(0x2a,a.road_speed),(0x2c,a.road_speed),(0x40,a.front_angle),(0x36,a.wheel_angle)]:m.mem_write(0x692f2+offset,struct.pack('<H',value&65535))
 chassis_before=bytes(m.mem_read(0x692f2,208))
 m.mem_write(0x6aab6,bytes([a.runtime_mode]))
 landing_trace=[];recent_calls=[];recent_code=[];opponent_writes=[];body_events=[]
 branch_coverage={}
 if a.branch_coverage:
  from capstone import Cs,CS_ARCH_X86,CS_MODE_16
  decoder=Cs(CS_ARCH_X86,CS_MODE_16)
  sites={0x758d:'jmp',0x759b:'jne',0x75a0:'jmp',0x7635:'jmp',0x7db2:'jne',0x8142:'jmp',0x84de:'jl',0x8991:'jne',0x89b0:'je',0x89b4:'jge',0x89bc:'jle',0x89c3:'jge',0x8916:'jmp',0x8ade:'jmp',0x8ae5:'jmp'}
  for address,mnemonic in sites.items():
   decoded=next(decoder.disasm(b[address:address+6],address));assert decoded.mnemonic==mnemonic
   branch_coverage[hex(address)]={'branch':mnemonic,'taken':0,'notTaken':0}
  def coverage_hook(machine,address,size,user):
   flags=machine.reg_read(UC_X86_REG_EFLAGS);zf=bool(flags&64);sf=bool(flags&128);of=bool(flags&2048)
   row=branch_coverage[hex(address)];kind=row['branch']
   taken={'jmp':True,'jne':not zf,'je':zf,'jl':sf!=of,'jge':sf==of,'jle':zf or sf!=of}[kind]
   row['taken' if taken else 'notTaken']+=1
  for address in sites:m.hook_add(UC_HOOK_CODE,coverage_hook,begin=address,end=address)
 def body_event_hook(machine,address,size,user):
  if address==0x8950:body_events.append(dict(bodyLoopReached=True))
  else:
   sp=machine.reg_read(UC_X86_REG_SP)
   body_events.append(dict(crashRequest=struct.unpack('<H',bytes(machine.mem_read(0x60000+sp+4,2)))[0]))
 m.hook_add(UC_HOOK_CODE,body_event_hook,begin=0x8950,end=0x8950)
 m.hook_add(UC_HOOK_CODE,body_event_hook,begin=0xba32,end=0xba32)
 if a.inspect_opponent_frame:
  from unicorn import UC_HOOK_MEM_WRITE
  def opponent_lookup_input(machine,address,size,user):
   if word(0x92e0)!=a.inspect_opponent_frame:return
   bp=machine.reg_read(UC_X86_REG_BP)
   if address==0xb269:
    off,seg=struct.unpack('<HH',bytes(machine.mem_read(0x60000+bp-6,4)))
    record=bytes(machine.mem_read(seg*16+off,14));primary=struct.unpack_from('<H',record,8)[0]
    opponent_writes.append(dict(lookupRecord=record.hex(),primaryAddress=hex(0x60000+primary),primaryBytes=bytes(machine.mem_read(0x60000+primary,48)).hex(),args=list(struct.unpack('<4H',bytes(machine.mem_read(0x60000+bp+6,8))))))
  m.hook_add(UC_HOOK_CODE,opponent_lookup_input,begin=0xb269,end=0xb269)
  def opponent_write(machine,access,address,size,value,user):
   if word(0x92e0)==a.inspect_opponent_frame:
    opponent_writes.append(dict(pc=hex(machine.reg_read(UC_X86_REG_CS)*16+machine.reg_read(UC_X86_REG_IP)),address=hex(address),bytes=size,value=value))
  m.hook_add(UC_HOOK_MEM_WRITE,opponent_write,begin=0x69466,end=0x69478)
 def landing_hook(machine,address,size,user):
  if address==0x1000:machine.emu_stop();return
  recent_code.append(hex(address))
  if len(recent_code)>20:recent_code.pop(0)
  if address<0x2800 and address!=0x1000:raise RuntimeError('Unexpected execution below original code; preceding instructions '+json.dumps(recent_code)+' stack '+bytes(machine.mem_read(0x60000+machine.reg_read(UC_X86_REG_SP),16)).hex())
  if bytes(machine.mem_read(address,1))[0] in (0xe8,0x9a):
   recent_calls.append(dict(at=hex(address),bytes=bytes(machine.mem_read(address,size)).hex()))
   if len(recent_calls)>16:recent_calls.pop(0)
  if address==0x840a:
   at=0x60000+((machine.reg_read(UC_X86_REG_BX)+machine.reg_read(UC_X86_REG_DI)+0x4c)&65535)
   landing_trace.append(dict(at=hex(address),fallWord=struct.unpack('<h',bytes(machine.mem_read(at,2)))[0]))
  elif address==0x83f5:
   at=0x60000+((machine.reg_read(UC_X86_REG_BX)+machine.reg_read(UC_X86_REG_DI)+0x4c)&65535)
   landing_trace.append(dict(at=hex(address),fallWord=struct.unpack('<h',bytes(machine.mem_read(at,2)))[0]))
  elif address in (0x83fc,0x8411,0x8421):landing_trace.append(dict(at=hex(address)))
 if a.trace_instructions:
  m.hook_add(UC_HOOK_CODE,landing_hook)
 else:
  # Trace only guarded low execution and landing decisions. Per-instruction
  # Python calls across a whole replay are diagnostic overhead, not physics.
  m.hook_add(UC_HOOK_CODE,landing_hook,begin=0,end=0x27ff)
  m.hook_add(UC_HOOK_CODE,landing_hook,begin=0x83f5,end=0x8421)
 m.ctl_flush_tb()
 assert -32768<=a.fall_speed<=32767
 for wheel in range(4):m.mem_write(0x692f2+0x4c+wheel*2,struct.pack('<h',a.fall_speed))
 if a.car_state:
  assert not a.race_init,'Controlled car state must not be overwritten by race initialization'
  controlled=a.car_state.read_bytes();assert len(controlled)==208
  m.mem_write(0x692f2,controlled)
 chassis_before=bytes(m.mem_read(0x692f2,208))
 m.mem_write(0x6f000,struct.pack('<7H',0x1000,0,0x92f2,0xb800,0x93c2,0xb800,0))
 for reg,v in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,v)
 if a.driving_step is None:
  assert 1<=a.chassis_steps<=1000
  chassis_sequence=[]
  for frame in range(a.chassis_steps):
   m.mem_write(0x6f000,struct.pack('<7H',0x1000,0,0x92f2,0xb800,0x93c2,0xb800,0))
   for reg,v in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,v)
   m.emu_start(0x751c,0x1000,count=1000000)
   assert m.reg_read(UC_X86_REG_SP)==0xf004,'Chassis did not return'
   chassis_sequence.append(bytes(m.mem_read(0x692f2,208)).hex())
 else:
  assert 0<=a.driving_step<=255
  for destination,car_tuning,table in [(0xab5e,tuning,5406),(0xa344,opponent_tuning,5534)]:
   assert table+128<=checks[0][2],'Resistance table exceeds allocated pre-header arena'
   m.mem_write(0x60000+destination,car_tuning)
   m.mem_write(0x60000+destination+772,struct.pack('<HH',table,0x9000))
   resistance=struct.unpack_from('<h',car_tuning,56)[0]
   m.mem_write(0x90000+table,struct.pack('<64H',*[int(resistance*i*i/512)&65535 for i in range(64)]))
  m.mem_write(0x696f4,struct.pack('<H',0x610 if rate==20 else 0x650))
  if a.race_init:
   assert b[0x9100:0x910a]==bytes.fromhex('558bec83ec0a57562bf6')
   if a.update_race:
    m.mem_write(0x6a724,struct.pack('<HH',0,0xb000));m.mem_write(0xb0000,bytes(1120*40))
   if a.race_state_input:
    seeded_state=a.race_state_input.read_bytes();assert len(seeded_state)==1120
    m.mem_write(0x691a0,seeded_state)
   m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,a.race_init_mode&65535))
   for reg,v in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,v)
   m.emu_start(0x9100,0x1000,count=1000000)
   assert m.reg_read(UC_X86_REG_SP)==0xf004,'Original race initializer did not return'
   chassis_before=bytes(m.mem_read(0x692f2,208))
   initial_race_snapshot=bytes(m.mem_read(0x691a0,1120))
  if a.test_player_position:
   assert a.race_init and a.update_race and a.capture_evidence,'Synthetic placement requires explicit full capture evidence'
   old=struct.unpack('<3i',bytes(m.mem_read(0x692f2,12)))
   delta=[target-source for target,source in zip(a.test_player_position,old)]
   assert all(value%64==0 for value in delta),'Test translation must retain fixed-point fractions'
   for base in [0,12]:
    values=struct.unpack('<3i',bytes(m.mem_read(0x692f2+base,12)))
    m.mem_write(0x692f2+base,struct.pack('<3i',*[value+delta[axis] for axis,value in enumerate(values)]))
   for base in [0x74,140]:
    for point in range(4):
     values=struct.unpack('<3h',bytes(m.mem_read(0x692f2+base+point*6,6)))
     m.mem_write(0x692f2+base+point*6,struct.pack('<3h',*[(value+delta[axis]//64+32768)%65536-32768 for axis,value in enumerate(values)]))
  assert 1<=a.driving_steps<=12000
  if a.update_race:
   assert a.full_player and a.race_init and a.recorded_inputs
   # Independent checkpoint arena; preserve original retained-state copy code.
   m.mem_write(0x6a724,struct.pack('<HH',0,0xb000));m.mem_write(0xb0000,bytes(1120*40))
  if a.recorded_inputs:assert 0<=a.input_start and a.input_start+a.driving_steps<=frames,'Requested controls outside the recording'
  initial_particle_random=list(bytes(m.mem_read(0x6a64e,6)))
  sequence=[];state_snapshots=[];first_finish=None
  for frame in range(a.driving_steps):
   control=replay[0x724+a.input_start+frame] if a.recorded_inputs else a.driving_step
   m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,control))
   for reg,v in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,v)
   if a.full_player:assert a.race_init,'Full player operation requires original navigation initialization'
   if a.full_player and not a.update_race:
    # Execute the original frame-clock increment before player_op, as the
    # enclosing update_gamestate does. This is not the interrupt audio timer.
    assert b[0x9677:0x967b]==bytes.fromhex('ff06e092')
    m.reg_write(UC_X86_REG_CS,0);m.emu_start(0x9677,0x967b,count=2)
    assert word(0x92e0)==frame+1,'Original frame clock did not advance'
   try:m.emu_start(0x9606 if a.update_race else 0x97e6,0x1000 if a.full_player else 0x9897,count=1000000)
   except Exception as error:
    address=m.reg_read(UC_X86_REG_CS)*16+m.reg_read(UC_X86_REG_IP)
    raise RuntimeError('Original driving frame '+str(frame+1)+' failed at '+hex(address)+'; recent calls '+json.dumps(recent_calls)+'; initialized-context parity is unproven') from error
   terminal=m.reg_read(UC_X86_REG_CS)*16+m.reg_read(UC_X86_REG_IP)
   assert terminal==0x9897 or (terminal==0x1000 and m.reg_read(UC_X86_REG_SP)==0xf004),'Combined original physics stage did not complete'
   if a.full_player:assert terminal==0x1000,'Complete original player operation did not return'
   sequence.append(bytes(m.mem_read(0x692f2,208)).hex())
   if a.state_output:state_snapshots.append(bytes(m.mem_read(0x691a0,1120)))
   if first_finish is None and bytes(m.mem_read(0x693bb,1))[0]==3:first_finish=frame+1
 after=bytes(m.mem_read(0x692f2,208))
 proposed_pose=dict(position=[struct.unpack('<i',bytes(m.mem_read(0x60000+at,4)))[0] for at in (0x96ca,0x96d2,0x96d6)],rotation=[struct.unpack('<h',bytes(m.mem_read(0x60000+at,2)))[0] for at in (0x906a,0x9692,0x96a4)])
 chassis=dict(before=chassis_before.hex(),after=after.hex(),position=list(struct.unpack_from('<3i',after)),rotation=list(struct.unpack_from('<3h',after,24)),crash=after[0xc9],proposedPose=proposed_pose,bodyEvents=body_events,landingTrace=landing_trace,opponentWrites=opponent_writes,drivingInput=a.driving_step,raceInitializerExecuted=a.race_init,fullPlayerExecuted=a.full_player,updateRaceExecuted=a.update_race,comparisonVerified=False)
 if analysis and 'collisionAllocation' in analysis:chassis['signMarkersAfter']=list(bytes(m.mem_read(0x6959a,len(analysis['collisionAllocation']['centres']))))
 if a.race_init:chassis['initialRaceSnapshot']=initial_race_snapshot.hex()
 if a.branch_coverage:chassis['changedBranchCoverage']=branch_coverage
 if a.driving_step is None:chassis['sequence']=chassis_sequence
 if a.driving_step is not None:
  chassis['sequence']=sequence
  chassis['inputs']=list(replay[0x724+a.input_start:0x724+a.input_start+a.driving_steps]) if a.recorded_inputs else [a.driving_step]*a.driving_steps
  chassis['firstFinishFrame']=first_finish
  chassis['recordedFinishTicks']=word(0x92e2)
  if a.state_output:
   assert a.update_race and a.state_output.is_absolute(),'Full-state output requires original update loop and absolute new path'
   with a.state_output.open('xb') as output:output.write(struct.pack('<H',len(state_snapshots))+b''.join(state_snapshots))
   if a.capture_evidence:
    import hashlib
    evidence={'captureSha256':hashlib.sha256(a.state_output.read_bytes()).hexdigest(),'replaySha256':hashlib.sha256(a.replay.read_bytes()).hexdigest(),'initialParticleRandom':initial_particle_random,'finalParticleRandom':list(bytes(m.mem_read(0x6a64e,6))),'frames':len(state_snapshots),'testOnly':True}
    if a.test_player_position:evidence['testPlayerPosition']=a.test_player_position
    if a.branch_coverage:evidence['changedBranchCoverage']=branch_coverage
    with a.capture_evidence.open('x') as output:json.dump(evidence,output)
for row in resource_rows:
 expected=resources(bank)[row['name']]
 assert bytes(m.mem_read(row['segment']*16+row['offset'],row['bytes']))==expected,'Track analysis overwrote GAME resource'
if a.opponent_car:assert a.opponent_car.read_bytes()==opponent_car_source
assert a.image.read_bytes()==b
for matrix in matrices:assert list(struct.unpack('<9h',bytes(m.mem_read(0x60000+matrix['destination'],18))))==matrix['values'],'Startup matrix overwritten'
print(json.dumps(dict(allocationBytes=0x6bf3,pointers=rows,rowTableWordsVerified=240,matrices=matrices,resources=resource_rows,opponentPrepared=opponent_prepared,carInitialized=car_initialized,chassis=chassis,selectionProbes=selection_probes,sourceUnchanged=True,trackContentsInitialized=loaded,trackAnalysis=analysis,chassisParity=False)))
