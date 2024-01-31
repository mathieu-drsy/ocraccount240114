const Tesseract = require('tesseract.js');
const { v4: uuidv4 } = require('uuid');

function performOCR(imagePath) {
    return new Promise((resolve, reject) => {
        Tesseract.recognize(
            imagePath,
            'fra',
            {
                logger: (info) => {
                    console.log(info);
                },
                tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,/-€',
                // Apply image preprocessing options
                preprocess: [
                    // Remove background noise and smooth the image
                    'remove_background',
                    // Scale the image to improve OCR accuracy
                    'scale_to_gray',
                    // Binarize the image using adaptive thresholding
                    'adaptive_threshold',
                    // Apply mean denoising to the image
                    'denoise',
                ],
            }
        )
            .then(({ data }) => {
                const text = data ? data.text : ''; // Add a check for data
                resolve(text);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

function extractInvoiceInfo(ocrText, name, id, text) {
    // Implement logic to extract specific information from OCR text
    const username = name || 'DefaultUsername';
    const creationDate = extractCreationDate(ocrText);
    const sender = extractSender(ocrText);
    const customer = extractCustomerName(ocrText);
    const articles = extractArticles(ocrText);
    const totalWithTaxes = extractTotalWithTaxes(ocrText);
    const totalWithoutTaxes = extractTotalWithoutTaxes(ocrText);
    const uuid = getUUID();

    return {
        uuid: uuid ?? null,
        id: id ?? null,
        username: username ?? null,
        creationDate: creationDate ?? null,
        sender: sender ?? null,
        customer: customer ?? null,
        articles: articles ?? null,
        totalWithTaxes: totalWithTaxes ?? null,
        totalWithoutTaxes: totalWithoutTaxes ?? null,
        text: text ?? null,
    };

}

function extractCreationDate(ocrText) {
    const datePattern = /\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/; // Assuming date format dd/mm/yyyy or dd-mm-yyyy
    const matches = ocrText.match(datePattern);

    if (matches && matches.length > 0) {
        return matches[0];
    } else {
        // Handle case when no date is found
        return null;
    }
}

function extractSender(ocrText) {
    const customerMatch = ocrText.match(/(.*?)\s*FACTURE/);
    return customerMatch ? customerMatch[1].trim() : undefined;
}



function extractArticles(ocrText) {
    const articlesSectionRegex = /MONTANT([\s\S]+?)Total/gi;
    const articleLineRegex = /([\w\s]+) (\d+,\d+)/g;

    const articlesSectionMatch = articlesSectionRegex.exec(ocrText);

    if (articlesSectionMatch) {
        const articlesText = articlesSectionMatch[1];
        const articlesMatch = [...articlesText.matchAll(articleLineRegex)];

        if (articlesMatch) {
            const articles = articlesMatch.map((match) => {
                const [fullMatch, description, price] = match;
                return { description: description.trim(), price };
            });

            return articles;
        }
    }

    return null; // No match found
}


function extractTotalWithTaxes(ocrText) {
    // Implement logic to extract the total with taxes from OCR text

    // Example: searching for a pattern like "TTC 123.45"
    const totalWithTaxesPattern = /TTC\s*(\d+(\.\d{1,2})?)/i;
    const match = ocrText.match(totalWithTaxesPattern);

    if (match && match[1]) {
        const totalWithTaxes = parseFloat(match[1]);
        return totalWithTaxes;
    }

    // Return null or handle cases where the total with taxes cannot be extracted
    return null;
}


function extractTotalWithoutTaxes(ocrText) {
    const lines = ocrText.split('\n');

    let totalWithoutTaxes = null;

    for (const line of lines) {
        // Check if the line contains the "Total HT" information
        if (line.includes('Total HT')) {
            // Extract the amount following "Total HT"
            const match = line.match(/HT\s+([\d,]+)/);

            if (match && match[1]) {
                // Convert the amount to a numeric value (remove commas)
                totalWithoutTaxes = parseFloat(match[1].replace(',', '.'));

                // Break the loop once the information is found
                break;
            }
        }
    }

    return totalWithoutTaxes;
}

function extractCustomerName(ocrText) {
    const customerMatch = ocrText.match(/\n(.*?)\s*Date/);
    return customerMatch ? customerMatch[1].trim() : undefined;
}

function getUUID() {
    return uuidv4();
}

module.exports = {
    performOCR,
    extractInvoiceInfo,
};
