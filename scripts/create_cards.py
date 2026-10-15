from pathlib import Path
import argparse
import base64
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Image, Group, Polygon
from reportlab.graphics import renderPDF, renderSVG
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.units import mm
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

ROOT=Path(__file__).resolve().parents[1] 
OUT=ROOT/'output'
URL='https://daeung79.github.io/MeetMe/'
# Preserve source PNG alpha in PDF. The default graphics renderer uses inline
# images, which render transparent pixels as black in some PDF readers.
def transparent_image(renderer, image):
    renderer._canvas.drawImage(image.path,image.x,image.y,image.width,image.height,mask='auto')
renderPDF._PDFRenderer.drawImage=transparent_image
pdfmetrics.registerFont(TTFont('KR','/private/tmp/NotoSansKR-Regular.ttf'))
pdfmetrics.registerFont(TTFont('KR-B','/private/tmp/NotoSansKR-Bold.ttf'))
BLACK='#151719'; GOLD='#C7AC76'; IVORY='#F7F5EF'; GRAY='#61666B'
args=argparse.ArgumentParser(description='Generate card artwork')
args.add_argument('--svg-only',action='store_true',help='Generate SVG artwork without PDFs')
args.add_argument('--third-only',action='store_true',help='Add the right-aligned black and gold concept without replacing existing artwork')
args=args.parse_args()
for directory in (OUT/'cards',OUT/'pdf',ROOT/'tmp'/'pdfs'):
    directory.mkdir(parents=True,exist_ok=True)

def rect(d,x,y,w,h,c): d.add(Rect(x,y,w,h,fillColor=HexColor(c),strokeColor=None))
def round_rect(d,x,y,w,h,r,c): d.add(Rect(x,y,w,h,rx=r,ry=r,fillColor=HexColor(c),strokeColor=None))
def txt(d,x,y,t,size=24,color=BLACK,bold=False):
    d.add(String(x,y,t,fontName='KR-B' if bold else 'KR',fontSize=size,fillColor=HexColor(color)))
def pac_label(d,x,y,color):
    txt(d,x,y,'PAC',25.5,color)
    suffix_x=x+pdfmetrics.stringWidth('PAC','KR',25.5)+4
    txt(d,suffix_x,y,'(Public AI Champion)',17,color)
def line(d,x1,y1,x2,y2,c=GOLD,w=1): d.add(Line(x1,y1,x2,y2,strokeColor=HexColor(c),strokeWidth=w))
def logo(d,file,x,y,w,h): d.add(Image(x,y,w,h,str(ROOT/'assets'/file)))
def qr(d,x,y,size):
    q=QrCodeWidget(URL,barLevel='M',barBorder=4)
    x0,y0,x1,y1=q.getBounds(); g=Group(q); g.scale(size/(x1-x0),size/(y1-y0)); g.translate(-x0,-y0)
    outer=Group(g); outer.translate(x,y); d.add(outer)
def agencies(d):
    # Keep the agency lockup inside the card's safe area, so its background
    # never creates a full-width rule at the bottom edge.
    round_rect(d,34,10,832,78,13,'#FFFFFF')
    logo(d,'yangsan.png',101,31,132,37)
    logo(d,'mois.png',293,25.45,169,48.1)
    logo(d,'nia.png',522,31,277.5,37)

