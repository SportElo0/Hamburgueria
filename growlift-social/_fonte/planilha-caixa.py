#!/usr/bin/env python3
"""Planilha "Controle de caixa" (presente PLANILHA do Reel 34, Skill da Semana ep. 02).

    python3 growlift-social/_fonte/planilha-caixa.py

Monta a planilha a partir do caderno de exemplo do Reel (lido da foto: _fonte/reels/novos/caderno34.mjs), seguindo a
skill xlsx: fonte Arial, fórmulas em vez de números fixos, células para preencher em amarelo, uma aba explicando o
uso e gráfico. Depois rode o recalc da skill para gravar os valores calculados (o script faz isso se achar o recalc).
"""
from __future__ import annotations

import datetime as dt
import json
import subprocess
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

OUT = Path(__file__).resolve().parent.parent / '10-presentes' / 'planilha-controle-de-caixa.xlsx'
RECALC = Path('/root/.claude/skills/synced/527d978d-e08e-4c14-950b-608c81a52adf_6da5c0d9-1ea3-410a-a07c-acfdaf825390/xlsx/scripts/recalc.py')

# O caderno do Reel (lanchonete fictícia), como foi lido da foto. Ano assumido: 2026 (o caderno só tem dia/mês).
CADERNO = [
    ('01/11', 'Vendas do dia', 'Vendas', 1240),
    ('01/11', 'Pão e frios', 'Fornecedores', -310),
    ('02/11', 'Vendas', 'Vendas', 980),
    ('03/11', 'Gás', 'Contas da casa', -125),
    ('04/11', 'Vendas', 'Vendas', 1105),
    ('05/11', 'Conta de luz', 'Contas da casa', -268),
    ('06/11', 'Vendas', 'Vendas', 1370),
    ('07/11', 'Vale do Zé', 'Equipe', -400),
    ('08/11', 'Vendas', 'Vendas', 1520),
    ('08/11', 'Embalagens', 'Embalagens', -190),
    ('09/11', 'Vendas', 'Vendas', 860),
    ('10/11', 'Aluguel', 'Aluguel', -1800),
]
CATEGORIAS = ['Vendas', 'Fornecedores', 'Contas da casa', 'Equipe', 'Embalagens', 'Aluguel', 'Impostos e taxas', 'Outros']

PRIMEIRA, ULTIMA = 6, 205  # linhas de lançamento na aba Caixa (200 linhas)

AZUL = '0865FE'
TINTA = '121826'
F = lambda **k: Font(name='Arial', **k)
AMARELO = PatternFill('solid', fgColor='FFF6CC')
CINZA = PatternFill('solid', fgColor='F2F4F8')
TOPO = PatternFill('solid', fgColor=AZUL)
FINA = Side(style='thin', color='DCE2EC')
GRADE = Border(left=FINA, right=FINA, top=FINA, bottom=FINA)
REAIS = '"R$" #,##0.00;-"R$" #,##0.00;"-"'


def aba_caixa(wb: Workbook) -> None:
    ws = wb.active
    ws.title = 'Caixa'
    ws.sheet_view.showGridLines = False
    for col, w in zip('ABCDEF', (12, 30, 20, 16, 16, 16)):
        ws.column_dimensions[col].width = w
    ws['A1'] = 'Controle de caixa'
    ws['A1'].font = F(size=18, bold=True, color=TINTA)
    ws['A2'] = 'Anote cada entrada e cada saída numa linha. Preencha só as células amarelas: o saldo e o resumo se calculam sozinhos.'
    ws['A2'].font = F(size=10, color='3C4558')
    ws['A3'] = 'Os lançamentos abaixo são o caderno de EXEMPLO do vídeo (lanchonete fictícia). Apague e coloque os seus.'
    ws['A3'].font = F(size=10, bold=True, color='B3261E')

    cab = ['Data', 'Descrição', 'Categoria', 'Entrada (R$)', 'Saída (R$)', 'Saldo (R$)']
    for i, t in enumerate(cab, start=1):
        c = ws.cell(row=5, column=i, value=t)
        c.font = F(bold=True, color='FFFFFF')
        c.fill = TOPO
        c.alignment = Alignment(horizontal='center', vertical='center')
        c.border = GRADE
    ws.row_dimensions[5].height = 22

    for r in range(PRIMEIRA, ULTIMA + 1):
        for col in 'ABCDE':
            cell = ws[f'{col}{r}']
            cell.fill = AMARELO
            cell.border = GRADE
            cell.font = F(color='1D3A8A')  # o que a pessoa digita
        ws[f'A{r}'].number_format = 'dd/mm/yyyy'
        ws[f'D{r}'].number_format = REAIS
        ws[f'E{r}'].number_format = REAIS
        f = ws[f'F{r}']
        f.value = f'=IF(AND(D{r}="",E{r}=""),"",SUM($D${PRIMEIRA}:D{r})-SUM($E${PRIMEIRA}:E{r}))'
        f.number_format = REAIS
        f.font = F(bold=True, color=TINTA)
        f.fill = CINZA
        f.border = GRADE

    for i, (dia, desc, cat, valor) in enumerate(CADERNO):
        r = PRIMEIRA + i
        d, m = map(int, dia.split('/'))
        ws[f'A{r}'] = dt.date(2026, m, d)
        ws[f'B{r}'] = desc
        ws[f'C{r}'] = cat
        if valor > 0:
            ws[f'D{r}'] = valor
        else:
            ws[f'E{r}'] = -valor
    ws[f'A{PRIMEIRA}'].comment = Comment('Exemplo: o caderno do vídeo só tinha dia e mês; o ano 2026 foi assumido. Troque pelas suas datas.', 'Growlift')

    lista = DataValidation(type='list', formula1="=Resumo!$A$12:$A$19", allow_blank=True)
    lista.error = 'Escolha uma categoria da lista (você pode mudar os nomes na aba Resumo).'
    lista.errorTitle = 'Categoria'
    ws.add_data_validation(lista)
    lista.add(f'C{PRIMEIRA}:C{ULTIMA}')
    ws.freeze_panes = f'A{PRIMEIRA}'


