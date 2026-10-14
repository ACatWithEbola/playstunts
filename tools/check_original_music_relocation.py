"""Execute complete original sequence relocation on the four shipped scores.

All nested resource/string/memory helpers execute; no hardware/files in emulator.
"""
import argparse,json,struct,sys,hashlib,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('resources',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--initialize',action='store_true');p.add_argument('--start',action='store_true')
p.add_argument('--real-timer-reset',action='store_true',help='Execute original timer reset; only voice stop/update and driver output remain doubled')
p.add_argument('--first-tick',action='store_true',help='Execute the first original music timer update; trace driver services without hardware')
p.add_argument('--modern-mt15',type=Path,help='Run modern MT opening through original driver; PIT polls use one clock per latch, not CPU timing')
p.add_argument('--null-instrument-fixture',type=Path,help='Seed JSON supplying explicit IVT bytes for modern Title only; not original DOS memory proof')
p.add_argument('--pit-poll-clocks',type=int,default=1,help='Explicit PIT clocks per latch; no physical CPU claim')
p.add_argument('--mpu-poll-clocks',type=int,default=0,help='Explicit PIT clocks per MPU readiness poll')
p.add_argument('--opening-callbacks',type=int,default=1,help='Modern MT callback count; later dispatch uses explicit skip-on-busy policy, not outer IRQ')
p.add_argument('--voice-count-fixture',type=int,choices=range(17),help='Explicit installed logical voice count; not original driver installation proof')
p.add_argument('--voice-state-snapshots',action='store_true',help='Capture raw original voice records after each callback')
p.add_argument('--outer-irq',action='store_true',help='Execute original modern outer IRQ with explicit voice/music callback registration; nested IRQ injection and physical CPU timing remain unmodeled')
p.add_argument('--nested-irqs',action='store_true',help='Inject original nested IRQ body on virtual PIT crossings; one pending PIC edge while IF is disabled, no physical instruction latency')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE,UC_HOOK_INSN
from unicorn.x86_const import *
def resource(bank,key):
 count=struct.unpack_from('<H',bank,4)[0];base=6+count*8
 for i in range(count):
  if bank[6+i*4:10+i*4].upper()==key:return base+struct.unpack_from('<I',bank,6+count*4+i*4)[0]
 raise AssertionError(key)
rows=[]
assert not a.start or a.initialize,'--start requires --initialize'
assert not a.real_timer_reset or a.start,'--real-timer-reset requires --start'
assert not a.first_tick or a.real_timer_reset,'--first-tick requires --real-timer-reset'
assert not a.modern_mt15 or a.first_tick,'--modern-mt15 requires --first-tick'
assert not a.null_instrument_fixture or a.modern_mt15,'Null fixture requires actual modern MT15'
assert 1<=a.pit_poll_clocks<=100 and 0<=a.mpu_poll_clocks<=100,'Invalid virtual I/O clock policy'
assert 1<=a.opening_callbacks<=6000 and (a.opening_callbacks==1 or a.modern_mt15),'Later callbacks require actual modern driver'
assert not a.outer_irq or (a.modern_mt15 and a.opening_callbacks>1),'Outer IRQ requires modern driver and multiple callbacks'
assert not a.outer_irq or a.voice_count_fixture==16,'Outer IRQ corpus requires explicit16-voice installation fixture'
assert not a.nested_irqs or a.outer_irq,'Nested IRQs require outer IRQ execution'
for modern,path,segment,entry,ds in [(False,a.legacy,0x2daf,0x105e,0x3209),(True,a.modern,0x2e0e,0x1190,0x32a9)]:
 image=path.read_bytes()
 for name,device in [(name,device) for name in ['TITL','SLCT','VICT','OVER'] for device in (['AD','PC','TD','MT'] if a.initialize else [''])]:
  file=a.resources/('SKID'+name+'.KMS');bank=file.read_bytes();start=resource(bank,name.encode())
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x80000,bank)
  # Original near-name lookup receives stack-local names as DS offsets.
  # Preserve the DOS program's SS==DS contract; separate stack segments give
  # a false comparison by searching unrelated DS bytes for every local name.
  if a.initialize:
   voices=(a.resources/(device+'SKIDMS.VCE')).read_bytes();m.mem_write(0x90000,voices);m.mem_write(ds*16+0xe800,name.encode()+b'\0')
   m.mem_write(ds*16+0xf000,struct.pack('<7H',0x1000,0,0,0x8000,0,0x9000,0xe800))
  else:m.mem_write(ds*16+0xf000,struct.pack('<4H',0x1000,0,start,0x8000))
  for reg,val in [(UC_X86_REG_CS,segment),(UC_X86_REG_DS,ds),(UC_X86_REG_SS,ds),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,val)
  m.emu_start(segment*16+((0xe if modern else 2) if a.initialize else entry),0x1000,count=2000000)
  assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000,(modern,name,hex(m.reg_read(UC_X86_REG_IP)))
  after=bytes(m.mem_read(0x80000,len(bank)))
  row={'engine':'ms-1991' if modern else 'ms-1990','name':name,'device':device,'start':start,'sha256':hashlib.sha256(after).hexdigest(),'bytes':list(after)}
  if a.initialize:
   fields=[0x7744,0x864a,0x8656,0xa1ce,0x9038,0x8638,0x9074] if modern else [0x7544,0x844c,0x8458,0x9f3a,0x8dda,0x843a,0x8e16]
   row['header']=m.reg_read(UC_X86_REG_AX);assert m.reg_read(UC_X86_REG_DX)==0x8000
   row['percussion']=[list(struct.unpack('<2H',m.mem_read(ds*16+at,4))) for at in fields]
   assert bytes(m.mem_read(0x90000,len(voices)))==voices
   if a.start:
    timer_base,stride=(0x8678,76) if modern else (0x847a,72)
    driver_field,volume,reset=(0x4eba,0xa654,0x2a6) if modern else (0x4ddc,0xa3be,0x288)
    m.mem_write(ds*16+driver_field,struct.pack('<2H',0x100,0x7000));m.mem_write(ds*16+volume,b'\x7f')
    events=[]
    voice_stop,voice_update=(0x2f650+0x1332,0x2f650+0x10cc) if modern else (0x2edd0+0x12f4,0x2edd0+0x108e)
    def silent_service(uc,address,size,user):
     if a.real_timer_reset and address==segment*16+reset:
      events.append('reset');return
     services=[voice_stop,voice_update,0x70118] if a.real_timer_reset else [segment*16+reset,0x70118]
     if address not in services:return
     if a.real_timer_reset and address==voice_stop:
      sp=uc.reg_read(UC_X86_REG_SP);assert struct.unpack('<2H',uc.mem_read(ds*16+sp+4,4))==(0,15)
     if address in [voice_stop,voice_update]:
      sp=uc.reg_read(UC_X86_REG_SP);ip,cs=struct.unpack('<2H',uc.mem_read(ds*16+sp,4));uc.reg_write(UC_X86_REG_SP,(sp+4)&65535);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip);return
     events.append('reset' if address==segment*16+reset else 'driver')
     if address==segment*16+reset:uc.mem_write(ds*16+timer_base,bytes(24*stride))
     sp=uc.reg_read(UC_X86_REG_SP);ip,cs=struct.unpack('<2H',uc.mem_read(ds*16+sp,4));uc.reg_write(UC_X86_REG_SP,(sp+4)&65535);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
    startup_hook=m.hook_add(UC_HOOK_CODE,silent_service)
    m.mem_write(ds*16+0xf000,struct.pack('<4H',0x1000,0,row['header'],0x8000));m.reg_write(UC_X86_REG_SP,0xf000);m.reg_write(UC_X86_REG_CS,segment)
    m.emu_start(segment*16+(0xb8 if modern else 0x9c),0x1000,count=2000000)
    assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000
    assert events==['reset','driver']
    count=after[row['header']+7+after[row['header']+6]*4]
    row['tracks']=count;row['timers']=[list(m.mem_read(ds*16+timer_base+i*stride,stride)) for i in range(count)]
    row['accumulator']=struct.unpack('<H',m.mem_read(ds*16+(0x9a50 if modern else 0x97b8),2))[0]
    row['interval']=struct.unpack('<H',m.mem_read(ds*16+(0xa1c2 if modern else 0x9f2a),2))[0]
    row['actualTimerResetExecuted']=a.real_timer_reset
    if a.real_timer_reset:row['allTimers']=[list(m.mem_read(ds*16+timer_base+i*stride,stride)) for i in range(24)]
    if a.first_tick:
     # Driver initialization normally selects this controller-output path.
     # It is an explicit fixture here, not proof of original initialization.
     m.mem_write(ds*16+(0x4ee4 if modern else 0x4e06),b'\x01')
     row['controllerOutputEnabledByFixture']=True
     row['firstTickDispatchCount']=m.mem_read(ds*16+(0x8f9c if modern else 0x8d3e),1)[0]
     m.hook_del(startup_hook)
     driver_calls=[]
     actual_driver=bool(a.modern_mt15 and modern and device=='MT')
     port_state={'clock':0,'gate':0xa0,'start':None,'latch':65535,'high':False}
     nested_state={'next':11932,'pending':False,'delivered':0,'maskedEdges':0,'coalescedEdges':0}
     midi=[];waits=[]
     if actual_driver:
      row['voiceCountBeforeFixture']=m.mem_read(ds*16+0xa6d6,1)[0]
      row['voiceRecordsBeforeFirstCallback']=[list(m.mem_read(ds*16+0xa72a+index*46,46)) for index in range(16)]
      if a.voice_count_fixture is not None:
       m.mem_write(ds*16+0xa6d6,bytes([a.voice_count_fixture]))
       row['installedVoiceCountExplicitlySeeded']=a.voice_count_fixture
      if name=='TITL' and a.null_instrument_fixture:
       null_bytes=json.loads(a.null_instrument_fixture.read_text())['nullInstrument']
       assert len(null_bytes)==100 and all(isinstance(value,int) and 0<=value<=255 for value in null_bytes)
       m.mem_write(0,bytes(null_bytes))
       row['nullInstrumentMemoryExplicitlySeeded']=True
      with zipfile.ZipFile(a.modern_mt15) as archive:
       raw_driver=archive.read(next(n for n in archive.namelist() if n.upper().split('/')[-1]=='MT15.DRV'))
      # DRV internal data references require offset-zero loading in its segment.
      m.mem_write(0x70000,raw_driver)
      m.mem_write(ds*16+driver_field,struct.pack('<2H',0,0x7000))
      def port_out(uc,port,size,value,user):
       assert size==1
       if port==0x43 and value==0x80:
        assert port_state['start'] is not None
        port_state['clock']+=a.pit_poll_clocks;elapsed=port_state['clock']-port_state['start']
        assert 1<=elapsed<=32767
        port_state['latch']=65534-2*(elapsed-1);port_state['high']=False
       elif port==0x61:
        if value&1 and not port_state['gate']&1:port_state['start']=port_state['clock']
        elif not value&1 and port_state['gate']&1:
         waits.append(port_state['clock']-port_state['start']);port_state['start']=None
        port_state['gate']=value
       elif port==0x330:midi.append([port_state['clock'],value])
       else:assert port in (0x42,0x43) or (a.outer_irq and port==0x20)
      def port_in(uc,port,size,user):
       if port==0x61:return port_state['gate']
       if port==0x42:
        value=port_state['latch']>>8 if port_state['high'] else port_state['latch']&255
        port_state['high']=not port_state['high'];return value
       assert port==0x331;port_state['clock']+=a.mpu_poll_clocks;return 0
      m.hook_add(UC_HOOK_INSN,port_out,None,1,0,UC_X86_INS_OUT)
      m.hook_add(UC_HOOK_INSN,port_in,None,1,0,UC_X86_INS_IN)
     def trace_driver(uc,address,size,user):
      base=0x70000 if actual_driver else 0x70100
      if not base<=address<base+0x100:return
      if actual_driver and address-base not in (9,12,15,18,21,24,33):return
      sp=uc.reg_read(UC_X86_REG_SP)
      driver_calls.append({'offset':address-base,'arguments':list(struct.unpack('<8H',uc.mem_read(ds*16+sp+4,16)))})
      if actual_driver:return
      ip,cs=struct.unpack('<2H',uc.mem_read(ds*16+sp,4))
      uc.reg_write(UC_X86_REG_SP,(sp+4)&65535);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
     m.hook_add(UC_HOOK_CODE,trace_driver)
     tick_cs,tick_entry=(0x2f65,0x56) if modern else (0x2edd,0x5a)
     if actual_driver and a.outer_irq:
      # Explicit registration fixture, not DOS installation proof. Both
      # registered callback bodies execute, as does the complete original IRQ.
      hardware=ds*16+0xae
      m.mem_write(hardware+0x407a,struct.pack('<2I',0,0))
      for offset,value in [(0x4086,5),(0x4088,5),(0x408a,0),(0x408c,0)]:m.mem_write(hardware+offset,struct.pack('<H',value))
      for offset in (0x4083,0x408e,0x4090):m.mem_write(hardware+offset,b'\0')
      m.mem_write(hardware+0x4092,struct.pack('<6H',voice_update-tick_cs*16,tick_cs,tick_entry,tick_cs,0,0))
      if a.nested_irqs:
       nested=Uc(UC_ARCH_X86,UC_MODE_16);nested.mem_map(0,0x100000);nested.mem_write(0,image)
       nested.hook_add(UC_HOOK_INSN,lambda cpu,port,size,value,user:None,None,1,0,UC_X86_INS_OUT)
       nested.hook_add(UC_HOOK_INSN,lambda cpu,port,size,user:0,None,1,0,UC_X86_INS_IN)
       def reject_nested_callback(cpu,address,size,user):
        assert address not in (voice_update,tick_cs*16+tick_entry),('Nested IRQ reentered guarded callback',name,address)
       nested.hook_add(UC_HOOK_CODE,reject_nested_callback)
       def inject_nested(uc,address,size,user):
        while nested_state['next']<=port_state['clock']:
         nested_state['next']+=11932
         if not uc.reg_read(UC_X86_REG_EFLAGS)&0x200:
          nested_state['maskedEdges']+=1
          if nested_state['pending']:nested_state['coalescedEdges']+=1
         nested_state['pending']=True
        if not nested_state['pending'] or not uc.reg_read(UC_X86_REG_EFLAGS)&0x200:return
        # Port-clock movement occurs inside the registered guarded callback.
        # Independent nested CPU executes the complete ISR without touching
        # the interrupted instruction/stack or doubling its guarded services.
        assert uc.mem_read(hardware+0x408e,1)==b'\x01',('Nested edge outside callback',name,address)
        nested.mem_write(hardware+0x407a,bytes(uc.mem_read(hardware+0x407a,0x4092-0x407a)))
        nested.mem_write(hardware+0x4092,bytes(uc.mem_read(hardware+0x4092,12)))
        nested.mem_write(ds*16+0xf000,struct.pack('<3H',0x1000,0,0x202))
        for reg,value in [(UC_X86_REG_CS,0x20e5),(UC_X86_REG_DS,ds),(UC_X86_REG_SS,ds),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:nested.reg_write(reg,value)
        nested.emu_start(0x22755,0x1000,count=10000)
        assert nested.reg_read(UC_X86_REG_CS)==0 and nested.reg_read(UC_X86_REG_SP)==0xf006
        assert nested.mem_read(hardware+0x408e,1)==b'\x01'
        uc.mem_write(hardware+0x407a,bytes(nested.mem_read(hardware+0x407a,0x4092-0x407a)))
        nested_state['pending']=False;nested_state['delivered']+=1
       m.hook_add(UC_HOOK_CODE,inject_nested)
     snapshots=[]
     for tick in range(a.opening_callbacks if actual_driver else 64):
      if actual_driver and a.opening_callbacks>1:
       port_state['clock']=(port_state['clock']//11932+1)*11932
       if a.nested_irqs:nested_state['next']=port_state['clock']+11932
      if actual_driver and a.outer_irq:
       m.mem_write(ds*16+0xf000,struct.pack('<3H',0x1000,0,0x202));m.reg_write(UC_X86_REG_SP,0xf000);m.reg_write(UC_X86_REG_CS,0x20e5)
       m.emu_start(0x22755,0x1000,count=4000000)
       assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000 and m.reg_read(UC_X86_REG_SP)==0xf006,('outer IRQ did not return',name,tick)
       assert struct.unpack('<I',m.mem_read(hardware+0x407a,4))[0]==tick+1+nested_state['delivered'],('hardware count',name,tick)
       assert m.mem_read(hardware+0x408e,1)==b'\0',('callback guard not released',name,tick)
      else:
       if actual_driver and a.opening_callbacks>1:
        m.mem_write(ds*16+0xf000,struct.pack('<2H',0x1000,0));m.reg_write(UC_X86_REG_SP,0xf000);m.reg_write(UC_X86_REG_CS,tick_cs)
        m.emu_start(voice_update,0x1000,count=2000000)
        assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000
       m.mem_write(ds*16+0xf000,struct.pack('<2H',0x1000,0));m.reg_write(UC_X86_REG_SP,0xf000);m.reg_write(UC_X86_REG_CS,tick_cs)
       m.emu_start(tick_cs*16+tick_entry,0x1000,count=2000000)
      assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000,('opening tick did not return',modern,name,device,tick)
      if actual_driver and a.voice_state_snapshots:
       snapshots.append({'callback':tick,'voices':[list(m.mem_read(ds*16+0xa72a+index*46,46)) for index in range(16)]})
      if driver_calls and (not actual_driver or a.opening_callbacks==1):break
     row['openingTicksExecuted']=tick+1
     row['firstTickDriverCalls']=driver_calls
     row['actualModernMt15Executed']=actual_driver
     if actual_driver:
      row['openingMidiPitTrace']=midi;row['openingInstrumentWaits']=waits
      row['virtualPollPolicy']={'pit':a.pit_poll_clocks,'mpu':a.mpu_poll_clocks}
      row['openingCallbackPitClocks']=port_state['clock']
      row['outerIrqExecuted']=a.outer_irq;row['laterDispatchPolicy']='next11932clockBoundaryAfterReturn' if a.opening_callbacks>1 else 'firstCallbackOnly'
      if a.outer_irq:
       row['callbackRegistrationExplicitlySeeded']=True;row['nestedIrqInjection']=a.nested_irqs
       row['hardwareCounters']=list(struct.unpack('<2I',m.mem_read(hardware+0x407a,8)))
       assert row['hardwareCounters'][1]==row['hardwareCounters'][0]//5
       if a.nested_irqs:row['nestedIrqFixture']={**nested_state,'policy':'virtualPITCrossingsSinglePICPendingEdgeWhileIFDisabled','physicalInstructionLatencyModeled':False}
       row['finalVoiceRecords']=[list(m.mem_read(ds*16+0xa72a+index*46,46)) for index in range(16)]
      if a.voice_state_snapshots:row['voiceStateSnapshots']=snapshots
     if actual_driver:
      short=(200//a.pit_poll_clocks+1)*a.pit_poll_clocks
      long=(32500//a.pit_poll_clocks+1)*a.pit_poll_clocks
      assert waits[:5*count]==[short,short,short,short,long]*count,(name,waits)
      if name=='SLCT' and a.opening_callbacks==1:
       note_status=[[clock,value] for clock,value in midi if 0x90<=value<=0x9f]
       if (a.pit_poll_clocks,a.mpu_poll_clocks)==(1,0):
        assert note_status==[[33305,0x99],[66610,0x99],[99915,0x92],[133220,0x99],[166525,0x98],[199830,0x98]],note_status
       elif (a.pit_poll_clocks,a.mpu_poll_clocks)==(5,5):
        assert note_status==[[33440,0x99],[66890,0x99],[100340,0x92],[133790,0x99],[167240,0x98],[200690,0x98]],note_status
     row['firstTickAccumulatorAfter']=struct.unpack('<H',m.mem_read(ds*16+(0x9a50 if modern else 0x97b8),2))[0]
     row['firstTickOriginalSequenceAndVoiceBodiesExecuted']=True
  rows.append(row)
  assert file.read_bytes()==bank
 assert path.read_bytes()==image
with a.output.open('x') as out:json.dump(rows,out)
half=len(rows)//2
if a.first_tick and not a.modern_mt15:
 def semantic_calls(row):
  result=[]
  for call in row['firstTickDriverCalls']:
   offset,args=call['offset'],call['arguments']
   if offset==9:payload=[args[0],args[3],args[4]]
   elif offset==33:payload=[args[0],args[3],args[4]]
   elif offset==21:payload=args[:4]
   elif offset==18:payload=args[:3]
   else:raise AssertionError(('unclassified driver service',offset))
   result.append([offset,payload])
  return result
 for i in range(half):
  assert rows[i]['openingTicksExecuted']==1
  assert rows[i]['firstTickDriverCalls'],'No driver calls; cannot establish opening order'
  assert semantic_calls(rows[i])==semantic_calls(rows[i+half]),('edition opening order mismatch',rows[i]['name'],rows[i]['device'])
 # Menu really interleaves each instrument selection with its first note.
 # Moving all instrument calls before all notes would change original order.
 for row in rows:
  if row['name']=='SLCT' and row['device']=='MT':
   offsets=[call['offset'] for call in row['firstTickDriverCalls']]
   assert offsets==[18,33,9]*6+[18,33],offsets
print(json.dumps({'originalWholeInitializationCases' if a.initialize else 'originalWholeRelocationCases':len(rows),'allResourceHelpersExecuted':True,'actualTimerInitializerExecuted':a.start,'actualTimerResetExecuted':a.real_timer_reset,'resetAndDriverDoubled':a.start and not a.real_timer_reset,'voiceServicesAndDriverDoubledDuringStartup':a.real_timer_reset,'firstTickExecuted':a.first_tick,'firstTickHardwareDriverDoubledExceptModernMT':a.first_tick,'actualModernMt15Cases':sum(bool(row.get('actualModernMt15Executed')) for row in rows),'pitPollClockIsTestPolicy':bool(a.modern_mt15),'bothEditionHashesMatch':all(rows[i]['sha256']==rows[i+half]['sha256'] for i in range(half)),'noAudioOrLiveData':True,'pass':True}))
