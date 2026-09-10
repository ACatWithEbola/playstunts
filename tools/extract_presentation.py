"""Generate original presentation resources from supplied DOS assets."""
import argparse,json,hashlib,struct
from pathlib import Path
from extract import unpack,resources,shape
from extract_menu_assets import convert_frame

def generate(source,output):
    output.mkdir(parents=True,exist_ok=True)
    def save(name,data):(output/(name+'.json')).write_text(json.dumps(data,separators=(',',':'))+'\n')
    raw=(source/'TITLE.P3S').read_bytes();save('intro-shapes',dict(source='TITLE.P3S',sha256=hashlib.sha256(raw).hexdigest(),resources={k:dict(sha256=hashlib.sha256(v).hexdigest(),bytes=list(v),shape=shape(v)) for k,v in resources(unpack(raw)).items() if k in ['brav','logo','log2']}))
    frame=bytes(convert_frame(resources(unpack((source/'SDMSEL.PVS').read_bytes()))['scrn']));(output/'main-menu-art.bin').write_bytes(frame)
    raw=(source/'ADENG1.VCE').read_bytes();count=struct.unpack_from('<H',raw,4)[0];base=6+8*count;voices={raw[6+4*i:10+4*i].decode('ascii'):raw[base+struct.unpack_from('<I',raw,6+4*count+4*i)[0]:base+struct.unpack_from('<I',raw,6+4*count+4*i)[0]+100] for i in range(count)};save('adlib-voices',dict(source='ADENG1.VCE',sha256=hashlib.sha256(raw).hexdigest(),voices={k:list(v[:100]) for k,v in voices.items()}))
    text=resources((source/'CRED.RES').read_bytes());recipe=json.loads(Path(__file__).with_name('credits-layout-recipe.json').read_text())
    save('credits-layout',dict(source='original 2F62..353E and CRED.RES; palette words retained from loaded executable',text=[dict(text=text[row['resource']].rstrip(b'\0').decode('ascii'),**{k:v for k,v in row.items() if k!='resource'}) for row in recipe]))
    from PIL import Image,ImageDraw,ImageFont
    image=Image.frombytes('P',(320,200),frame[16:]);image.putpalette([v*4 for v in resources(unpack((source/'SDMAIN.PVS').read_bytes()))['!pal'][16:]])
    image.convert('RGB').save(output/'menu.png')
    site=output.parent/'site';site.mkdir(exist_ok=True)
    icon=Image.new('RGB',(64,64),'#070b0e');draw=ImageDraw.Draw(icon)
    font=ImageFont.truetype(str(Path(__file__).resolve().parents[1]/'vendor/runtime/site/fonts/archivo-italic-variable.ttf'),58)
    draw.text((32,31),'S',font=font,fill='#fcf420',anchor='mm');icon.save(output.parent/'stunts-favicon.png')
    title=convert_frame(resources(unpack((source/'SDTITL.PVS').read_bytes()))['titl']);cover=Image.frombytes('P',(320,200),bytes(title[16:]));cover.putpalette(image.getpalette());cover.save(site/'game-title.png')
    cursor=convert_frame(resources(unpack((source/'SDMAIN.PVS').read_bytes()))['smou'])
    pointer=Image.new('RGBA',(16,10));pointer.putdata([{0:(0,0,0,0),1:(0,0,170,255),15:(255,255,255,255)}[v] for v in cursor[16:]])
    pointer.resize((48,30),Image.Resampling.NEAREST).save(site/'original-pointer.png')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('output',type=Path);a=p.parse_args();generate(a.source,a.output)
