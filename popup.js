document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    document.querySelectorAll('.tab').forEach(t => {
        t.onclick = () => {
            document.querySelectorAll('.tab, .tab-content').forEach(el => el.classList.remove('active'));
            t.classList.add('active');
            document.getElementById(t.dataset.target).classList.add('active');
        };
    });

    // Default Templates
    const defaultTemplates = `Hi {firstName}, at Flare Technologies we help enterprises scale with AI, cloud architecture, and digital marketing strategies. Would love to connect!
///
Thanks for connecting, {firstName}! From enterprise tech consulting and AI/cloud integration to digital marketing and staff augmentation, Flare Technologies helps companies accelerate growth. Happy to share how we can help — no pitch, just a quick chat if it's useful.`;

    // Load State & Config
    chrome.storage.local.get(['state', 'config'], (res) => {
        const state = res.state || {};
        const config = res.config || {
            templates: defaultTemplates,
            apiKey: '',
            limit: 30,
            softTouch: false
        };

        // Populate Dashboard
        const statusEl = document.getElementById('statusText');
        statusEl.innerText = state.isRunning ? 'Running Campaign...' : 'Idle';
        statusEl.style.color = state.isRunning ? '#2e7d32' : '#d32f2f';

        document.getElementById('connCount').innerText = state.connectionsSent || 0;
        document.getElementById('msgCount').innerText = state.messagesSent || 0;

        // Populate Settings
        document.getElementById('templates').value = config.templates;
        document.getElementById('apiKey').value = config.apiKey || '';
        document.getElementById('limit').value = config.limit || 30;
        document.getElementById('softTouch').checked = config.softTouch || false;

        // Populate Leads
        document.getElementById('leadCount').innerText = (state.results || []).length;
    });

    // Save Configuration
    document.getElementById('saveBtn').onclick = () => {
        const config = {
            templates: document.getElementById('templates').value,
            apiKey: document.getElementById('apiKey').value.trim(),
            limit: parseInt(document.getElementById('limit').value) || 30,
            softTouch: document.getElementById('softTouch').checked
        };
        chrome.storage.local.set({ config }, () => {
            alert('Enterprise Configuration Saved!');
        });
    };

    // Export CRM Data to CSV
    document.getElementById('exportBtn').onclick = () => {
        chrome.storage.local.get(['state'], (res) => {
            const results = res.state?.results || [];
            if (results.length === 0) return alert("No active leads found to export yet.");

            let csv = "First Name,Full Name,Job Title,Action Taken,Date,Strategy Used\n";
            results.forEach(r => {
                const date = new Date().toLocaleDateString();
                const cleanName = r.name.replace(/"/g, '""');
                const cleanTitle = r.title.replace(/"/g, '""');
                const strategy = r.template || 'Default/A-B';
                const firstName = cleanName.split(' ')[0];

                csv += `"${firstName}","${cleanName}","${cleanTitle}","${r.action}","${date}","${strategy}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'flare_technologies_leads.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    };

    // Start Campaign
    document.getElementById('startBtn').onclick = () => {
        chrome.storage.local.get(['state', 'config'], (res) => {
            let state = {};
            state.isRunning = true;
            state.currentKeywordIndex = 0;
            state.connectionsSent = 0;
            state.messagesSent = 0;
            state.followsSent = 0;
            state.results = [];

            // Expanded enterprise keywords list targeting actual buyers/decision makers
            state.keywords = [
                // IT & Cloud Target Buyers
                '"Chief Technology Officer" OR "CTO"',
                '"VP of Engineering" OR "Director of Engineering"',
                '"Director of IT Infrastructure" OR "Cloud Architect"',
                '"Head of IT" OR "VP of Information Technology"',
                '"Head of DevOps" OR "Director of Cloud Strategy"',

                // Digital Marketing & Branding Target Buyers
                '"Chief Marketing Officer" OR "CMO"',
                '"VP of Marketing" OR "Director of Marketing"',
                '"Head of Demand Generation" OR "VP of Growth"',
                '"Brand Director" OR "Head of Brand Strategy"',
                '"Director of Digital Marketing" OR "VP Digital Marketing"',

                // Content & Influencer Marketing Target Buyers
                '"Director of Influencer Marketing" OR "Head of Influencer Marketing"',
                '"Director of Social Media" OR "Head of Culture"',
                '"VP of Communications" OR "Head of Partnerships"',

                // Staff Augmentation Target Buyers
                '"Head of Talent Acquisition" OR "VP of Talent"',
                '"Technical Recruiter" OR "Director of Technical Recruiting"',
                '"Founder" OR "Co-founder" OR "CEO"',
                '"Chief Operating Officer" OR "COO"',
                '"Director of HR" OR "VP of Human Resources"'
            ];

            chrome.storage.local.set({ state }, () => {
                const statusEl = document.getElementById('statusText');
                statusEl.innerText = 'Running Campaign...';
                statusEl.style.color = '#2e7d32';

                const encodedKeyword = encodeURIComponent(state.keywords[state.currentKeywordIndex]);
                const firstURL = `https://www.linkedin.com/search/results/people/?keywords=${encodedKeyword}`;
                chrome.tabs.create({ url: firstURL });
            });
        });
    };

    // Stop Campaign
    document.getElementById('stopBtn').onclick = () => {
        chrome.storage.local.get(['state'], (res) => {
            let state = res.state || {};
            state.isRunning = false;
            chrome.storage.local.set({ state }, () => {
                const statusEl = document.getElementById('statusText');
                statusEl.innerText = 'Stopped';
                statusEl.style.color = '#d32f2f';
            });
        });
    };
});
