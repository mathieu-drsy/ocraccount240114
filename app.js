var express = require('express');
var app = express();
var path = require('path');
const cors = require('cors');
const multer = require('multer');
const invoiceModel = require('./models/invoiceModel');
const ocrService = require('./ocr/ocrService');
const pdf = require('pdf-parse');

var config = require('config');
var microserviceConfig = config.get('microservice.config');

app.engine('pug', require('pug').__express)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());
app.use(express.static('static'));


app.get('/', function (req, res) {
    invoiceModel.getInvoices().then((invoices) => {
        var host = server.address().address;
        var port = server.address().port;

        res.render('index', { invoices: invoices, address: 'http://' + host + ':' + port });
    })
        .catch((err) => {
            // Handle errors
            console.error(err);
        });;

});

app.get('/heartbeat', function (req, res) {
    var status = {
        success: true,
        address: server.address().address,
        port: server.address().port
    };
    res.send(status);
});

var server = app.listen(microserviceConfig.port, microserviceConfig.host, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server Running On: http://%s:%s', host, port);
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/analyzeInvoice', upload.single('invoiceImage'), async (req, res) => {
    try {
        res.status(200).send('Fichier reçue');

        // Extract username from request body or set default
        const username = req.body.username || "defaultUser";

        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const imageBuffer = req.file.buffer;
        let text;

        // Extract text from PDF or image using OCR service
        if (req.file.mimetype === 'application/pdf') {
            const pdfData = await pdf(imageBuffer);
            text = processPdfText(pdfData.text);
        } else {
            text = await ocrService.performOCR(imageBuffer);
        }
        console.log(text);

        let idInvoice = (await invoiceModel.getHighestIdInvoice(username)) || { id: 0 };
        idInvoice = idInvoice.id + 1;

        const invoiceInfo = ocrService.extractInvoiceInfo(text, username, idInvoice, text);

        await invoiceModel.insertInvoices(invoiceInfo);

    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ error: 'OCR process failed' });
    }
});


app.get('/analyzeInvoice', function (req, res) {
    var host = server.address().address;
    var port = server.address().port;
    res.render('analyzeInvoice', { address: 'http://' + host + ':' + port });
});

function processPdfText(text) {
    text = text.replace("FACTURE", " FACTURE");
    return text.replace(/([A-Za-z])(\d)/g, '$1 $2');
}



app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});