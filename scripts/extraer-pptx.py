"""Saca las fotos originales de los catálogos en PowerPoint del cliente y las deja en assets/
con el nombre del producto. Copia los bytes tal cual (sin recomprimir ni recortar).
Escribe assets/ORIGEN.md con la diapositiva, el archivo interno y la huella MD5 de cada foto.

Uso (solo hace falta si llega un catálogo nuevo; los .pptx no se suben al repositorio):
    python -I scripts/extraer-pptx.py

La correspondencia diapositiva → producto se revisó a mano mirando cada foto junto al nombre
y el precio de su diapositiva. Si cambia el PowerPoint, revisar MAPA antes de correrlo.
"""
import hashlib
import os
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MATERIAL = os.path.join(RAIZ, '_material-cliente')
SALAS = 'CATALOGO SALAS HOME PREMIUM(2).pptx'
CAMAS = 'CATALOGO BASE CAMAS.pptx'

# (catálogo, diapositiva, archivo interno, destino en assets/)
MAPA = [
    (SALAS, 4, 'image10.png', 'salas/sala-l-baul-y-sofa-cama-1.png'),
    (SALAS, 4, 'image11.png', 'salas/sala-l-baul-y-sofa-cama-2.png'),
    (SALAS, 5, 'image12.png', 'salas/sala-l-baul-especial-y-sofa-cama-1.png'),
    (SALAS, 6, 'image13.png', 'salas/sala-cubo-pequena-1.png'),
    (SALAS, 6, 'image14.png', 'salas/sala-cubo-pequena-2.png'),
    (SALAS, 7, 'image16.png', 'salas/sala-rinonera-1.png'),
    (SALAS, 7, 'image15.png', 'salas/sala-rinonera-2.png'),
    (SALAS, 8, 'image17.png', 'salas/sala-rinonera-rajada-1.png'),
    (SALAS, 9, 'image18.png', 'salas/sala-cubo-grande-1.png'),
    (SALAS, 9, 'image19.png', 'salas/sala-cubo-grande-2.png'),
    (SALAS, 10, 'image21.png', 'salas/sala-audi-1.png'),
    (SALAS, 10, 'image20.png', 'salas/sala-audi-2.png'),
    (SALAS, 11, 'image23.png', 'salas/sala-brazo-en-h-1.png'),
    (SALAS, 11, 'image22.png', 'salas/sala-brazo-en-h-2.png'),
    (SALAS, 12, 'image24.png', 'salas/sala-l-1.png'),
    (SALAS, 12, 'image25.png', 'salas/sala-l-2.png'),
    (SALAS, 13, 'image26.png', 'salas/sala-l-baul-1.png'),
    (SALAS, 13, 'image27.png', 'salas/sala-l-baul-2.png'),
    (SALAS, 14, 'image28.png', 'salas/sala-huevo-1.png'),
    (SALAS, 14, 'image29.png', 'salas/sala-huevo-2.png'),
    (SALAS, 15, 'image31.png', 'salas/sala-huevo-con-carro-1.png'),
    (SALAS, 15, 'image30.png', 'salas/sala-huevo-con-carro-2.png'),
    (SALAS, 16, 'image32.png', 'sofas-cama/sofa-cama-150-1.png'),
    (SALAS, 16, 'image33.png', 'sofas-cama/sofa-cama-150-2.png'),
    (SALAS, 17, 'image34.png', 'sofas-cama/sofa-cama-180-1.png'),
    (SALAS, 17, 'image35.png', 'sofas-cama/sofa-cama-180-2.png'),
    (CAMAS, 3, 'image9.png', 'bases-cama/base-cama-capitoneada-luces-led-1.png'),
    (CAMAS, 4, 'image12.png', 'bases-cama/base-cama-espejo-m-piecero-1.png'),
    (CAMAS, 5, 'image13.png', 'bases-cama/base-cama-nube-rayada-1.png'),
    (CAMAS, 6, 'image14.png', 'bases-cama/base-cama-nube-almeja-1.png'),
    (CAMAS, 7, 'image15.png', 'bases-cama/base-cama-m-espejo-1.png'),
    (CAMAS, 8, 'image17.png', 'bases-cama/base-cama-trenzada-led-espejo-1.png'),
    (CAMAS, 9, 'image18.png', 'bases-cama/base-cama-trenzada-piecero-1.png'),
    (CAMAS, 10, 'image19.png', 'bases-cama/base-cama-trenzada-1.png'),
    (CAMAS, 11, 'image20.png', 'bases-cama/base-cama-reina-1.png'),
    (CAMAS, 12, 'image21.png', 'bases-cama/base-cama-triangulo-1.png'),
    (CAMAS, 13, 'image22.png', 'bases-cama/base-cama-capitoneada-cuadrada-1.png'),
    (CAMAS, 14, 'image23.png', 'bases-cama/base-cama-rajada-piecero-1.png'),
    (CAMAS, 15, 'image24.png', 'bases-cama/base-cama-capitoneada-copete-1.png'),
    # Piezas del catálogo que NO son foto de producto: se guardan como referencia.
    (SALAS, 1, 'image7.jpg', '../_material-cliente/extraido/portada-catalogo-salas.jpg'),
    (SALAS, 3, 'image9.jpg', '../_material-cliente/extraido/promo-gira-y-gana.jpg'),
    (CAMAS, 1, 'image4.jpg', '../_material-cliente/extraido/portada-catalogo-bases-cama.jpg'),
    (CAMAS, 2, 'image5.jpeg', '../_material-cliente/extraido/intro-bases-cama.jpg'),
]

lineas = [
    '# Origen de las fotos',
    '',
    'Generado por `scripts/extraer-pptx.py`. Bytes copiados tal cual de los catálogos en PowerPoint',
    'del cliente (`_material-cliente/`, no se suben al repositorio). Cada foto se asignó mirando la',
    'diapositiva completa: nombre y precio impresos junto a la foto.',
    '',
    '| Foto | Catálogo | Diapositiva | Archivo interno | MD5 |',
    '|---|---|---:|---|---|',
]
zips = {}
for deck, n, interno, destino in MAPA:
    z = zips.setdefault(deck, zipfile.ZipFile(os.path.join(MATERIAL, deck)))
    datos = z.read('ppt/media/' + interno)
    ruta = os.path.normpath(os.path.join(RAIZ, 'assets', destino))
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, 'wb') as fh:
        fh.write(datos)
    if not destino.startswith('..'):
        lineas.append(f'| `{destino}` | {deck} | {n} | {interno} | `{hashlib.md5(datos).hexdigest()}` |')
    print(f'{deck[:22]:22} D{n:<3} {interno:12} -> {destino}')

lineas += [
    '',
    'Sin foto en el material recibido (quedan «foto pendiente» hasta que llegue la suya):',
    'Sala Charleston, Sala Dubai, Sala Barcelona, Sala Ibiza 2.0, Sala Paredes, Sala Roma, Sala Madrid,',
    'Sala Suiza 2.0, Sala Tokio, Sala Texas, Sala Miami, Sala Nube, Sala Múnich, Sala Milán,',
    'Sala Milán 2.0, Sala Oslo y la foto promocional del colchón.',
    '',
]
with open(os.path.join(RAIZ, 'assets', 'ORIGEN.md'), 'w', encoding='utf-8') as fh:
    fh.write('\n'.join(lineas))
print('-> assets/ORIGEN.md')
