"""Resolve scene descriptors using original executable names and shape banks."""
import argparse,json,struct
from pathlib import Path
from extract import resources,unpack

def generate(source,unpacked,output):
    output.mkdir(parents=True,exist_ok=True)
    memory=(unpacked/'MCGA-unpacked.bin').read_bytes();d=0x2d1a0
    banks={name:resources(unpack((source/(name+'.P3S')).read_bytes())) for name in ['GAME1','GAME2']}
    pointers={}
    def model(pointer):
        if pointer in pointers:return pointers[pointer]
        index,remainder=divmod(pointer-0x746e,22)
        if remainder or not 0<=index<116:raise ValueError('Unknown scene descriptor')
        name=memory[d+0x9b8+index*5:d+0x9bc+index*5].decode('ascii')
        bank=next((bank for bank,entries in banks.items() if name in entries),None)
        if bank is None:raise ValueError('Missing original scene model '+name)
        pointers[pointer]=bank+'.'+name;return pointers[pointer]
    def save(name,data):(output/(name+'.json')).write_text(json.dumps(data,separators=(',',':'))+'\n')
    rows=[None]*226
    for tile in [1,*range(4,226)]:
        at=d+0x2018+tile*14;_,rotation,shape,lod=struct.unpack_from('<h3H',memory,at)
        rows[tile]=dict(id=tile,rotation=rotation,shape=model(shape),detailShape=model(lod) if lod else None,paint=memory[at+9],overlay=memory[at+8],ignoreZBias=memory[at+10],multiTile=memory[at+11])
    save('track-render-models',rows)
    terrains=[]
    for tile in range(1,19):
        at=d+0x2bda+tile*14;rotation,pointer=struct.unpack_from('<2H',memory,at+2)
        terrains.append(dict(id=tile,shape=model(pointer),rotation=rotation))
    save('terrain-objects',terrains)
    model(0x7820);model(0x7df8)
    for style in range(4):model(struct.unpack_from('<H',memory,d+0x2ce4+style*14+4)[0])
    save('render-model-pointers',pointers)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ['source','unpacked','output']:p.add_argument(name,type=Path)
    a=p.parse_args();generate(a.source,a.unpacked,a.output)
