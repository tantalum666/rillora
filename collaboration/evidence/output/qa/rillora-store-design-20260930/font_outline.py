from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from pathlib import Path
import html
ROOT=Path('/Users/tantalum/Documents/电子遗嘱app')
FONTS={key:TTFont(ROOT/f'output/release/rillora-store-design-20260930/v1/fonts/{file}') for key,file in [('serif','source-serif-4-400.ttf'),('sans','inter-400.ttf'),('medium','inter-500.ttf')]}
MEASUREMENTS=[]
def text(value,x,y,size,color,font='serif',tracking=0):
 f=FONTS[font];cmap=f.getBestCmap();glyphs=f.getGlyphSet();scale=size/f['head'].unitsPerEm;cursor=0;parts=[]
 for char in value:
  name=cmap.get(ord(char))
  if not name:raise ValueError('Missing glyph '+repr(char))
  pen=SVGPathPen(glyphs);glyphs[name].draw(pen);parts.append(f'<path transform="translate({cursor:.3f} 0)" d="{pen.getCommands()}"/>');cursor+=f['hmtx'][name][0]+tracking/scale
 width=cursor*scale;MEASUREMENTS.append({'text':value,'x':x,'baseline':y,'size':size,'width':round(width,2),'font':font})
 return f'<g aria-label="{html.escape(value)}" fill="{color}" transform="translate({x} {y}) scale({scale} {-scale})">'+''.join(parts)+'</g>'