def front(theme):
    if theme == 'C':
        d=Drawing(900,500)
        rect(d,0,0,900,500,BLACK)
        txt(d,70,346,'오대웅',64,IVORY,True)
        pac_label(d,260,345,IVORY)
        txt(d,74,300,'양산시  |  지방전산주사',23,IVORY)
        line(d,73,265,135,265,GOLD,2)
        txt(d,74,211,'010-2886-5213',25,IVORY)
        txt(d,74,166,'odw0902@korea.kr',25,IVORY)
        right=842; left=580; center=(left+right)/2
        line(d,left,430,right,430,GOLD,1.5)
        line(d,right,430,right,402,GOLD,1.5)
        label='AI챔피언'; label_size=40
        txt(d,center-pdfmetrics.stringWidth(label,'KR-B',label_size)/2,372,label,label_size,GOLD,True)
        word='BLACK'; size=64; spacing=5
        width=sum(pdfmetrics.stringWidth(ch,'KR-B',size) for ch in word)+spacing*(len(word)-1)
        x=center-width/2
        for ch in word:
            txt(d,x,300,ch,size,GOLD,True)
            x+=pdfmetrics.stringWidth(ch,'KR-B',size)+spacing
        line(d,left,276,right,276,'#62583F',1)
        code='2026-BC0663(임시데이터)'
        txt(d,center-pdfmetrics.stringWidth(code,'KR',17)/2,244,code,17,'#AAA69D')
        tagline='BUILD · TEACH · SOLVE'
        txt(d,right-pdfmetrics.stringWidth(tagline,'KR',13),166,tagline,13,GOLD)
        agencies(d)
        return d
    d=Drawing(900,500); dark=theme=='A'; bg=BLACK if dark else IVORY; fg=IVORY if dark else BLACK
    rect(d,0,0,900,500,bg)
    if dark:
        # Subtle certificate-inspired frame, with no imitation official seal.
        line(d,690,112,844,266,'#38352E',1.4); line(d,731,112,855,236,'#38352E',1.4)
        line(d,760,112,865,217,'#38352E',1.4)
    else:
        rect(d,0,83,18,417,BLACK)
        rect(d,657,276,243,224,BLACK)
        txt(d,694,382,'BLACK',39,IVORY,True)
        txt(d,694,347,'AI CHAMPION',15,GOLD)
    txt(d,73,438,'AI챔피언',29,GOLD if dark else BLACK,True)
    if dark: txt(d,185,438,'BLACK',28,GOLD,True)
    txt(d,73,406,'2026-BC0663(임시데이터)',17,'#AAA69D' if dark else GRAY)
    txt(d,70,302,'오대웅',64,fg,True)
    pac_label(d,260,301,fg)
    txt(d,74,259,'양산시  |  지방전산주사',23,fg)
    line(d,73,225,135,225,GOLD,2)
    txt(d,74,180,'010-2886-5213',25,fg)
    txt(d,74,140,'odw0902@korea.kr',25,fg)
    txt(d,646,290 if dark else 142,'BUILD · TEACH · SOLVE',13,GOLD if dark else GRAY)
    agencies(d)
    return d

def back(theme):
    d=Drawing(900,500); rect(d,0,0,900,500,IVORY if theme=='A' else '#FFFFFF')
    txt(d,45,450,'PUBLIC SECTOR AI  /  PRACTICE & EDUCATION',14,GRAY)
    txt(d,46,398,'인재의 가치를 높이는 업스킬링,',36,BLACK,True)
    second_line='조직의 가치를 바꾸는 AI 혁신'
    txt(d,600-pdfmetrics.stringWidth(second_line,'KR-B',36),348,second_line,36,BLACK,True)
    line(d,46,324,600,324,'#C8C8C0',1)
    columns=[
        ('AI 연구 스킬',['26년 AI챔피언 블랙 등급','26년 인공지능을 활용한 행정혁신의 달인','26년 빅데이터분석기사','24년 데이터 분석 준전문가(ADsP-041014800)','24년 아키텍처준전문가(DAsP-057001770)','24년 SQL개발자(SQLD-054020931)']),
        ('연구 수상 실적',['25년 경상남도 혁신 우수사례 경진대회 대상 수상','25년 우수행정 및 정책사례 선발대회 최우수상 수상','25년 지방정부 AI혁신 공공행정 우수 지자체 입상','24년 공무원 정책연구 발표대회 인재개발원장상 수상','22년 제39회 지역정보화 연구과제 행안부장관상 수상','22년 지방자치단체 빅데이터 분석 우수사례 선정']),
    ]
    left=38; right=846; column_gap=24
    column_width=(right-left-column_gap)/2
    for index,(heading,items) in enumerate(columns):
        x=left+(column_width+column_gap)*index
        txt(d,x,291,heading,24,BLACK,True)
        for y,item in zip((260,227,194,161,128,95),items):
            txt(d,x,y,'· '+item,18,GRAY)
    rect(d,680,300,190,190,'#FFFFFF'); qr(d,680,300,190)
    round_rect(d,34,12,832,60,12,BLACK)
    #삭제
    txt(d,55,34,'로컬 AX 상담 · 업무자동화 강의 · 워크숍',21,IVORY,True)
    txt(d,607,35,'daeung79.github.io/MeetMe',15,'#D9C9A6')
    return d

