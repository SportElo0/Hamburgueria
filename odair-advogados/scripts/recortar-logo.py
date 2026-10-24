# Recorta o logotipo enviado (foto JPG) em PNGs com transparência: dourado e marinho.
# Uso: python3 scripts/recortar-logo.py <logo.jpg> public/marca
from PIL import Image
import numpy as np, sys
src=sys.argv[1]; out=sys.argv[2]
im=Image.open(src).convert('RGB')
a=np.asarray(im).astype(float)
g=a[:,:,0]-a[:,:,2]; L=a.mean(axis=2)
alpha=np.maximum(np.clip((g-12)/70,0,1),np.clip((L-40)/90,0,1))
alpha[(g<5)]=0  # navy texture never counts
alpha[alpha<0.05]=0
bg=np.array([3,18,38],float)
al=np.maximum(alpha,1e-3)[...,None]
gold=np.clip((a-(1-al)*bg)/al,0,255)
def build(box,zero=None):
    x0,y0,x1,y1=box
    A=alpha[y0:y1,x0:x1].copy(); G=gold[y0:y1,x0:x1]
    if zero:
        zx0,zy0,zx1,zy1=zero; A[zy0-y0:zy1-y0, zx0-x0:zx1-x0]=0
    return A,G
def save(A,G,name,scale=2):
    rgba=np.dstack([G,A*255]).astype(np.uint8)
    img=Image.fromarray(rgba,'RGBA').resize((A.shape[1]*scale,A.shape[0]*scale),Image.LANCZOS)
    img.save(f'{out}/{name}-dourado.png',optimize=True)
    navy=np.zeros_like(rgba); navy[...,0]=7;navy[...,1]=27;navy[...,2]=46;navy[...,3]=rgba[...,3]
    Image.fromarray(navy,'RGBA').resize(img.size,Image.LANCZOS).save(f'{out}/{name}-marinho.png',optimize=True)
    print(name,img.size)
A,G=build((94,397,439,758),zero=(396,550,439,700)); save(A,G,'monograma')
A,G=build((402,560,1081,680)); save(A,G,'nome')
A,G=build((94,397,1081,758)); save(A,G,'assinatura')
