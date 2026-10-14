"""Execute complete original BB11/MS91 engine routines on identical states.

Synthetic engine states only: this does not verify tracks or whole races.
Requires executable-memory permission for Unicorn on this host.
"""
import argparse, random, struct, sys, json
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('bb',type=Path);p.add_argument('ms',type=Path)
p.add_argument('--libraries',type=Path,required=True)
p.add_argument('--routine',choices=['engine','grip'],default='engine')
p.add_argument('--bb-cars',type=Path);p.add_argument('--ms-cars',type=Path)
p.add_argument('--state-dump',type=Path);p.add_argument('--car');p.add_argument('--replay',type=Path)
p.add_argument('--output',type=Path)
p.add_argument('--fps',type=int,choices=[10,20],default=20)
p.add_argument('--seed',type=int,default=19910225)
p.add_argument('--cases',type=int,default=1000)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP

sine_tables={}
def machine(path):
 image=path.read_bytes()
 pattern=struct.pack('<8H',0,101,201,302,402,503,603,704)
 location=image.find(pattern)
 assert location>=0 and image.find(pattern,location+1)<0,'Ambiguous original sine table'
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 sine_tables[m]=image[location:location+514]
 return m
bb,ms=machine(a.bb),machine(a.ms)
assert sine_tables[bb]==sine_tables[ms],'Original sine tables differ'
assert a.cases>0,'At least one diagnostic case is required'
randomizer=random.Random(a.seed)
cars=[]
if a.bb_cars or a.ms_cars:
 assert a.bb_cars and a.ms_cars,'Supply both original car directories'
 from extract import resources
 for path in sorted(a.bb_cars.glob('CAR*.RES')):
  bb_resource=resources(path.read_bytes())['simd']
  ms_resource=resources((a.ms_cars/path.name).read_bytes())['simd']
  assert bb_resource==ms_resource,('Car simulation resource differs',path.name)
  cars.append((path.name,bb_resource))
 assert len(cars)==11,('Expected all original cars',len(cars))
changed=0
oracle=[]
captured=None
recorded_inputs=None
if a.state_dump:
 assert a.fps==20,'Existing captured-state layout is validated only for 20 Hz'
 assert cars and a.car,'Captured-state mode requires original car directories and --car'
 captured=a.state_dump.read_bytes();frames=struct.unpack_from('<H',captured)[0]
 assert len(captured)==2+frames*1120,'Unexpected capture layout'
 car_resource=dict(cars)[a.car]
 if a.replay:
  replay=a.replay.read_bytes()
  assert len(replay)==0x724+frames and struct.unpack_from('<HH',replay,22)==(20,frames),'Expected matching 20 Hz recording'
  assert a.car=='CAR'+replay[:4].decode('ascii')+'.RES','Replay car does not match tuning'
  recorded_inputs=replay[0x724:]