def fit_to_86x52(original,front_side,background=BLACK):
    scale=860/900
    offset_y=(520-500*scale)/2
    fitted=Drawing(860,520)
    rect(fitted,0,0,860,520,background)
    art=Group(*original.contents)
    art.translate(0,offset_y)
    art.scale(scale)
    fitted.add(art)
    return fitted

def write_card_svg(name, drawing):
    path=OUT/'cards'/f'{name}.svg'
    renderSVG.drawToFile(drawing,str(path))
    if not name.startswith('c-'):
        return
    # Concept 03 is self-contained for sharing and previewing outside this repo.
    svg=path.read_text()
    for logo_name in ('yangsan.png','mois.png','nia.png'):
        asset=ROOT/'assets'/logo_name
        svg=svg.replace(str(asset),'data:image/png;base64,'+base64.b64encode(asset.read_bytes()).decode())
    fonts=''
    for family,weight in [('KR','Regular'),('KR-B','Bold')]:
        font_path=Path('/private/tmp/card-'+weight+'.ttf')
        if not font_path.exists(): font_path=Path('/private/tmp/NotoSansKR-'+weight+'.ttf')
        encoded=base64.b64encode(font_path.read_bytes()).decode()
        fonts+=f"@font-face{{font-family:'{family}';src:url(data:font/ttf;base64,{encoded}) format('truetype');}}"
    svg=svg.replace('<title>...</title>', '<defs><style type="text/css">'+fonts+'</style></defs><title>AI챔피언 BLACK 시안 03</title>',1)
    path.write_text(svg)

if args.third_only:
    additions=[fit_to_86x52(front('C'),True,BLACK),fit_to_86x52(back('A'),False,IVORY)]
    for name,d in zip(['c-front','c-back'],additions):
        write_card_svg(name,d)
    if args.svg_only:
        print('Created c-front.svg and c-back.svg without PDFs.')
        raise SystemExit(0)
    proof=canvas.Canvas(str(OUT/'pdf'/'business-card-concept-03.pdf'),pagesize=(210*mm,297*mm))
    proof.setTitle('03 BLACK & GOLD | AI챔피언 BLACK 오른쪽 배치')
    proof.setFillColor(HexColor('#EAE8E2'));proof.rect(0,0,210*mm,297*mm,fill=1,stroke=0)
    def caption(y,text,size=9,bold=False):
        proof.setFillColor(HexColor(BLACK));proof.setFont('KR-B' if bold else 'KR',size);proof.drawString(20*mm,y*mm,text)
    caption(279,'03  BLACK & GOLD / RIGHT SIGNATURE',16,True)
    caption(267,'1번 시안의 블랙·골드에 오른쪽 타이포그래피를 더한 구성')
    for d,y,label in zip(additions,[145,34],['FRONT','BACK']):
        caption(y+107,label,8)
        proof.saveState();proof.translate(20*mm,y*mm);proof.scale(170*mm/860,170*mm/860)
        renderPDF.draw(d,proof,0,0);proof.restoreState()
    caption(27,'완성 크기 86 × 52 mm  |  확대 시안  |  뒷면은 현재 1번 시안과 동일',8)
    caption(19,'인증번호는 현재 시안의 임시 데이터입니다. 블랙 취득 후 확정하세요.',8)
    proof.save()
    raw=ROOT/'tmp/pdfs/concept-03-raw.pdf'
    c=canvas.Canvas(str(raw),pagesize=(92*mm,58*mm))
    for i,d in enumerate(additions):
        c.setFillColor(HexColor(BLACK if i==0 else IVORY));c.rect(0,0,92*mm,58*mm,fill=1,stroke=0)
        c.saveState();c.translate(3*mm,3*mm);c.scale(.1*mm,.1*mm);renderPDF.draw(d,c,0,0);c.restoreState();c.showPage()
    c.save();writer=PdfWriter()
    for p in PdfReader(raw).pages:
        p.trimbox=RectangleObject([3*mm,3*mm,89*mm,55*mm]);p.bleedbox=p.mediabox;writer.add_page(p)
    with open(OUT/'pdf'/'business-card-03-draft.pdf','wb') as f:writer.write(f)
    trim=canvas.Canvas(str(OUT/'pdf'/'business-card-03-86x52mm.pdf'),pagesize=(86*mm,52*mm))
    trim.setTitle('오대웅 명함 앞뒤 86 × 52 mm')
    for d in additions:
        trim.saveState();trim.scale(.1*mm,.1*mm);renderPDF.draw(d,trim,0,0);trim.restoreState();trim.showPage()
    trim.save()
    print('Added concept 03: front/back SVG, proof PDF, 3mm bleed PDF, and exact-size 86x52mm PDF.')
    raise SystemExit(0)

