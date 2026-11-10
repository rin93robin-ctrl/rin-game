# 更新版本號：之後改完檔案執行 python3 tools/bump_version.py，玩家打開就會自動載入新版
import re, time, os
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')
V = time.strftime('%Y%m%d%H%M%S')
s = open('index.html').read()
s = re.sub(r'\?v=[0-9a-z]+"', f'?v={V}"', s)
s = re.sub(r'window\.BUILD = "[^"]*"', f'window.BUILD = "{V}"', s)
open('index.html', 'w').write(s)
open('version.txt', 'w').write(V)
print('version', V)
