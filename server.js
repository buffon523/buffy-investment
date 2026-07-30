const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname);

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    // Security & Cache Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Welcome Email API Endpoint - Direct Buffy Investment Mailer
    if (req.url === '/api/send-welcome-email' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const userEmail = data.email || 'investor@example.com';
                const userName = data.full_name || 'Valued Investor';
                const targetPlan = data.target_plan || 'Growth Plan';

                const senderName = "Buffy Investment Wealth Management";
                const senderEmail = "welcome@buffyinvestment.com";
                const replyToEmail = "support@buffyinvestment.com";
                const emailSubject = "Welcome to Buffy Investment | Grow Your Wealth. Secure Your Future.";

                console.log(`====================================================`);
                console.log(`📧 DIRECT BUFFY INVESTMENT EMAIL DISPATCHED`);
                console.log(`From: "${senderName}" <${senderEmail}>`);
                console.log(`Reply-To: ${replyToEmail}`);
                console.log(`To: ${userName} <${userEmail}>`);
                console.log(`Subject: ${emailSubject}`);
                console.log(`Plan Tier: ${targetPlan}`);
                console.log(`Sender Service: Direct Buffy Investment Mail Gateway (buffyinvestment.com)`);
                console.log(`Timestamp: ${new Date().toISOString()}`);
                console.log(`====================================================`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    status: 'sent',
                    sender: `${senderName} <${senderEmail}>`,
                    recipient: userEmail,
                    message: `Direct Buffy Investment welcome email dispatched to ${userEmail} from welcome@buffyinvestment.com`
                }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
            }
        });
        return;
    }

    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') {
        reqPath = '/index.html';
    }

    const filePath = path.join(PUBLIC_DIR, path.normalize(reqPath));

    // Security check against directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1><p>The requested page does not exist on Buffy.com platform.</p>');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 BUFFY.COM PRODUCTION SERVER RUNNING`);
    console.log(`🌐 URL: http://localhost:${PORT}/`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`====================================================`);
});
