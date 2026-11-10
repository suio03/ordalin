"""Generate synthetic test images with AI metadata, C2PA-like blocks, orientation and ICC.

Run: python3 tests/fixtures/make.py   (needs Pillow, sips, avifenc; writes into tests/fixtures/)
These are synthetic: real generator files for R13 are collected separately.
"""
import io
import os
import struct
import subprocess
import tempfile
import zlib

from PIL import Image, PngImagePlugin

HERE = os.path.dirname(os.path.abspath(__file__))
ICC = open('/System/Library/ColorSync/Profiles/Display P3.icc', 'rb').read()

XMP = '''<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
 xmp:CreatorTool="Adobe Firefly" Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia" photoshop:Credit="Made with Google AI"/>
</rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>'''.encode('utf-8')

SD_PARAMS = 'a cat astronaut, highly detailed\nNegative prompt: blurry\nSteps: 30, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 1234, Model: sdxl_base'


def picture(w=96, h=64):
    im = Image.new('RGB', (w, h))
    px = im.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = ((x * 7) % 256, (y * 11) % 256, ((x + y) * 5) % 256)
    return im


def exif_bytes(software='Adobe Firefly', orientation=6):
    e = Image.Exif()
    e[0x010F] = 'Canon'
    e[0x0110] = 'Canon EOS R5'
    e[0x0131] = software
    e[0x0112] = orientation
    e[0x0132] = '2026:11:02 10:00:00'
    return e.tobytes()  # starts with "Exif\0\0"


def fake_c2pa():
    """A JUMBF superbox shaped like a C2PA manifest store (not signed; detection test only)."""
    def box(t, data):
        return struct.pack('>I', 8 + len(data)) + t + data
    def jumd(label, uuid=b'c2pa' + bytes.fromhex('0011001080000' + '0aa00389b71')):
        return box(b'jumd', uuid[:16].ljust(16, b'\0') + b'\x03' + label + b'\0')
    def t(x):
        x = x.encode()
        return (bytes([0x60 + len(x)]) if len(x) < 24 else b'\x78' + bytes([len(x)])) + x
    claim = box(b'cbor', b'\xa2' + t('claim_generator') + t('ChatGPT image gen/1.0 c2pa-rs/0.40') + t('actions') + b'\x81\xa2' +
                t('action') + t('c2pa.created') + t('digitalSourceType') + t('http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia'))
    return box(b'jumb', jumd(b'c2pa') + box(b'jumb', jumd(b'c2pa.claim') + claim) + box(b'jumb', jumd(b'c2pa.signature') + box(b'cbor', b'\x00' * 32)))


def seg(marker, data):
    return b'\xff' + bytes([marker]) + struct.pack('>H', len(data) + 2) + data


def jpeg_ai():
    buf = io.BytesIO()
    picture().save(buf, 'JPEG', quality=90, exif=exif_bytes(), icc_profile=ICC)
    b = buf.getvalue()
    c2pa = fake_c2pa()
    app11 = seg(0xEB, b'JP' + b'\x00\x01' + struct.pack('>I', 1) + c2pa)
    xmp = seg(0xE1, b'http://ns.adobe.com/xap/1.0/\0' + XMP)
    com = seg(0xFE, b'Created with Midjourney --ar 3:2 --v 6')
    return b[:2] + xmp + com + app11 + b[2:]


def jpeg_camera():
    """Ordinary camera photo: EXIF only, no AI."""
    buf = io.BytesIO()
    picture().save(buf, 'JPEG', quality=90, exif=exif_bytes(software='Ver.1.0', orientation=1))
    return buf.getvalue()


def jpeg_phone():
    """Phone photo with personal data: GPS (São Paulo), serial number, author, date. No AI."""
    from PIL.TiffImagePlugin import IFDRational as R
    e = Image.Exif()
    e[0x010F] = 'Apple'
    e[0x0110] = 'iPhone 15'
    e[0x0131] = '18.1'
    e[0x0112] = 1
    e[0x0132] = '2026:11:02 10:00:00'
    e[0x013B] = 'Maria Souza'
    e[0x8769] = {0x9003: '2026:11:02 10:00:00', 0xA431: 'F2LXK0QJ1234'}
    e[0x8825] = {1: 'S', 2: (R(23), R(33), R(1234, 100)), 3: 'W', 4: (R(46), R(38), R(1056, 100))}
    buf = io.BytesIO()
    picture().save(buf, 'JPEG', quality=90, exif=e.tobytes())
    return buf.getvalue()


