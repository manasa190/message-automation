import re

with open('popup.js', 'r', encoding='utf-8') as f:
    popup_content = f.read()
    
with open('content.js', 'r', encoding='utf-8') as f:
    content_content = f.read()

new_keywords = [
    '"AI integration" OR "digital transformation"',
    '"generative AI" OR "business operations"',
    '"implementing machine learning" OR "AI consultant"',
    '"predictive analytics" OR "enterprise data"',
    '"AI solutions" OR "reduce costs"',
    '"cloud migration" OR "cloud architecture"',
    '"AWS consulting" OR "Azure architect"',
    '"DevOps automation" OR "managed IT services"',
    '"cybersecurity solutions" OR "database optimization"',
    '"infrastructure as a service" OR "enterprise"',
    '"Looking for developers" OR "need tech help"',
    '"hire app developer" OR "hiring full stack"',
    '"outsourcing development" OR "IT consulting"',
    '"tech staff augmentation" OR "hiring IT contractors"',
    '"need CTO" OR "looking for tech partner"',
    '"software engineering team" OR "scale"',
    '"Marketing automation" OR "ad performance"',
    '"digital marketing agency" OR "brand strategy"',
    '"hiring growth marketer" OR "PPC expert needed"',
    '"ecommerce growth" OR "conversion rate optimization"',
    '"B2B lead generation" OR "marketing team"',
    '"influencer marketing campaign" OR "social media ambassador"',
    '"creator economy" OR "brand partnerships"',
    '"Growing startup" OR "scaling product"',
    '"digital agency" OR "seeking tech partner"',
    '"startup funding" OR "hiring engineers"',
    '"tech modernization" OR "enterprise"',
    '"seeking technology partner" OR "IT vendor"'
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
