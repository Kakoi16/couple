import requests

data =  {"token":"1207774602:QvskeQja", "request":"3215051908700001", "limit": 100, "lang":"ru"}
url = 'https://leakosintapi.com/'
response = requests.post(url, json=data)
print(response.json())