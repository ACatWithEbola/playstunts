"""Decode original menu art and text without a gameplay memory capture."""
import argparse,hashlib,json,struct
from pathlib import Path
from extract import resources,unpack

def convert_frame(frame):
    output=bytearray(frame);kind=frame[14]>>4
    if frame[15]&240 or not kind:return list(frame)
    if kind>3:raise ValueError('Unknown PVS layout')
    w,h=struct.unpack_from('<HH',frame);pixels=frame[16:]+bytes(65536)
    for y in range(h):
        for x in range(w):
            if kind==1:at=y+x*h
            elif kind==2:at=(y//2 if y%2==0 else (y+h)//2)+x*h
            else:at=x*((h+1)//2)+y//2 if y%2==0 else w*((h+1)//2)+x*(h//2)+y//2
            output[16+y*w+x]=pixels[at]
    return list(output)

def generate(source,unpacked,output):
    output.mkdir(parents=True,exist_ok=True);cache={}
    def raw(name):return (source/name).read_bytes()
    def entries(name):
        if name not in cache:cache[name]=resources(unpack(raw(name)) if Path(name).suffix.upper()!='.RES' else raw(name))
        return cache[name]
    def sha(name):return hashlib.sha256(raw(name)).hexdigest()
    def save(name,data):(output/(name+'.json')).write_text(json.dumps(data,separators=(',',':'))+'\n')
    specs=json.loads(Path(__file__).with_name('resource-selections.json').read_text())
    for name,spec in specs.items():
        if 'resources' not in spec:continue
        result=dict(source=spec['source'])
        if spec['includeHash']:result['sha256']=sha(spec['source'])
        result['resources']={key:list(entries(file)[item]) for key,(file,item) in spec['resources'].items()};save(name,result)
    for name,file in [('title-art','SDTITL.PVS'),('editor-art','SDTEDIT.PES')]:
        blob=unpack(raw(file));n=struct.unpack_from('<H',blob,4)[0];base=6+8*n
        offsets={blob[6+4*i:10+4*i].decode('ascii'):base+struct.unpack_from('<I',blob,6+4*n+4*i)[0] for i in range(n)}
        save(name,dict(source=file,sha256=sha(file),resources={key:dict(offset=offsets[key],length=len(data),sha256=hashlib.sha256(data).hexdigest(),bytes=list(data)) for key,data in entries(file).items()}))
    save('credits-art',dict(source='SDCRED.PES',sha256=sha('SDCRED.PES'),resources={k:list(v) for k,v in entries('SDCRED.PES').items()}))
    def images(file):return {name:convert_frame(frame) for name,frame in entries(file).items()}
    for name,file in [('car-menu-art','SDCSEL.PVS'),('opponent-menu-art','SDOSEL.PVS')]:
        spec=specs[name];descriptions={k:list(entries(f)[key]) for k,(f,key) in spec['descriptions'].items()}
        if spec['list']:descriptions=[descriptions[str(i)] for i in range(len(descriptions))]
        save(name,dict(source=file,conversion='Supplied24918 PVS pixel-order conversion',sha256=sha(file),resources=images(file),descriptions=descriptions))
    panoramas=[]
    for name in ['DESERT','TROPICAL','ALPINE','CITY','COUNTRY']:
        file=name+'.PVS';frames=images(file);panoramas.append(dict(source=file,sha256=sha(file),resources={key:frames[key] for key in ['scen','sce2','sce3','sce4']}))
    save('menu-panorama-art',panoramas)
    memory=(unpacked/'MCGA-unpacked.bin').read_bytes();d=0x2d1a0
    save('replay-bar-art',dict(source='SDGAME.PVS',sha256=sha('SDGAME.PVS'),keys=[memory[d+0x315e+i*4:d+0x315e+i*4+4].decode('ascii') for i in range(23)],bounds=list(memory[d+0x3212:d+0x325e]),resources=images('SDGAME.PVS')))

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('unpacked',type=Path);p.add_argument('output',type=Path);a=p.parse_args();generate(a.source,a.unpacked,a.output)
