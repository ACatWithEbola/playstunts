"""Extract editor labels, palettes and terrain definitions from original resources."""
import argparse,hashlib,json,struct
from pathlib import Path
from extract import resources,unpack

def generate(source,unpacked,output):
    output.mkdir(parents=True,exist_ok=True)
    raw=(source/'TEDIT.PRE').read_bytes();blob=unpack(raw);r=resources(blob);sha=hashlib.sha256(raw).hexdigest()
    m=(unpacked/'MCGA-unpacked.bin').read_bytes();d=0x2d1a0
    def save(name,data):(output/(name+'.json')).write_text(json.dumps(data,separators=(',',':')))
    count=struct.unpack_from('<H',blob,4)[0];base=6+8*count
    offsets={blob[6+4*i:10+4*i].decode('ascii'):base+struct.unpack_from('<I',blob,6+4*count+4*i)[0] for i in range(count)}
    texts={k:v.rstrip(b'\0').decode('ascii') for k,v in r.items() if k.startswith('e')}
    keys=['e'+m[d+0x348c+3*i:d+0x348f+3*i].decode('ascii') for i in range(15)]
    save('editor-error-keys',dict(source='Original DS:348c, editor status resource keys',keys=keys))
    save('editor-resources',dict(textResources=texts,source='TEDIT.PRE',sha256=sha,palettePages=[list(r['pbox'][i:i+36]) for i in range(0,396,36)],validationMessages=[dict(code=i,resource=k,text=texts[k]) for i,k in enumerate(keys[:12])],resources={k:list(r[k]) for k in ['snam','mnam','tnam']}))
    save('editor-terrain-presets',[dict(name='ter'+str(i),sourceOffset=offsets['ter'+str(i)],terrain=list(blob[offsets['ter'+str(i)]:offsets['ter'+str(i)]+901])) for i in range(5)])
    save('editor-palette-memory',dict(source='TEDIT.PRE',sha256=sha,offset=offsets['pbox'],bytes=list(blob[offsets['pbox']:offsets['pbox']+512])))
    save('editor-terrain-art',dict(source='Original editor DS:3504 referenced at 0x1c453',names=[m[d+0x3504+4*i:d+0x3508+4*i].decode('ascii') for i in range(19)]))
    rows=[]
    for i in range(len(r['snam'])//4):
        key=r['tnam'][i*3:i*3+3].decode('ascii');label='e'+key
        rows.append(dict(id=i,small=r['snam'][i*4:i*4+4].decode('ascii'),large=r['mnam'][i*4:i*4+4].decode('ascii'),nameKey=key,labelResource=label,label=texts[label]))
    save('editor-tile-art',rows)
    raw=(source/'GAME2.P3S').read_bytes();r=resources(unpack(raw))
    save('overview-ground-models',dict(source='GAME2.P3S',sha256=hashlib.sha256(raw).hexdigest(),resources={k:list(r[k]) for k in ['hig1','hig2','hig3']}))

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ['source','unpacked','output']:p.add_argument(name,type=Path)
    a=p.parse_args();generate(a.source,a.unpacked,a.output)
