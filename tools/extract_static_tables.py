"""Extract original initialized tables without a gameplay memory capture."""
import argparse,hashlib,json,struct
from pathlib import Path

def generate(unpacked,output):
    output.mkdir(parents=True,exist_ok=True)
    def save(name,data): (output/(name+'.json')).write_text(json.dumps(data,separators=(',',':'))+'\n')
    memory=(unpacked/'MCGA-unpacked.bin').read_bytes();d=0x2d1a0
    word=lambda p:struct.unpack_from('<H',memory,d+p)[0]
    vector=lambda p:list(struct.unpack_from('<3h',memory,d+p))
    objects=[];records=[];points=[];vectors=[];samples=[];speeds=[]
    for tile in range(198):
        at=0x2018+tile*14;ptr=word(at);count=memory[d+ptr] if ptr else 0
        if count>8:raise ValueError('Unsupported route descriptor')
        rows=[list(memory[d+ptr+i*14:d+ptr+(i+1)*14]) for i in range(count)]
        objects.append(dict(id=tile,rotation=word(at+2),surface=memory[d+at+9]+1,multiTile=memory[d+at+11],physics=memory[d+at+12]))
        records.append(dict(id=tile,sourceOffset=ptr,records=rows))
        speeds.append(memory[d+at+9]);pp=[];vv=[];ss=[]
        for r in rows:
            primary=r[8]+r[9]*256;alternate=r[10]+r[11]*256
            def block(address):return [vector(address+i*6) for i in range(r[5]*2)] if address else None
            pp.append(dict(primary=block(primary),alternate=block(alternate)))
            vv.append([vector((alternate if direction and alternate else primary)+r[5]*12+(12 if direction else 6)) for direction in [0,1]])
            ss.append([vector((alternate if direction and alternate else primary)+r[5]*12) for direction in [0,1]])
        points.append(dict(id=tile,records=pp));vectors.append(dict(id=tile,vectors=vv));samples.append(dict(id=tile,vectors=ss))
    for tile in range(198,256):
        at=0x2018+tile*14
        objects.append(dict(id=tile,rotation=word(at+2),surface=memory[d+at+9]+1,multiTile=memory[d+at+11],physics=memory[d+at+12]))
    for name,value in [('track-objects',objects),('route-records',records),('route-point-vectors',points),('route-vectors',vectors),('route-sample-vectors',samples),('route-speed-indices',speeds)]:save(name,value)
    islands={'MCGA':[],'CGA':[(0x530a,16),(0x6862,460),(0x70c8,2)],'TDY':[(0x522e,16),(0x63d2,460),(0x6ad6,2)],'EGA':[(0x6130,4),(0x7eb4,9),(0x8e2c,16),(0x9112,30),(0x9a40,2),(0xb218,8),(0xbe4e,8)]}
    modes={}
    for mode,label in [('MCGA','mcga'),('CGA','cga'),('TDY','tandy'),('EGA','ega')]:
        b=(unpacked/(mode+'-unpacked.bin')).read_bytes()
        if b[0x1ec30]!=0xbf or b[0x1ec96:0x1ec9c]!=bytes.fromhex('2bcf33c0f3aa'):raise ValueError('Unsupported executable revision')
        segment=struct.unpack_from('<H',b,0x1ec31)[0];start=struct.unpack_from('<H',b,0x1ec91)[0];end=struct.unpack_from('<H',b,0x1ec94)[0]
        data=b[segment*16:segment*16+start]
        modes[label]=dict(displayData=[dict(offset=at,data=b[0x209e0+at:0x209e0+at+size].hex()) for at,size in islands[mode]],segment=segment,clearStart=start,clearEnd=end,data=data.hex(),dataSha256=hashlib.sha256(data).hexdigest(),unpackedSha256=hashlib.sha256(b).hexdigest())
    save('native-initial-data',dict(source='Supplied executables; EXEPACK unpack only; initialized data before original C runtime zeroing range',modes=modes))

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('unpacked',type=Path);p.add_argument('output',type=Path);a=p.parse_args();generate(a.unpacked,a.output)