cases=frames if captured is not None else a.cases
assert cases>0,'An empty state capture is not verification'
for case in range(cases):
 state=bytearray(0xd2);tuning=bytearray(0x100)
 def word(buf,offset,value):struct.pack_into('<H',buf,offset,value&65535)
 speed=randomizer.randrange(0,50000);rpm=randomizer.randrange(900,8000)
 for offset,value in [(0x22,rpm),(0x24,rpm),(0x2a,speed),(0x2c,speed),(0x2e,speed),(0x30,0x6000),(0x32,0x60),(0x36,randomizer.randrange(-400,400))]:word(state,offset,value)
 state[0xbe]=1;state[0xc0]=2;state[0xc1]=4
 state[0xcc]=0
 # Original SIMD: gears, mass, braking, RPM limits, ratios/knob points,
 # then torque samples and aerodynamic resistance.
 tuning[0]=5
 for offset,value in [(2,1200),(4,40),(6,900),(8,1800),(10,6500),(12,9000)]:word(tuning,offset,value)
 for gear in range(6):word(tuning,0xe+gear*2,0x6000//max(gear,1))
 tuning[0x3a]=100
 for offset in range(0x3b,0xdb):tuning[offset]=100
 input_byte=randomizer.choice([0,1,2,16,32])
 if a.routine=='grip':
  word(state,0x20,randomizer.randrange(-256,257))
  word(state,0x3e,randomizer.randrange(-64,65))
  state[0xc2:0xc6]=bytes(randomizer.choice([1,2,3,4]) for _ in range(4))
  state[0xc1]=sum(state[0xc2:0xc6])
  # Positive bounded synthetic grip table; original resources are a later gate.
  word(tuning,0xa4,500)
  for offset in range(0xb4,0xbe,2):word(tuning,offset,256)
 if cars:
  car_name,resource=cars[case%len(cars)]
  tuning=bytearray(resource)
  ratio=struct.unpack_from('<H',tuning,0x10)[0]
  word(state,0x30,ratio);word(state,0x32,ratio>>8)
 if captured is not None:
  offset=2+case*1120+338
  state=bytearray(captured[offset:offset+0xd2]);tuning=bytearray(car_resource)
  # Captures contain post-frame state, so use the following frame's input.
  if recorded_inputs is not None:input_byte=recorded_inputs[min(case+1,frames-1)]
 outputs=[]
 for m,entry,fps_address in [(bb,41592,0x96bc),(ms,41074,0x96dc)]:
  m.mem_write(0x60000,bytes(0x10000));m.mem_write(0x61000,bytes(state));m.mem_write(0x62000,bytes(tuning))
  if cars:
   # Original SIMD initialization replaces its last far pointer with the
   # allocated 64-word quadratic aerodynamic table. Raw resource bytes alone
   # leave this pointer unset and do not exercise real drag.
   resistance=struct.unpack_from('<h',tuning,56)[0]
   drag=[int(resistance*i*i/512)&65535 for i in range(64)]
   m.mem_write(0x63000,struct.pack('<64H',*drag))
   m.mem_write(0x62000+772,struct.pack('<HH',0x3000,0x6000))
  m.mem_write(0x60000+fps_address,struct.pack('<H',a.fps))
  if a.routine=='grip':
   m.mem_write(0x60000+(0x4c84 if m is bb else 0x4ca4),sine_tables[m])
   grass_table=0x688 if m is bb else 0x68e
   m.mem_write(0x60000+grass_table,struct.pack('<5H',255,256,192,128,64))
   entry=42966 if m is bb else 42326
   stack=struct.pack('<5H',0x1000,0,0x1000,0x2000,case%2)
  else:stack=struct.pack('<6H',0x1000,0,input_byte,0,0x1000,0x2000)
  m.mem_write(0x7f000,stack)
  for register,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x7000),(UC_X86_REG_SP,0xf000)]:m.reg_write(register,value)
  m.emu_start(entry,0x1000,count=10000)
  assert m.reg_read(UC_X86_REG_SP)==0xf004,'Routine did not return normally'
  outputs.append(bytes(m.mem_read(0x61000,len(state))))
 assert outputs[0]==outputs[1],f'{a.routine} mismatch in case {case}, input {input_byte}'
 if a.output:oracle.append({'before':state.hex(),'after':outputs[1].hex(),'tuning':tuning.hex(),'input':input_byte,'player':bool(case%2)})
 changed+=outputs[0]!=bytes(state)
assert changed>0,'Diagnostic did not exercise state updates'
print(f'Complete original BB11/MS91 {a.routine} routines match across {cases} '+('captured' if captured is not None else 'synthetic')+f' states; {changed} states updated')
if cars:print('Original byte-identical SIMD resources exercised: '+', '.join(name for name,_ in cars))
if a.output:
 with a.output.open('x') as output:json.dump({'routine':a.routine,'fps':a.fps,'cases':oracle},output)
