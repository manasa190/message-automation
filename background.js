chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateAI') {
        const prompt = `Write a short, engaging LinkedIn connection request note (max 250 chars) for a person named ${request.firstName} with the job title "${request.title}". We are Flare Technologies. We offer 4 main services:
1) Digital Marketing & Branding
2) IT & Cloud Solutions (Migrations, DevOps)
3) Influencer Marketing
4) Staff Augmentation (Tech & Marketing)
Base your pitch on the service most relevant to their job title. If unsure, pitch our IT Cloud or Staffing services. Do not use placeholders like [Your Name]. Be casual and professional. No hashtags.`;

        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${request.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 80,
                temperature: 0.7
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.choices && data.choices[0]) {
                    const message = data.choices[0].message.content.replace(/"/g, '').trim();
                    sendResponse({ message: message });
                } else {
                    sendResponse({ error: "Failed to generate AI response." });
                }
            })
            .catch(err => {
                sendResponse({ error: err.toString() });
            });

        return true; // Keep the message channel open for async fetch
    }
});
