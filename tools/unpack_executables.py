"""Reassemble original display executables and run only their EXEPACK unpacker."""
import argparse,json,struct
from pathlib import Path
from extract import unpack

def assemble(source,mode):
    common=bytearray(unpack((source/'EGA.CMN').read_bytes()))
    if mode!='EGA':
        diff=unpack((source/(mode+'.DIF')).read_bytes());at=0;target=-1
        while at<len(diff):
            delta=struct.unpack_from('<H',diff,at)[0];at+=2
            if not delta:break
            target+=delta&32767;count=4 if delta&32768 else 2
            if target<0 or target+count>len(common) or at+count>len(diff):raise ValueError('Invalid executable delta')
            common[target:target+count]=diff[at:at+count];at+=count
    header=(source/(mode+'.HDR')).read_bytes();code=unpack((source/(mode+'.COD')).read_bytes())
    offset=struct.unpack_from('<H',header,8)[0]*16
    if offset<len(header):raise ValueError('Invalid MZ header size')
    return header+bytes(offset-len(header))+common+code

def unpack_exe(data,base=0x280):
    from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
    from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_IP,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_EFLAGS
    if data[:2]!=b'MZ':raise ValueError('Expected DOS MZ executable')
    h=struct.unpack_from('<14H',data);u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000)
    u.mem_write(base*16,bytes(data[h[4]*16:]));stub=h[4]*16+h[11]*16
    ip,cs=struct.unpack_from('<HH',data,stub);target=(base+cs)*16+ip
    for reg,value in [(UC_X86_REG_CS,base+h[11]),(UC_X86_REG_IP,h[10]),(UC_X86_REG_SS,base+h[7]),(UC_X86_REG_SP,h[8]),(UC_X86_REG_DS,base-16),(UC_X86_REG_ES,base-16),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
    u.emu_start((base+h[11])*16+h[10],target,count=15000000)
    if u.reg_read(UC_X86_REG_CS)*16+u.reg_read(UC_X86_REG_IP)!=target:raise ValueError('Unpacker did not reach the expected entry point')
    return bytes(u.mem_read(0,0x100000))

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
    for mode in ['MCGA','EGA','CGA','TDY']:
        data=unpack_exe(assemble(a.original,mode));(a.output/(mode+'-unpacked.bin')).write_bytes(data)
    (a.output/'setup-unpacked.bin').write_bytes(unpack_exe((a.original/'SETUP.EXE').read_bytes(),0x1000))
