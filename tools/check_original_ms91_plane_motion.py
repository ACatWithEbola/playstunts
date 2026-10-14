"""Original MS91 plane motion oracle, with optional original-matrix reprojection."""
import argparse,json,random,struct,sys
from pathlib import Path
from extract import resources,unpack
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('game',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
p.add_argument('--reproject',action='store_true')
p.add_argument('--seed',type=int,default=19910225,help='Repeatable independent geometry probe seed')
p.add_argument('--yaw',type=int,choices=[0,256,512,768],help='Force a cardinal angle for every plane')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_AX
image=a.image.read_bytes();bank=resources(unpack(a.game.read_bytes()))['plan']
assert image[0xbbd6:0xbbdc]==bytes.fromhex('558bec83ec36')
pattern=struct.pack('<8H',0,101,201,302,402,503,603,704);offset=image.find(pattern)
assert offset>=0 and image.find(pattern,offset+1)<0
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
r=random.Random(a.seed);rows=[]
for index in range(len(bank)//34):
    record=bank[index*34:(index+1)*34];values=struct.unpack('<17h',record)
    distance=r.randrange(-32768,32768);yaw=r.randrange(1024);wheel=r.randrange(-240,241)
    if a.yaw is not None:yaw=a.yaw
    dseg=offset-0x4ca4
    m.mem_write(0x60000,image[dseg:dseg+65536] if a.reproject else bytes(65536));m.mem_write(0x80000+index*34,record)
    m.mem_write(0x60000+0x4ca4,image[offset:offset+514])
    def word(at,value):m.mem_write(0x60000+at,struct.pack('<H',value&65535))
    car_roll=values[0]+r.randrange(-128,129) if a.reproject else values[0]
    car_pitch=values[1]+r.randrange(-128,129) if a.reproject else values[1]
    for at,value in [(0xa1ca,0),(0xa1cc,0x8000),(0xa1a2,index),(0xa19a,car_roll),(0xa19c,car_pitch),(0xa19e,yaw),(0xa1a0,wheel),(0x6ac,32767),(0x3398,32767)]:word(at,value)
    if a.reproject:
        # The optimized routine reads startup-generated cardinal matrices.
        # Unpacked file data alone leaves these runtime tables zero. Populate
        # them with the executable's own rotate-Y code, not web calculations.
        for destination,angle in [(0x5bb4,256),(0x5ba2,512),(0x5bce,768)]:
            m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,destination,angle))
            for reg,value in [(UC_X86_REG_CS,0x2df4),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
            m.emu_start(0x2df9c,0x1000,count=20000);assert m.reg_read(UC_X86_REG_SP)==0xf004
        m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,(-car_roll)&65535,(-car_pitch)&65535,(-yaw)&65535,0))
        for reg,value in [(UC_X86_REG_CS,0x1718),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
        m.emu_start(0x18622,0x1000,count=20000);assert m.reg_read(UC_X86_REG_SP)==0xf004
        matrix_pointer=m.reg_read(UC_X86_REG_AX)
        matrix=bytes(m.mem_read(0x60000+matrix_pointer,18))
        assert any(struct.unpack('<9h',matrix)),'Original rotation returned an uninitialized matrix'
        m.mem_write(0x60000+0x8fde,matrix)
    # Original math passes near pointers to stack vectors: SS must equal DS.
    m.mem_write(0x60000+0xa18e,struct.pack('<3h',0,0,distance));m.mem_write(0x6f000,struct.pack('<2H',0x1000,0))
    for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
    m.emu_start(0xbbd6,0x1000,count=20000);assert m.reg_read(UC_X86_REG_SP)==0xf004
    rows.append({'id':index,'roll':values[0],'pitch':values[1],'carRoll':car_roll,'carPitch':car_pitch,'rotation':list(values[8:]),'originalCarMatrix':list(struct.unpack('<9h',bytes(m.mem_read(0x60000+0x8fde,18)))) if a.reproject else None,'distance':distance,'yaw':yaw,'wheel':wheel,'result':list(struct.unpack('<3h',bytes(m.mem_read(0x60000+0xa194,6))))})
assert sum(any(row['result']) for row in rows)>len(rows)//2,'Diagnostic did not exercise motion'
with a.output.open('x') as f:json.dump(rows,f)
print('Generated '+('reprojected' if a.reproject else 'aligned')+' motion outputs for all '+str(len(rows))+' original planes')