def aba_resumo(wb: Workbook) -> None:
    ws = wb.create_sheet('Resumo')
    ws.sheet_view.showGridLines = False
    ws.column_dimensions['A'].width = 30
    ws.column_dimensions['B'].width = 18
    ws['A1'] = 'Resumo do caixa'
    ws['A1'].font = F(size=18, bold=True, color=TINTA)
    ws['A2'] = 'Tudo aqui é calculado a partir da aba Caixa.'
    ws['A2'].font = F(size=10, color='3C4558')

    faixa = lambda col: f'Caixa!${col}${PRIMEIRA}:${col}${ULTIMA}'
    linhas = [
        ('Total de entradas', f'=SUM({faixa("D")})'),
        ('Total de saídas', f'=SUM({faixa("E")})'),
        ('Sobrou no período', '=B4-B5'),
        ('Lançamentos', f'=COUNTA({faixa("B")})'),
    ]
    for i, (rotulo, formula) in enumerate(linhas, start=4):
        ws[f'A{i}'] = rotulo
        ws[f'A{i}'].font = F(bold=True, color=TINTA)
        ws[f'B{i}'] = formula
        ws[f'B{i}'].font = F(bold=True, size=12, color=AZUL if i == 6 else TINTA)
        ws[f'B{i}'].number_format = '0' if i == 7 else REAIS
        for col in 'AB':
            ws[f'{col}{i}'].border = GRADE
            ws[f'{col}{i}'].fill = CINZA

    ws['A10'] = 'Saídas por categoria'
    ws['A10'].font = F(size=13, bold=True, color=TINTA)
    ws['A11'], ws['B11'] = 'Categoria (pode renomear)', 'Saídas (R$)'
    for c in ('A11', 'B11'):
        ws[c].font = F(bold=True, color='FFFFFF')
        ws[c].fill = TOPO
        ws[c].border = GRADE
    for i, cat in enumerate(CATEGORIAS, start=12):
        ws[f'A{i}'] = cat
        ws[f'A{i}'].font = F(color='1D3A8A')
        ws[f'A{i}'].fill = AMARELO
        ws[f'B{i}'] = f'=SUMIF({faixa("C")},A{i},{faixa("E")})'
        ws[f'B{i}'].number_format = REAIS
        ws[f'B{i}'].font = F(color=TINTA)
        for col in 'AB':
            ws[f'{col}{i}'].border = GRADE

    g = BarChart()
    g.type = 'bar'
    g.style = 10
    g.title = 'Para onde foi o dinheiro'
    g.y_axis.title = 'R$'
    g.add_data(Reference(ws, min_col=2, min_row=11, max_row=11 + len(CATEGORIAS)), titles_from_data=True)
    g.set_categories(Reference(ws, min_col=1, min_row=12, max_row=11 + len(CATEGORIAS)))
    g.legend = None
    g.roundedCorners = False
    g.title.overlay = False
    g.y_axis.title.overlay = False
    g.x_axis.delete = False
    g.y_axis.delete = False
    g.y_axis.numFmt = '#,##0'
    g.height, g.width = 9, 16
    g.series[0].graphicalProperties.solidFill = AZUL
    ws.add_chart(g, 'D3')


def aba_como_usar(wb: Workbook) -> None:
    ws = wb.create_sheet('Como usar', 0)
    ws.sheet_view.showGridLines = False
    ws.column_dimensions['A'].width = 100
    textos = [
        ('Controle de caixa · presente da Growlift', F(size=18, bold=True, color=TINTA)),
        ('', None),
        ('1. Na aba Caixa, apague os lançamentos de exemplo (as linhas do caderno do vídeo, de uma lanchonete fictícia).', F(size=11)),
        ('2. Anote cada entrada ou saída numa linha: data, descrição, categoria e o valor na coluna certa.', F(size=11)),
        ('3. Preencha só as células amarelas. O saldo e a aba Resumo (com o gráfico) se calculam sozinhos.', F(size=11)),
        ('4. As categorias podem ser renomeadas na aba Resumo; a lista da aba Caixa acompanha.', F(size=11)),
        ('', None),
        ('Funciona no Excel, no Google Planilhas e no celular.', F(size=11, color='3C4558')),
        ('Feita com a skill de planilhas (xlsx) do Claude, criada pela Anthropic. A Growlift não é afiliada à Anthropic.', F(size=10, color='6A7385')),
        ('Os valores de exemplo são fictícios e servem só para mostrar o formato.', F(size=10, color='6A7385')),
    ]
    for i, (t, fonte) in enumerate(textos, start=1):
        ws[f'A{i}'] = t
        if fonte:
            ws[f'A{i}'].font = fonte
        ws[f'A{i}'].alignment = Alignment(wrap_text=True, vertical='top')


def main() -> None:
    wb = Workbook()
    aba_caixa(wb)
    aba_resumo(wb)
    aba_como_usar(wb)
    for ws in wb.worksheets:  # impressão: cabe na largura da folha, deitada
        ws.page_setup.orientation = 'landscape'
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 0
        ws.sheet_properties.pageSetUpPr.fitToPage = True
    wb.active = 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)
    print('salva', OUT)
    if RECALC.exists():
        r = subprocess.run([sys.executable, str(RECALC), str(OUT), '60'], capture_output=True, text=True)
        print(r.stdout.strip() or r.stderr.strip())


if __name__ == '__main__':
    main()
