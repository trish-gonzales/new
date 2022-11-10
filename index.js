const express = require('express');
const path = require('path');
const app = express();

app.use('/static', express.static('Main'));
app.use('/static', express.static(path.join(__dirname, 'Main')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/Home.html'));
});

app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/faq.html'));
});

app.listen(process.env.PORT || 8000, function(){
    console.log('Connected to localhost:8000');
});