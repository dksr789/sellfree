const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Function to normalize IP address
const normalizeIp = (ip) => {
    // Remove IPv6-mapped IPv4 prefix
    return ip.replace(/^::ffff:/, '');
};

// Middleware to restrict IPs
app.use((req, res, next) => {
    // List of allowed IPs, normalized
    const allowedIps = [
        '127.0.0.1',
        '49.43.88.76',
        '106.221.224.2' // Add any additional IPs here
    ].map(normalizeIp);

    // Get the client's IP address from x-forwarded-for or fall back to remoteAddress
    let clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    
    // If x-forwarded-for contains multiple IPs, take the first one
    if (typeof clientIp === 'string' && clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }

    // Normalize the client's IP address
    const normalizedClientIp = normalizeIp(clientIp);

    // Log normalized client IP
    console.log('Client IP:', normalizedClientIp);

    // Check if the client's normalized IP is in the list of allowed IPs
    if (allowedIps.includes(normalizedClientIp)) {
        next(); // IP is allowed, proceed with the request
    } else {
        res.status(403).send('Access denied'); // IP is not allowed
    }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Proxy route to Freepik API
app.get('/api/resources/:resourceId/download', async (req, res) => {
    const { resourceId } = req.params;

    try {
        const response = await axios.get(`https://api.freepik.com/v1/resources/${resourceId}/download`, {
            headers: { 'x-freepik-api-key': process.env.key }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send('Error fetching data from Freepik API');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