cards=[fit_to_86x52(front('A'),True,BLACK),fit_to_86x52(back('A'),False,IVORY),fit_to_86x52(front('B'),True,IVORY),fit_to_86x52(back('B'),False,'#FFFFFF')]
third_cards=[fit_to_86x52(front('C'),True,BLACK),fit_to_86x52(back('A'),False,IVORY)]
for name,d in zip(['a-front','a-back','b-front','b-back','c-front','c-back'],cards+third_cards):
    write_card_svg(name,d)

# QR SVG: machine-generated and kept independent from decorative artwork.
qd=Drawing(300,300); rect(qd,0,0,300,300,'#FFFFFF'); qr(qd,0,0,300)
renderSVG.drawToFile(qd,str(ROOT/'assets'/'portfolio-qr.svg'))

if args.svg_only:
    print('Created 6 SVG cards and vector QR.')
    raise SystemExit(0)

def page_text(c,x,y,t,size=10,bold=False,color=BLACK):
    c.setFillColor(HexColor(color));c.setFont('KR-B' if bold else 'KR',size); c.drawString(x*mm,y*mm,t)
def proof_card(c,d,x,y,w=170):
    c.saveState();c.translate(x*mm,y*mm);c.scale(w*mm/860,w*mm/860);renderPDF.draw(d,c,0,0);c.restoreState()
c=canvas.Canvas(str(OUT/'pdf'/'business-card-concepts.pdf'),pagesize=(210*mm,297*mm))
c.setTitle('오대웅 AI챔피언 BLACK | 명함 3종 디자인 제안')
concept_pages=[
    ('01  BLACK & GOLD','추천안 · 블랙의 상징성과 공공기관의 신뢰감을 함께',cards[0],cards[1]),
    ('02  IVORY & BLACK','대안 · 밝은 바탕과 선명한 정보 중심 구성',cards[2],cards[3]),
    ('03  BLACK & GOLD / RIGHT SIGNATURE','블랙·골드 바탕에 오른쪽 타이포그래피를 더한 구성',third_cards[0],third_cards[1]),
]
for title,sub,front_card,back_card in concept_pages:
    c.setFillColor(HexColor('#EAE8E2'));c.rect(0,0,210*mm,297*mm,fill=1,stroke=0)
    page_text(c,20,279,title,17,True);page_text(c,20,269,sub,9)
    page_text(c,20,252,'FRONT',8,color=GRAY);proof_card(c,front_card,20,145)
    page_text(c,20,141,'BACK',8,color=GRAY);proof_card(c,back_card,20,34)
    page_text(c,20,27,'완성 크기 86 × 52 mm  |  위 이미지는 확대 시안입니다.',8)
    page_text(c,20,20,'블랙 인증 취득 예정 상태를 표기했습니다. 취득 후 인증 문구를 확정하세요.',8)
    page_text(c,20,13,'QR 연결 주소: https://daeung79.github.io/MeetMe/  ·  Pages 배포 후 사용',7,color=GRAY)
    c.showPage()
c.save()
print('Created concept PDF, 6 SVG cards, and vector QR.')
