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
    res.status(200).send('Fichier reçue');
    try {
        const user = req.body.username ? req.body.username : "defaultUser";
        var invoiceInfo = undefined;
        if (req.file != undefined) {
            const imageBuffer = req.file.buffer;
            let text;

            // Check if the uploaded file is a PDF
            if (req.file.mimetype === 'application/pdf') {
                // Use pdf-parse to extract text from PDF
                const pdfData = await pdf(imageBuffer);
                text = processPdfText(pdfData.text);
            } else {
                // Use OCR service for image files
                text = await ocrService.performOCR(imageBuffer);
            }
            // Process the extracted text and return the necessary information as JSON
            var idInvoice = await invoiceModel.getHighestIdInvoice(user);
            if (idInvoice == null) {
                idInvoice = {};
            }
            idInvoice = idInvoice.id != undefined ? idInvoice.id + 1 : 1;
            invoiceInfo = ocrService.extractInvoiceInfo(text, user, idInvoice);

            await invoiceModel.insertInvoices(invoiceInfo);
        }
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