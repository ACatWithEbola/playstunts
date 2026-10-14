"""Native busy-stop with explicitly delivered native sample IRQ, not PC timing."""
import argparse,sys,zipfile,struct,json,hashlib,base64
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('package',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--replacement',action='store_true');p.add_argument('--chain',action='store_true');p.add_argument('--delays',type=int,nargs='+',default=[3,7,19]);a=p.parse_args();sys.path.insert(0,str(a.libraries))
if any(delay<1 or delay>1000 for delay in a.delays):p.error('IRQ instruction delays must be between 1 and 1000')
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE,UC_HOOK_INSN
from unicorn.x86_const import *
digest=hashlib.sha256(a.package.read_bytes()).hexdigest()
with zipfile.ZipFile(a.package) as z:driver=z.read(next(n for n in z.namelist() if n.upper().endswith('TD15.DRV')))
assert hashlib.sha256(driver).hexdigest()=='45baeedce5368fc07aea9f1e0ecd444fe5e943cc2730db2efe235d5fa561ca24'
rows=[]
for differential in [False,True]:
 for delay in a.delays:
  state=bytearray(driver);state[0x595]=255;state[0x582]=0;state[0x592]=0x80;state[0x5a6]=0
  for at,value in [(0x578,0x100),(0x57a,0x3000),(0x57c,0x106),(0x57e,0x101),(0x580,0x3000),(0x588,0x1234),(0x58a,0x5678),(0x58e,2),(0x590,2)]:struct.pack_into('<H',state,at,value)
  if a.chain:struct.pack_into('<H',state,0x590,1)
  vector=struct.pack('<HH',0xae4 if differential else 0xa66,0x2000);writes=[];delivered=False;waiting=0;wait_flags=[]
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,bytes(state));m.mem_write(0x20,vector);m.mem_write(0x30100,bytes([128,55,134,217,44,128,128]));m.mem_write(0x6f000,struct.pack('<HH',0xf000,0x2000))
  request=dict(channel=0,offset=0x200,segment=0x3000,frequency=8000,repeats=1,picMask=0x80)
  # Explicit doubled prior IRQ handler: identifiable port write then IRET.
  # Proves chain ordering, not the original game's complete callback body.
  m.mem_write((0x5678<<4)+0x1234,bytes([0xb0,0x5a,0xe6,0x80,0xcf]))
  sample=bytearray(64);sample[4]=6 if differential else 0;struct.pack_into('<H',sample,8,6);sample[50:56]=bytes([128,55,134,217,44,128]);m.mem_write(0x30200,bytes(sample))
  # Independent control: withhold IRQ delivery and verify the native wait does
  # not return or clear busy. Instruction bound is not a hardware-time claim.
  withheld=Uc(UC_ARCH_X86,UC_MODE_16);withheld.mem_map(0,0x100000);withheld.mem_write(0,bytes(m.mem_read(0,0x100000)))
  for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:withheld.reg_write(reg,value)
  withheld.emu_start(0x20a48,0x2f000,count=1000)
  assert withheld.reg_read(UC_X86_REG_IP)!=0xf000 and bytes(withheld.mem_read(0x20595,1))==b'\xff'
  pending=bytes(withheld.mem_read(0x20000,len(driver)))
  if a.replacement:m.mem_write(0x6f000,struct.pack('<7H',0xf000,0x2000,0,0x200,0x3000,8000,1))
  def main_out(cpu,port,size,value,user):writes.append([port,value])
  def main_in(cpu,port,size,user):assert port==0x21;return request['picMask']
  m.hook_add(UC_HOOK_INSN,main_out,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,main_in,None,1,0,UC_X86_INS_IN)
  def deliver(machine,address,size,user):
   global delivered,waiting
   current=bytes(machine.mem_read(0x20000,len(driver)))
   if delivered or current[0x57e:0x580]!=b'\xff\xff' or current[0x582]!=1:return
   flags=machine.reg_read(UC_X86_REG_EFLAGS);wait_flags.append(flags)
   if not flags&0x200:return
   waiting+=1
   if waiting<delay:return
   irq=Uc(UC_ARCH_X86,UC_MODE_16);irq.mem_map(0,0x100000);irq.mem_write(0,bytes(machine.mem_read(0,0x100000)))
   irq.mem_write(0x6e000,struct.pack('<HHH',0xf000,0x2000,0x202))
   def out(cpu,port,size,value,user):writes.append([port,value])
   irq.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT)
   for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xe000)]:irq.reg_write(reg,value)
   irq.emu_start(0x20000+(0xae4 if differential else 0xa66),0x2f000,count=10000)
   assert irq.reg_read(UC_X86_REG_SP)==0xe006
   machine.mem_write(0x20000,bytes(irq.mem_read(0x20000,len(driver))));machine.mem_write(0x20,bytes(irq.mem_read(0x20,4)));delivered=True
  m.hook_add(UC_HOOK_CODE,deliver)
  for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  # 0A48 is an internal near-return helper, not a public far callback.
  m.emu_start(0x20ba5 if a.replacement else 0x20a48,0x2f000,count=10000);assert delivered and m.reg_read(UC_X86_REG_SP)==(0xf004 if a.replacement else 0xf002)
  rows.append(dict(chain=a.chain,replacement=a.replacement,request=request,sample=list(sample),differential=differential,delay=delay,waitFlags=wait_flags,before=base64.b64encode(state).decode(),pending=base64.b64encode(pending).decode(),after=base64.b64encode(bytes(m.mem_read(0x20000,len(driver)))).decode(),vectorBefore=list(vector),vectorAfter=list(m.mem_read(0x20,4)),writes=writes))
assert digest==hashlib.sha256(a.package.read_bytes()).hexdigest()
with a.output.open('x') as f:json.dump(rows,f)
print(str(len(rows))+' original raw/differential '+('replacement' if a.replacement else 'busy-stop')+' cases finish only after explicitly delivered native IRQ; full state/ports captured, package unchanged, not hardware timing')
