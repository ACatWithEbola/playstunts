"""Recover opponents, shape masks and display tables from supplied original files."""
import argparse,hashlib,json,struct
from pathlib import Path
from extract import resources,unpack,shape
from extract_menu_assets import convert_frame

def generate(source,unpacked,output):
    output.mkdir(parents=True,exist_ok=True)
    def save(name,data):
        target=output/(name+'.json');target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(json.dumps(data,separators=(',',':')))
    def digest(data):return hashlib.sha256(data).hexdigest()
    speeds=[];costs=[]
    for i in range(1,7):
        name=f'OPP{i}.PRE';raw=(source/name).read_bytes();blob=unpack(raw);entries=resources(blob)
        speeds.append(dict(source=name,sha256=digest(raw),speedTable=list(entries['sped'][:16])))
        count=struct.unpack_from('<H',blob,4)[0];base=6+8*count
        names=[blob[6+4*j:10+4*j] for j in range(count)]
        offset=base+struct.unpack_from('<I',blob,6+4*count+4*names.index(b'sped'))[0]
        costs.append(dict(source=name,sha256=digest(raw),spedOffset=offset,costPrefix=list(blob[offset:]),requiresAdjacentMemoryFrom=len(blob)-offset))
        art={};sources={name:digest(raw)}
        for mode in ['WIN','LOSE']:
            file=f'OPP{i}{mode}.PVS';data=(source/file).read_bytes();sources[file]=digest(data)
            art[mode.lower()]={k:convert_frame(v) for k,v in resources(unpack(data)).items()}
        save(f'opponent-evaluation/{i}',dict(sources=sources,conversion='Supplied24918 PVS conversion; original bytes and artwork preserved',resources={k:list(v) for k,v in entries.items() if k.startswith(('ed','ev')) or k in ['lose','winn','enam']},art=art))
    save('opponent-speed-tables',speeds);save('opponent-path-cost-prefix',costs)
    masks={};sources={}
    for file in sorted(source.glob('*.P3S')):
        raw=file.read_bytes();entries=resources(unpack(raw));masks[file.stem]={};sources[file.stem]=dict(source=file.name,sha256=digest(raw))
        for name,data in entries.items():
            nv,np=data[0],data[1];base=4+nv*6
            masks[file.stem][name]=dict(include=list(struct.unpack_from('<'+str(np)+'I',data,base)),exclude=list(struct.unpack_from('<'+str(np)+'I',data,base+np*4)))
    save('shape-visibility',dict(sources=sources,shapes=masks))
    raw=(source/'GAME.PRE').read_bytes();game=resources(unpack(raw))
    wall=game['wall']
    save('collision-walls',dict(sourceSha256=digest(raw),resource='wall',walls=[dict(id=i//6,orientation=v[0],origin=list(v[1:])) for i in range(0,len(wall),6) for v in [struct.unpack_from('<3h',wall,i)]]))
    plan=game['plan'];planes=[]
    for i in range(0,len(plan),34):
        v=struct.unpack_from('<17h',plan,i)
        planes.append(dict(id=i//34,roll=v[0],pitch=v[1],origin=list(v[2:5]),normal=list(v[5:8]),rotation=list(v[8:17])))
    save('collision-planes',planes)
    memory=(unpacked/'MCGA-unpacked.bin').read_bytes();setup=(unpacked/'setup-unpacked.bin').read_bytes()
    ega=(unpacked/'EGA-unpacked.bin').read_bytes()
    save('ega-display-palette',dict(source='Supplied EGA build DS:5334, BIOS INT10 AX1002 packet',registers=list(ega[0x32090+0x5334:0x32090+0x5334+17])))
    save('setup-initial-data',dict(source='Supplied SETUP.EXE data-segment image through DS:164D; used only as data, never executed; no captured session state',sourceSha256=digest((source/'SETUP.EXE').read_bytes()),data=setup[0x12340:0x12340+5710].hex()))
    palette=resources(unpack((source/'SDMAIN.PVS').read_bytes()))['!pal'][16:]
    save('track-materials',dict(sourceAddress=0x32064,indices=list(struct.unpack_from('<129H',memory,0x32064)),palette=[v*4 for v in palette],animation=list(memory[0x2d1a0+0x8b4:0x2d1a0+0x8c4])))

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ['source','unpacked','output']:p.add_argument(name,type=Path)
    a=p.parse_args();generate(a.source,a.unpacked,a.output)
