const DataAccess = require("./DataAccess.js");
var Model = function () { };

Model.prototype.getInvoices = function () {
	return new Promise(function (fulfill, reject) {
		DataAccess.getEntities("ocr_microservice", "invoice")
			.then(function (docs) {
				fulfill(docs);
			}).catch(function (err) {
				reject(err);
			});
	});

};

Model.prototype.getHighestIdInvoice = function(username) {
	return new Promise(async function (fulfill, reject) {
	try {
			const entities = await DataAccess.getLatestEntity("ocr_microservice", "invoice", username);
			fulfill(entities);
		} catch (err) {
			reject(err);
		}
	});
};



Model.prototype.insertInvoices = function (invoiceInfo) {
	return new Promise(function (fulfill, reject) {
		DataAccess.insertEntity(invoiceInfo, "ocr_microservice", "invoice")
			.then(function (docs) {
				fulfill(docs);
			}).catch(function (err) {
				reject(err);
			});
	});
};

module.exports = new Model();