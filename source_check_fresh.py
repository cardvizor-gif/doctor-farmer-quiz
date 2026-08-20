import json
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ids = [3, 101, 90, 75, 104, 69, 87, 19, 53, 20, 71, 72, 76, 24, 97, 73, 27, 28, 30, 48, 49, 77, 32, 50, 102, 56, 106, 58, 59, 35, 55, 45, 79, 70, 38, 40, 52, 41, 98]

session = requests.Session()
session.headers['User-Agent'] = 'DoctorFarmer classification audit'
results = []
for product_id in ids:
    url = f'https://www.doctorfarmer.ru/ru/product/{product_id}/'
    response = session.get(url, timeout=20)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    title_node = soup.find('h1')
    title = title_node.get_text(' ', strip=True) if title_node else f'ID {product_id}'
    text = soup.get_text(' ', strip=True)
    fields = {}
    for label in ('Назначение', 'Вредный объект', 'Действующие вещества', 'Применяется к культурам'):
        match = re.search(rf'{re.escape(label)}\s*:?\s*(.*?)(?=\s+(?:Назначение|Вредный объект|Действующие вещества|Применяется к культурам|Концентрация|Химический класс|Препаративная форма|Упаковка|Норма расхода|$))', text, re.I)
        if match:
            fields[label] = match.group(1).strip(' :')
    results.append({'id': product_id, 'title': title, 'fields': fields, 'url': url})

Path('/home/ubuntu/webdev-static-assets/source_check_fresh.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
for row in results:
    print(f"{row['id']} | {row['title']} | {row['fields'].get('Назначение', 'не указано')}")
