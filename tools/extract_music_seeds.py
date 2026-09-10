"""Initialize music from original scores/drivers in a fresh, bounded emulator."""
import argparse,json,struct
from pathlib import Path
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE,UC_HOOK_INSN,UC_HOOK_INTR
from unicorn.x86_const import *

def generate(source,unpacked,output):
    output.mkdir(parents=True,exist_ok=True);d=0x2d1a0
    original=bytearray((unpacked/'MCGA-unpacked.bin').read_bytes());original[d+0x53f4:d+0x10000]=bytes(0xac0c)
    for prefix,device,channels in [('', 'AD',10),('pc-','PC',5),('tandy-','TD',6),('mt32-','MT',16)]:
        driver=(source/(device+'15.DRV')).read_bytes()
        for name in ['TITL','SLCT','VICT','OVER']:
            u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,bytes(original));u.mem_write(0x39e10,driver);writes=[];port61=[0]
            if device=='PC':u.mem_write(0x39e10+0x1b7,bytes([127])*5)
            if device=='TD':u.mem_write(0x39e10+0x516,bytes([15])*6)
            def hook(uc,address,size,data):
                if device=='AD' and address==0x39e10+0x78c:
                    ax=uc.reg_read(UC_X86_REG_AX);writes.append([ax>>8,ax&255]);sp=uc.reg_read(UC_X86_REG_SP);ip=struct.unpack('<H',uc.mem_read(d+sp,2))[0];uc.reg_write(UC_X86_REG_SP,sp+2);uc.reg_write(UC_X86_REG_IP,ip)
            def out(uc,port,size,value,data):
                writes.append([port,value])
                if port==0x61:port61[0]=value
            def inp(uc,port,size,data):
                if port not in [0x61,0x331]:raise ValueError('Unexpected music hardware read')
                return port61[0] if port==0x61 else 0
            def interrupt(uc,number,data):
                if number!=0x1a:raise ValueError('Unexpected music interrupt')
            u.hook_add(UC_HOOK_CODE,hook);u.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);u.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN);u.hook_add(UC_HOOK_INTR,interrupt)
            def call(address,args):
                for reg in [UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS]:u.reg_write(reg,d//16)
                u.mem_write(d+0xe000,struct.pack('<'+'H'*(len(args)+2),0,0x7000,*args));u.reg_write(UC_X86_REG_SP,0xe000);u.reg_write(UC_X86_REG_CS,0x28f0)
                u.emu_start(address,0x70000,count=2000000)
                if u.reg_read(UC_X86_REG_CS)!=0x7000:raise ValueError('Music initialization exceeded its bound')
            bank=(source/('SKID'+name+'.KMS')).read_bytes();voice=(source/(device+'SKIDMS.VCE')).read_bytes()
            u.mem_write(0x80000,bank);u.mem_write(0x90000,voice);u.mem_write(d+0x6000,name.encode()+b'\0');call(0x28f06,[0,0x8000,0,0x9000,0x6000]);header=u.reg_read(UC_X86_REG_AX)
            u.mem_write(d+0x4ddc,struct.pack('<HH',0,0x39e1));u.mem_write(d+0x4de0,struct.pack('<'+'H'*channels,*[1<<i for i in range(channels)]))
            for at,value in [(0x9fe4,channels),(0x4e06,int(device=='MT')),(0x4e03,1),(0x4e02,0),(0x9f62,127)]:u.mem_write(d+at,bytes([value]))
            u.mem_write(d+0xa036,bytes(channels*46));call(0x28fa0,[header,0x8000]);u.mem_write(d+0x801e+16*72,bytes(8*72))
            read=lambda at,n:list(u.mem_read(at,n))
            seed=dict(markers=read(d+0x931a,24),masterVolume=127,commandArgument=read(d+0x70bd,1)[0],header=header,bank=read(0x80000,len(bank)),voices=list(voice),timers=[read(d+0x801e+72*i,72) for i in range(24)],hardware=[read(d+0xa036+46*i,46) for i in range(channels)],lastNotes=read(d+0x90e0,24),velocities=read(0x39e10+0x957,9),initialWrites=writes,percussion=[list(struct.unpack('<HH',u.mem_read(d+at,4))) for at in [0x70e4,0x7ff0,0x7ffc,0x9ade,0x897e,0x7fda,0x89ba]])
            if device!='AD':seed.update(driver=read(0x39e10,0x2df if device=='PC' else len(driver)),port61=port61[0])
            if device=='MT':seed.update(nullInstrument=read(0,100),systemVolume=read(d+0x4e08,4))
            (output/(prefix+'music-'+name.lower()+'-seed.json')).write_text(json.dumps(seed,separators=(',',':')))
    print('Generated 16 music initial states from original scores and drivers')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ['source','unpacked','output']:p.add_argument(name,type=Path)
    a=p.parse_args();generate(a.source,a.unpacked,a.output)
