import re

popup_path = r'popup.html'
content_path = r'content.js'
manifest_path = r'manifest.json'

with open(popup_path, 'r', encoding='utf-8') as f:
    popup = f.read()

popup = popup.replace('#ffb6c1', '#F6CBC0')
popup = popup.replace('#ff9fb4', '#E6BBB0')
popup = popup.replace('#ff8ca3', '#D6ABA0')
popup = popup.replace('#ff758c', '#C69B90')

popup = popup.replace('color: #fff;', 'color: #333;')
popup = popup.replace('color: white;', 'color: #333;')
popup = popup.replace('border-bottom: 2px solid #fff;', 'border-bottom: 2px solid #333;')

popup = popup.replace('🌸 Start Lead Campaign 🌸', '▶ Start Lead Campaign')
popup = popup.replace('🌺 Stop Campaign 🌺', '⏹ Stop Campaign')
popup = popup.replace('🌷 Export Leads to CSV 🌷', '📥 Export Leads to CSV')

with open(popup_path, 'w', encoding='utf-8') as f:
    f.write(popup)

with open(content_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('#ffb6c1', '#F6CBC0')
content = content.replace('#ff8ca3', '#D6ABA0')
content = content.replace('color: white;', 'color: #333;')
content = content.replace('color:#fff;', 'color:#333;')
content = content.replace('color:#ffeb3b;', 'color:#333;')
content = content.replace('border-bottom: 1px solid #fff;', 'border-bottom: 1px solid #333;')

content = content.replace('🌸 Flare Enterprise Bot 🌸', '🚀 Flare Enterprise Bot')
content = content.replace('🌺 Stop Campaign 🌺', '⏹ Stop Campaign')

with open(content_path, 'w', encoding='utf-8') as f:
    f.write(content)

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = f.read()

manifest = re.sub(r'"version": "\d+\.\d+"', '"version": "9.1"', manifest)

with open(manifest_path, 'w', encoding='utf-8') as f:
    f.write(manifest)

print('Updated successfully to Peach 9.0!')
