"""Make a 'before clicks' copy of a deck: drop every shape that only appears after a click."""
import json, sys, zipfile, re
from lxml import etree
src, spec, out = sys.argv[1:4]
spec = json.load(open(spec))
NS = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
steps = []
zin = zipfile.ZipFile(src); zout = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
for info in zin.infolist():
    data = zin.read(info.filename)
    m = re.fullmatch(r'ppt/slides/slide(\d+)\.xml', info.filename)
    if m:
        idx = int(m.group(1)) - 1
        hide, inclick = set(), False
        for it in spec[idx]:
            if it['trig'] == 'click': inclick = True
            if inclick: hide.add(it['name'])
        root = etree.fromstring(data)
        for c in root.iterfind('.//p:cNvPr', NS):
            if c.get('name') in hide:
                el = c.getparent().getparent()
                el.getparent().remove(el)
        for t in root.iterfind('p:timing', NS): root.remove(t)
        data = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    zout.writestr(info, data)
zout.close()
print(json.dumps([any(i['trig'] == 'click' for i in s) for s in spec]))
