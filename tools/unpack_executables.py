"""Reassemble and deterministically unpack the original EXEPACK executables."""
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

def decode_exepack_stream(data,destination_bytes):
    packed=bytearray(reversed(data));cursor=0
    while cursor<len(packed) and packed[cursor]==0xff:cursor+=1
    unpacked=bytearray()
    while cursor<len(packed):
        if cursor+3>len(packed):raise ValueError('Truncated EXEPACK command')
        opcode=packed[cursor];count=(packed[cursor+1]<<8)|packed[cursor+2];cursor+=3
        if opcode&0xfe==0xb0:
            if cursor>=len(packed):raise ValueError('Truncated EXEPACK fill command')
            unpacked.extend([packed[cursor]]*count);cursor+=1
        elif opcode&0xfe==0xb2:
            if cursor+count>len(packed):raise ValueError('Truncated EXEPACK copy command')
            unpacked.extend(packed[cursor:cursor+count]);cursor+=count
        else:raise ValueError(f'Unsupported EXEPACK opcode: {opcode:#x}')
        if len(unpacked)>destination_bytes:raise ValueError('EXEPACK output overflow')
        if opcode&1:break
    unpacked.extend(packed[cursor:])
    if len(unpacked)>destination_bytes:raise ValueError('EXEPACK trailing-data overflow')
    unpacked.reverse();return bytes(unpacked)

def unpack_exe(data,base=0x280):
    """Return the DOS load image after EXEPACK decompression and relocation.

    Parsing the documented EXEPACK stream is both safer and more portable than
    executing its 16-bit unpacker in a native CPU-emulation library.
    """
    if data[:2]!=b'MZ' or len(data)<28:raise ValueError('Expected DOS MZ executable')
    h=struct.unpack_from('<14H',data)
    header_end=h[4]*16;exepack_offset=(h[4]+h[11])*16
    if header_end>exepack_offset or exepack_offset+18>len(data):raise ValueError('Invalid EXEPACK offsets')
    real_ip,real_cs,_mem_start,exepack_size,real_sp,real_ss,dest_len,skip_len,signature=struct.unpack_from('<9H',data,exepack_offset)
    if 0x4252 not in (skip_len,signature) or not exepack_size:raise ValueError('Expected EXEPACK signature')
    unpacked=decode_exepack_stream(data[header_end:exepack_offset],dest_len*16)
    memory=bytearray(0x100000);load=base*16
    load_module=data[header_end:]
    if load+len(load_module)>len(memory):raise ValueError('Packed executable exceeds DOS memory')
    memory[load:load+len(load_module)]=load_module
    if load+len(unpacked)>len(memory):raise ValueError('Unpacked executable exceeds DOS memory')
    memory[load:load+len(unpacked)]=unpacked
    marker=b'Packed file is corrupt';relocations=data.find(marker,exepack_offset,exepack_offset+exepack_size)
    if relocations<0:raise ValueError('EXEPACK relocation table was not found')
    cursor=relocations+len(marker)
    for segment_index in range(16):
        if cursor+2>len(data):raise ValueError('Truncated EXEPACK relocation table')
        count=struct.unpack_from('<H',data,cursor)[0];cursor+=2
        for _ in range(count):
            if cursor+2>len(data):raise ValueError('Truncated EXEPACK relocation entry')
            offset=struct.unpack_from('<H',data,cursor)[0];cursor+=2
            address=load+segment_index*0x10000+offset
            if address+2>len(memory):raise ValueError('EXEPACK relocation exceeds DOS memory')
            value=(struct.unpack_from('<H',memory,address)[0]+base)&0xffff
            struct.pack_into('<H',memory,address,value)
    # Keep the decoded entry registers available to callers validating the file
    # layout, even though preparation only consumes the resulting memory image.
    if (base+real_cs)*16+real_ip>=len(memory) or (base+real_ss)*16+real_sp>=len(memory):
        raise ValueError('EXEPACK entry state exceeds DOS memory')
    return bytes(memory)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
    for mode in ['MCGA','EGA','CGA','TDY']:
        data=unpack_exe(assemble(a.original,mode));(a.output/(mode+'-unpacked.bin')).write_bytes(data)
    (a.output/'setup-unpacked.bin').write_bytes(unpack_exe((a.original/'SETUP.EXE').read_bytes(),0x1000))