def jpeg_mpf():
    """Primary + secondary image with an MPF index, plus metadata between MPF and SOS to force an offset fix."""
    def plain(im):
        buf = io.BytesIO()
        im.save(buf, 'JPEG', quality=85)
        return buf.getvalue()
    primary = plain(picture())
    second = plain(picture(32, 24))
    # MPF: "MPF\0" + TIFF(BE) with IFD: version, count, MP entry
    def mpf_segment(second_offset, second_size, primary_size):
        tiff = bytearray(b'MM\x00\x2a' + struct.pack('>I', 8))
        n = 3
        ifd = struct.pack('>H', n)
        entries_off = 8 + 2 + n * 12 + 4
        ifd += struct.pack('>HHI4s', 0xB000, 7, 4, b'0100')
        ifd += struct.pack('>HHII', 0xB001, 4, 1, 2)
        ifd += struct.pack('>HHII', 0xB002, 7, 32, entries_off)
        ifd += struct.pack('>I', 0)
        entries = struct.pack('>IIIHH', 0x030000, primary_size, 0, 0, 0) + struct.pack('>IIIHH', 0x010001, second_size, second_offset, 0, 0)
        tiff += ifd + entries
        return seg(0xE2, b'MPF\0' + bytes(tiff))
    xmp = seg(0xE1, b'http://ns.adobe.com/xap/1.0/\0' + XMP)
    head = primary[:2]
    rest = primary[2:]
    placeholder = mpf_segment(0, 0, 0)
    mpf_tiff_pos = len(head) + 4 + 4  # marker+len, "MPF\0"
    total_primary = len(head) + len(placeholder) + len(xmp) + len(rest)
    second_offset = total_primary - mpf_tiff_pos
    mpf = mpf_segment(second_offset, len(second), total_primary)
    return head + mpf + xmp + rest + second


def png_chunk(t, data):
    return struct.pack('>I', len(data)) + t + data + struct.pack('>I', zlib.crc32(t + data) & 0xFFFFFFFF)


def png_sd():
    info = PngImagePlugin.PngInfo()
    info.add_text('parameters', SD_PARAMS)
    info.add_text('workflow', '{"3":{"class_type":"KSampler","inputs":{"seed":1}}}', zip=True)
    info.add_itxt('XML:com.adobe.xmp', XMP.decode('utf-8'))
    info.add_text('Title', 'holiday')
    buf = io.BytesIO()
    picture().save(buf, 'PNG', pnginfo=info, exif=exif_bytes(), icc_profile=ICC)
    b = buf.getvalue()
    # caBX before IEND
    return b[:-12] + png_chunk(b'caBX', fake_c2pa()) + b[-12:]


def webp_ai():
    buf = io.BytesIO()
    picture().save(buf, 'WEBP', quality=90, exif=exif_bytes(), xmp=XMP, icc_profile=ICC)
    b = bytearray(buf.getvalue())
    data = fake_c2pa()
    chunk = b'C2PA' + struct.pack('<I', len(data)) + data + (b'\0' if len(data) & 1 else b'')
    b += chunk
    b[4:8] = struct.pack('<I', len(b) - 8)
    return bytes(b)


def append_uuid_c2pa(b):
    data = bytes.fromhex('d8fec3d61b0e483c92975828877ec481') + b'\0\0\0\0manifest\0' + struct.pack('>Q', 0) + fake_c2pa()
    return b + struct.pack('>I', 8 + len(data)) + b'uuid' + data


def heic_ai(tmp):
    src = os.path.join(tmp, 'src.jpg')
    out = os.path.join(tmp, 'out.heic')
    open(src, 'wb').write(jpeg_ai())
    subprocess.run(['sips', '-s', 'format', 'heic', src, '--out', out], check=True, capture_output=True)
    return append_uuid_c2pa(open(out, 'rb').read())


def avif_ai(tmp):
    png = os.path.join(tmp, 'src.png')
    ex = os.path.join(tmp, 'exif.bin')
    xmp = os.path.join(tmp, 'xmp.xml')
    out = os.path.join(tmp, 'out.avif')
    picture().save(png)
    open(ex, 'wb').write(exif_bytes()[6:])
    open(xmp, 'wb').write(XMP)
    subprocess.run(['avifenc', '--exif', ex, '--xmp', xmp, png, out], check=True, capture_output=True)
    return append_uuid_c2pa(open(out, 'rb').read())


def main():
    with tempfile.TemporaryDirectory() as tmp:
        files = {
            'ai.jpg': jpeg_ai(),
            'camera.jpg': jpeg_camera(),
            'phone.jpg': jpeg_phone(),
            'mpf.jpg': jpeg_mpf(),
            'sd.png': png_sd(),
            'ai.webp': webp_ai(),
            'ai.heic': heic_ai(tmp),
            'ai.avif': avif_ai(tmp),
        }
    for name, data in files.items():
        open(os.path.join(HERE, name), 'wb').write(data)
        print(f'{name}: {len(data)} bytes')


if __name__ == '__main__':
    main()
