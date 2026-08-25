import sys
import requests
from bs4 import BeautifulSoup

product_id = int(sys.argv[1])
url = f'https://www.doctorfarmer.ru/ru/product/{product_id}/'
response = requests.get(url, headers={'User-Agent': 'DoctorFarmer audit'}, timeout=20)
response.raise_for_status()
soup = BeautifulSoup(response.text, 'html.parser')
print('TITLE:', soup.find('h1').get_text(' ', strip=True))
for table_index, table in enumerate(soup.find_all('table'), 1):
    print(f'--- TABLE {table_index} ---')
    for row in table.find_all('tr'):
        cols = [cell.get_text(' ', strip=True) for cell in row.find_all(['th', 'td'])]
        if cols:
            print(' | '.join(cols))
