const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;
const DATA_FILE = path.join(__dirname, 'data.json');
const TEMPLATE_FILE = path.join(__dirname, 'portfolio_template.html');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Vedantrajput123';

app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Admin-Password');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Route to get the portfolio data
app.get('/api/portfolio', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading data.json:", err);
            return res.status(500).json({ error: "Failed to read database." });
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseErr) {
            res.status(500).json({ error: "Failed to parse database." });
        }
    });
});

// Route to save updated portfolio data
app.post('/api/portfolio', (req, res) => {
    const password = req.headers['x-admin-password'];
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized. Invalid password." });
    }

    const updatedData = req.body;
    if (!updatedData || typeof updatedData !== 'object') {
        return res.status(400).json({ error: "Invalid data format." });
    }

    fs.writeFile(DATA_FILE, JSON.stringify(updatedData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error("Error writing data.json:", err);
            return res.status(500).json({ error: "Failed to save database." });
        }
        res.json({ message: "Portfolio saved successfully." });
    });
});

// Serve dynamically compiled portfolio page
function serveDynamicPortfolio(req, res) {
    fs.readFile(DATA_FILE, 'utf8', (err, jsonData) => {
        if (err) {
            return res.status(500).send("Database Error");
        }
        fs.readFile(TEMPLATE_FILE, 'utf8', (err, htmlTemplate) => {
            if (err) {
                return res.status(500).send("Template Error");
            }
            
            try {
                const data = JSON.parse(jsonData);
                const shortName = data.personal.fullName.split(' ').slice(0, 2).join(' ').toUpperCase();
                
                // Set up exact replacements mapping
                const replacements = {
                    '__PAGE_TITLE__': data.personal.fullName + " — Portfolio",
                    '__FULL_NAME__': JSON.stringify(data.personal.fullName),
                    '__EMAIL_0__': JSON.stringify(data.contact.emails[0] || ''),
                    '__EMAIL_1__': JSON.stringify(data.contact.emails[1] || ''),
                    '__PHONE_0__': JSON.stringify(data.contact.phones[0] || ''),
                    '__PHONE_1__': JSON.stringify(data.contact.phones[1] || ''),
                    '__LINKEDIN__': JSON.stringify(data.contact.linkedin),
                    '__GITHUB__': JSON.stringify(data.contact.github),
                    '__CGPA_ENTC__': JSON.stringify(data.personal.cgpa + " CGPA • ENTC"),
                    '__PROFILE_TEXT__': JSON.stringify(data.personal.profileText),
                    '__LANGUAGES_ARRAY__': JSON.stringify(data.personal.languages.split(',').map(s => s.trim())),
                    '__SKILLS_SUBTEXT__': JSON.stringify(data.skills.list.join(' • ')),
                    '__SKILLS_ARRAY__': JSON.stringify(data.skills.list),
                    '__SKILLS_CATEGORIES__': JSON.stringify(data.skills.categories),
                    '__EDUCATION_ARRAY__': JSON.stringify(data.education),
                    
                    '__PERSONAL_DETAILS_ARRAY__': JSON.stringify([
                        ["Full Name", data.personal.fullName],
                        ["DOB", data.personal.dob],
                        ["Gender", data.personal.gender],
                        ["Marital Status", data.personal.maritalStatus],
                        ["Current Address", data.personal.currentAddress],
                        ["Permanent", data.personal.permanentAddress],
                        ["Languages", data.personal.languages],
                        ["Title", data.personal.title]
                    ]),
                    
                    // Project 0
                    '__PROJ_0_META__': JSON.stringify(
                        `${data.projects[0].duration} • Team Size ${data.projects[0].teamSize}${data.projects[0].role ? ' • ' + data.projects[0].role : ''}`
                    ),
                    '__PROJ_0_TITLE_PART1__': JSON.stringify(data.projects[0].title + " –"),
                    '__PROJ_0_TITLE_PART2__': JSON.stringify(data.projects[0].subtitle.split(' ').slice(0, 2).join(' ')),
                    '__PROJ_0_TITLE_PART3__': JSON.stringify(data.projects[0].subtitle.split(' ').slice(2).join(' ')),
                    '__PROJ_0_GITHUB__': JSON.stringify(data.projects[0].github),
                    '__PROJ_0_TECH_ARRAY__': JSON.stringify(data.projects[0].tech),
                    '__PROJ_0_DETAILS_ARRAY__': JSON.stringify(data.projects[0].details),
                    '__PROJ_0_METRIC_1_VAL__': JSON.stringify(Object.values(data.projects[0].metrics)[0] || ''),
                    '__PROJ_0_METRIC_1_NAME__': JSON.stringify(Object.keys(data.projects[0].metrics)[0] || ''),
                    '__PROJ_0_METRIC_2_VAL__': JSON.stringify(Object.values(data.projects[0].metrics)[1] || ''),
                    '__PROJ_0_METRIC_2_NAME__': JSON.stringify(Object.keys(data.projects[0].metrics)[1] || ''),
                    '__PROJ_0_METRIC_3_VAL__': JSON.stringify(Object.values(data.projects[0].metrics)[2] || '3 Roles'),
                    '__PROJ_0_METRIC_3_NAME__': JSON.stringify(Object.keys(data.projects[0].metrics)[2] || 'Patient Doctor Admin'),
                    '__PROJ_0_ARCH__': JSON.stringify(data.projects[0].architecture || ''),
                    '__PROJ_0_LINK_TEXT__': JSON.stringify(data.projects[0].github.replace('https://', '')),

                    // Project 1
                    '__PROJ_1_META__': JSON.stringify(
                        `${data.projects[1].duration} • Team Size ${data.projects[1].teamSize}${data.projects[1].role ? ' • ' + data.projects[1].role : ''}`
                    ),
                    '__PROJ_1_TITLE_PART1__': JSON.stringify(data.projects[1].title + " –"),
                    '__PROJ_1_TITLE_PART2__': JSON.stringify(data.projects[1].subtitle),
                    '__PROJ_1_TECH_ARRAY__': JSON.stringify(data.projects[1].tech),
                    '__PROJ_1_DETAILS_ARRAY__': JSON.stringify(data.projects[1].details),
                    '__PROJ_1_GITHUB__': JSON.stringify(data.projects[1].github),
                    '__PROJ_1_IMPACT_TEXT__': JSON.stringify(
                        `${data.projects[1].metrics.listings || data.projects[1].metrics.dailyBookings || ''} • ${data.projects[1].metrics.efficiency || data.projects[1].metrics.timeReduction || ''}`
                    ),
                    '__PROJ_1_LINK_TEXT__': JSON.stringify(data.projects[1].github.replace('https://', '')),

                    // Certifications
                    '__CERT_0_TITLE__': JSON.stringify(data.certifications[0] ? data.certifications[0].title : ''),
                    '__CERT_0_DESC__': JSON.stringify(data.certifications[0] ? data.certifications[0].desc : ''),
                    '__CERT_1_TITLE__': JSON.stringify(data.certifications[1] ? data.certifications[1].title : ''),
                    '__CERT_1_DESC__': JSON.stringify(data.certifications[1] ? data.certifications[1].desc : ''),
                    '__CERT_1_SKILLS_ARRAY__': JSON.stringify(data.certifications[1] ? data.certifications[1].skills || [] : []),

                    // Leadership
                    '__LEAD_0_TITLE__': JSON.stringify(data.leadership[0] ? data.leadership[0].title : ''),
                    '__LEAD_0_DESC__': JSON.stringify(data.leadership[0] ? data.leadership[0].desc : ''),
                    '__LEAD_0_SKILLS_ARRAY__': JSON.stringify(data.leadership[0] ? data.leadership[0].skills : []),
                    '__LEAD_1_TITLE__': JSON.stringify(data.leadership[1] ? data.leadership[1].title : ''),
                    '__LEAD_1_DESC__': JSON.stringify(data.leadership[1] ? data.leadership[1].desc : ''),
                    '__LEAD_1_SKILLS_ARRAY__': JSON.stringify(data.leadership[1] ? data.leadership[1].skills : []),

                    // Hobbies
                    '__HOBBIES_ARRAY__': JSON.stringify(data.hobbies),

                    // Header/Footer Brand names
                    '__HEADER_TITLE__': JSON.stringify(data.personal.fullName + " — " + new Date().getFullYear() + " — MERN"),
                    '__FOOTER_BRAND__': JSON.stringify(shortName + " • PORTFOLIO"),
                    '__FOOTER_COPYRIGHT__': `["${shortName}", v("br", {}), "PORTFOLIO • FINAL"]`
                };

                let outputHtml = htmlTemplate;
                for (const [placeholder, val] of Object.entries(replacements)) {
                    outputHtml = outputHtml.split(placeholder).join(val);
                }

                res.send(outputHtml);
            } catch (err) {
                console.error("Rendering Error:", err);
                res.status(500).send("Rendering Error: " + err.message);
            }
        });
    });
}

// Redirect default portfolio name to root or dynamic rendering
app.get('/Kanchan-Rajput-—-Portfolio.html', serveDynamicPortfolio);
app.get('/Kanchan-Rajput-%E2%80%94-Portfolio.html', serveDynamicPortfolio);

// Default fallback to serve portfolio page
app.get('/', serveDynamicPortfolio);

// Admin panel route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve other static files (like PDFs, bundle resources)
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Portfolio Server running at http://localhost:${PORT}`);
    console.log(`Admin Panel available at http://localhost:${PORT}/admin`);
});
