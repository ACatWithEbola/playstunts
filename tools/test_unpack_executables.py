import unittest
from pathlib import Path
from unittest.mock import patch
import struct

from unpack_executables import decode_exepack_stream,assemble


class ExepackTests(unittest.TestCase):
    def assemble_fixture(self,payload):
        header=bytearray(32);struct.pack_into('<H',header,8,2)
        files={'EGA.CMN':b'abcd','MCGA.COD':b'XYZtail','MCGA.HDR':bytes(header),'MCGA.DIF':struct.pack('<H',0x8004)+payload+b'\0\0'}
        with patch('unpack_executables.unpack',side_effect=lambda data:data),patch.object(Path,'read_bytes',lambda path:files[path.name]):
            return assemble(Path('/virtual-read-only-fixture'),'MCGA')

    def test_final_delta_can_repeat_matching_code_prefix(self):
        self.assertEqual(self.assemble_fixture(b'dXYZ')[32:],b'abcdXYZtail')

    def test_conflicting_boundary_delta_is_rejected(self):
        with self.assertRaisesRegex(ValueError,'conflicts with code boundary'):
            self.assemble_fixture(b'dBAD')

    def test_literal_and_fill_commands_decode_backwards(self):
        # Decoder reverses the stored stream, expands it, then reverses output.
        commands=bytes([0xb2,0,3,1,2,3,0xb1,0,2,4])
        self.assertEqual(decode_exepack_stream(bytes(reversed(commands)),5),bytes([4,4,3,2,1]))

    def test_destination_overflow_is_rejected(self):
        command=bytes([0xb1,0,3,9])
        with self.assertRaisesRegex(ValueError,'overflow'):
            decode_exepack_stream(bytes(reversed(command)),2)


if __name__=='__main__':
    unittest.main()
