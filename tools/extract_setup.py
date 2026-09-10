"""Extract the supplied SETUP.EXE's configuration text; does not emulate its menu."""
import argparse
import hashlib
import json
from pathlib import Path

SOUND = ['Internal PC speaker', 'Tandy sound', 'Ad Lib card',
         'Sound Blaster card', 'Roland MT-32', 'No music or sound effects']
VIDEO = ['CGA graphics', 'Hercules graphics', 'EGA graphics',
         'Tandy graphics', 'MCGA/VGA graphics']

def extract(data):
    def text(label):
        needle = label.encode('ascii') + b'\0'
        offset = data.find(needle)
        if offset < 0 or data.find(needle, offset + 1) >= 0:
            raise ValueError(f'Expected one exact setup string: {label}')
        return {'text': label, 'fileOffset': offset}
    # Help paragraphs are consecutive NUL-terminated display lines in this version.
    def paragraph(start, end):
        a = data.index(start.encode('ascii'))
        b = data.index(end.encode('ascii'), a + len(start))
        lines = [line.decode('ascii') for line in data[a:b].split(b'\0') if line]
        return {'fileOffset': a, 'lines': lines}
    return {
        'source': 'SETUP.EXE', 'sha256': hashlib.sha256(data).hexdigest(),
        'evidence': 'Exact strings from supplied executable; menu control flow and device implementations are not established by this extraction.',
        'soundOptions': [text(s) for s in SOUND],
        'videoOptions': [text(s) for s in VIDEO],
        'mainOptions': [text(s) for s in ['Video display', 'Sound option', 'Install game to hard disk', 'Exit']],
        'soundHelp': paragraph('Select if you want the', 'Select the port where the'),
        'videoHelp': paragraph('Select if you have CGA', 'Select if you want the'),
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    result = extract(args.source.read_bytes())
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(f"Extracted {len(result['soundOptions'])} sound and {len(result['videoOptions'])} video labels")
