"""Original MS91 HIG row, including real string/time helpers and cadence restore."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.modern.read_bytes();cases=0
for cadence,ticks in itertools.product([10,20],[0,1,19,20,776,948,1199,1200,12000,32767,32768,65534,65535]):
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 m.mem_write(0x60000,image[0x32a90:0x32a90+65536])
 raw=bytearray(52);raw[:6]=b'MARCO\0';raw[17:22]=b'INDY\0';raw[42:44]=b' \0';struct.pack_into('<H',raw,50,ticks)
 m.mem_write(0x90000,bytes(raw));m.mem_write(0x699f2,struct.pack('<2H',0,0x9000))
 m.mem_write(0x6ae74,struct.pack('<H',0));m.mem_write(0x696dc,struct.pack('<H',cadence))
 m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,0,0x5000))
 for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0xbeef),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
 m.emu_start(0x40ae,0x1000,count=50000)
 offsets=list(m.mem_read(0x65000,4));fields=[]
 for offset in offsets:
  value=bytes(m.mem_read(0x6b0e6+offset,80)).split(b'\0')[0];fields.append(value.decode('ascii'))
 count=0 if ticks==65535 else ticks
 minutes=count//1200;seconds=count%1200//20;hundredths=count%20*5
 expected=f'{minutes:2d}:{seconds:02d}.{hundredths:02d}'
 assert fields==['MARCO','INDY',' ',expected],(cadence,ticks,fields,expected)
 assert struct.unpack('<H',m.mem_read(0x696dc,2))[0]==cadence
 assert bytes(m.mem_read(0x90000,52))==bytes(raw)
 assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_BP)==0xbeef
 cases+=1
entry_cases=0
for cadence,ticks in itertools.product([10,20],[0,1,650,32767,32768,65534,65535]):
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 m.mem_write(0x696dc,struct.pack('<H',cadence));m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,ticks))
 for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
 m.emu_start(0x41e8,0x41fa,count=20)
 assert m.reg_read(UC_X86_REG_IP)==0x41fa
 assert struct.unpack('<H',m.mem_read(0x6f004,2))[0]==((ticks<<1)&65535 if cadence==10 else ticks)
 assert struct.unpack('<H',m.mem_read(0x696dc,2))[0]==cadence
 entry_cases+=1
assert a.modern.read_bytes()==image
print(json.dumps({'originalExecutedScoreRows':cases,'cadences':[10,20],
 'scoreTimesAlways20Hz':True,'activeCadenceRestored':True,'sourceRecordsUnchanged':True,
 'originalEntryPrefixCases':entry_cases,'10HzCandidateDoubledBeforeQualification':True,
 'realStringAndTimeHelpers':True,'noFileOrAudioServices':True,'pass':True}))
