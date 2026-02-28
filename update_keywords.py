import re

with open('popup.js', 'r', encoding='utf-8') as f:
    popup_content = f.read()
    
with open('content.js', 'r', encoding='utf-8') as f:
    content_content = f.read()

new_keywords = [
    '"AI integration" AND "digital transformation"',
    '"generative AI" AND "business operations"',
    '"implementing machine learning" AND "AI consultant"',
    '"predictive analytics" AND "enterprise data"',
    '"AI solutions" AND "reduce costs"',
    '"cloud migration" AND "cloud architecture"',
    '"AWS consulting" AND "Azure architect"',
    '"DevOps automation" AND "managed IT services"',
    '"cybersecurity solutions" AND "database optimization"',
    '"infrastructure as a service" AND "enterprise"',
    '"Looking for developers" AND "need tech help"',
    '"hire app developer" AND "hiring full stack"',
    '"outsourcing development" AND "IT consulting"',
    '"tech staff augmentation" AND "hiring IT contractors"',
    '"need CTO" AND "looking for tech partner"',
    '"software engineering team" AND "scale"',
    '"Marketing automation" AND "ad performance"',
    '"digital marketing agency" AND "brand strategy"',
    '"hiring growth marketer" AND "PPC expert needed"',
    '"ecommerce growth" AND "conversion rate optimization"',
    '"B2B lead generation" AND "marketing team"',
    '"influencer marketing campaign" AND "social media ambassador"',
    '"creator economy" AND "brand partnerships"',
    '"Growing startup" AND "scaling product"',
    '"digital agency" AND "seeking tech partner"',
    '"startup funding" AND "hiring engineers"',
    '"tech modernization" AND "enterprise"',
    '"seeking technology partner" AND "IT vendor"'
]

formatted_keywords = ",\n                ".join(f"'{k}'" for k in new_keywords)

popup_new = re.sub(
    r'state\.keywords = \[(.*?)\];', 
    f'state.keywords = [\n                {formatted_keywords}\n            ];', 
    popup_content, 
    flags=re.DOTALL
)

with open('popup.js', 'w', encoding='utf-8') as f:
    f.write(popup_new)

formatted_content = ",\n    ".join(f"'{k}'" for k in new_keywords)
content_new = re.sub(
    r'let keywords = \[(.*?)\];', 
    f'let keywords = [\n    {formatted_content}\n];', 
    content_content, 
    flags=re.DOTALL
)

with open('content.js', 'w', encoding='utf-8') as f:
    f.write(content_new)
    
print("Updated successfully!")
