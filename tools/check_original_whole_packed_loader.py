"""Run original packed file loaders end-to-end with virtual DOS file services."""
import argparse,hashlib,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--resources',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
p.add_argument('--bitmap',action='store_true',help='Run packed EGA opponent-bank conversion/packing instead of the generic decoder')
p.add_argument('--bitmap-format',choices=['packed','planar','indexed'],default='packed')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INTR,UC_HOOK_CODE
from unicorn.x86_const import *
records=[];cases=0
for resource in sorted(a.resources.iterdir()):
 if not resource.is_file() or resource.suffix.upper() not in ('.PRE','.PVS','.VSH'):continue
 if a.bitmap and not(resource.suffix.upper()=='.PVS' and resource.name.upper().startswith('OPP')):continue
 packed=resource.read_bytes();size=int.from_bytes(packed[1:4],'little');pages=(size+15)//16;allocated=(pages+4)*16;assert 0x70000+allocated<0xf0000
 edition=[]
 for path,seg,entry,data_seg,firstfield,highest,fatal in [(a.legacy,0x209e,0x23d1,0x3209,0x4b12,0x4788,0xe),(a.modern,0x20e5,0x23d3,0x32a9,0x4bc0,0x4836,6)]:
  bitmap_entries={'packed':[(0x315d,0x22),(0x31fd,0x20)],'planar':[(0x30f2,0x20),(0x3192,0x1e)],'indexed':[(0x3059,0xa),(0x30e3,0)]}
  loader_seg,loader_entry=bitmap_entries[a.bitmap_format][int(path==a.modern)] if a.bitmap else (seg,entry)
  image=path.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);d=data_seg*16
  def put(at,value):m.mem_write(d+at,struct.pack('<H',value))
  for at,value in [(firstfield,0x1000),(firstfield+2,0x1000),(firstfield+4,0x1100),(firstfield+6,0x1100),(highest,0x7000),(0x100c,0),(0x100e,0x7000),(0x1010,1),(0x1110,0),(0x110e,0xf000)]:put(at,value)
  m.mem_write(d+0xd000,(resource.stem if a.bitmap else resource.name).encode()+b'\0');m.mem_write(0x70000,bytes([0xa5])*(0x20000 if a.bitmap else allocated));cursor=[0];events=[];dta=[d+0x80]
  def filename(uc):
   at=uc.reg_read(UC_X86_REG_DS)*16+uc.reg_read(UC_X86_REG_DX);out=bytearray()
   for i in range(65536):
    byte=uc.mem_read(at+i,1)[0]
    if not byte:return out.decode('latin1').upper()
    out.append(byte)
   raise AssertionError('unterminated DOS filename')
  def syscall(uc,number,user):
   assert number==0x21;ax=uc.reg_read(UC_X86_REG_AX);service=ax>>8
   if service==0x1a:dta[0]=uc.reg_read(UC_X86_REG_DS)*16+uc.reg_read(UC_X86_REG_DX);return
   if service in (0x3d,0x4e,0x43):
    found=not a.bitmap or filename(uc)==resource.name.upper()
    uc.reg_write(UC_X86_REG_EFLAGS,(uc.reg_read(UC_X86_REG_EFLAGS)&~1) if found else (uc.reg_read(UC_X86_REG_EFLAGS)|1))
    uc.reg_write(UC_X86_REG_AX,3 if found else 2)
    if found and service==0x4e:
     record=bytearray(43);struct.pack_into('<I',record,26,len(packed));record[30:30+len(resource.name)]=resource.name.encode();uc.mem_write(dta[0],bytes(record))
    if service==0x3d:cursor[0]=0;events.append('open')
    return
   elif service==0x3e:uc.reg_write(UC_X86_REG_AX,0);events.append('close')
   elif service==0x42:
    cursor[0]=len(packed) if ax&255==2 else 0;uc.reg_write(UC_X86_REG_AX,cursor[0]&65535);uc.reg_write(UC_X86_REG_DX,cursor[0]>>16);events.append('seek')
   elif service==0x3f:
    count=uc.reg_read(UC_X86_REG_CX);chunk=packed[cursor[0]:cursor[0]+count];at=uc.reg_read(UC_X86_REG_DS)*16+uc.reg_read(UC_X86_REG_DX)
    if chunk:uc.mem_write(at,chunk)
    cursor[0]+=len(chunk);uc.reg_write(UC_X86_REG_AX,len(chunk));events.append('read')
   else:raise AssertionError(hex(ax))
   uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1)
  def fatal_hook(uc,address,length,user):
   assert address!=seg*16+fatal,(resource.name,'unexpected original fatal')
  m.hook_add(UC_HOOK_INTR,syscall);m.hook_add(UC_HOOK_CODE,fatal_hook,begin=seg*16+fatal,end=seg*16+fatal)
  m.mem_write(d+0xf000,struct.pack('<3H',0x1000,0,0xd000))
  for reg,value in [(UC_X86_REG_CS,loader_seg),(UC_X86_REG_DS,data_seg),(UC_X86_REG_SS,data_seg),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(loader_seg*16+loader_entry,0x1000,count=20000000)
  assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_IP)==0x1000,resource.name
  assert (m.reg_read(UC_X86_REG_AX),m.reg_read(UC_X86_REG_DX))==(0,0x7000)
  resident=struct.unpack('<H',m.mem_read(d+firstfield+2,2))[0];assert resident==0x1012
  final_pages=struct.unpack('<H',m.mem_read(d+resident+12,2))[0]
  if a.bitmap:
   assert final_pages>0;whole=bytes(m.mem_read(0x70000,final_pages*16));edition.append({'pages':final_pages,'finalSha256':hashlib.sha256(whole).hexdigest(),'bytes':list(whole)})
  else:
   assert final_pages==pages;whole=bytes(m.mem_read(0x70000,allocated));edition.append({'size':size,'pages':pages,'finalSha256':hashlib.sha256(whole[:size]).hexdigest(),'allocationSha256':hashlib.sha256(whole).hexdigest(),'allocatedBytes':allocated})
  cases+=1
  assert path.read_bytes()==image
 assert edition[0]==edition[1],resource.name;assert resource.read_bytes()==packed;records.append({'name':resource.name,**edition[0]})
with a.output.open('x') as out:json.dump(records,out)
print(json.dumps({'wholeLoaderExecutions':cases,'shippedResources':len(records),'bothEditionsFullAllocationMatches':True,'onlyDOSServicesSimulated':True,'sourceFilesUnchanged':True,'pass':True}))
