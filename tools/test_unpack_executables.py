import unittest

from unpack_executables import decode_exepack_stream


class ExepackTests(unittest.TestCase):
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
