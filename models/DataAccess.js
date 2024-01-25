const admin = require('firebase-admin');
var serviceAccount = require("../config/invoice-7a6db-firebase-adminsdk-t6lxg-fc06900975.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
// Get entities from Firestore
async function getEntities(dbName, collectionName, query = {}) {
  try {
    const collectionRef = db.collection(dbName).doc(collectionName).collection('entities');
    const snapshot = await collectionRef.get();

    const entities = [];
    snapshot.forEach(doc => {
        entities.push(doc.data());
    });
    return entities;
  } catch (error) {
    console.error('Error fetching entities:', error);
    return [];
  }
}

async function getLatestEntity(dbName, collectionName, username) {
  try {
    const collectionRef = db.collection(dbName).doc(collectionName).collection('entities');

    // Check if username is defined before constructing the query
    let query = collectionRef;
    if (username) {
      query = query.where('username', '==', username);
    }

    const snapshot = await query.orderBy('id', 'desc').limit(1).get();
    
    if (snapshot.empty) {
      return null; // No matching entities found for the given username
    }

    const latestEntity = snapshot.docs[0].data();
    return latestEntity;
  } catch (error) {
    console.error('Error fetching latest entity:', error);
    throw error;
  }
}


// Insert entity into Firestore
async function insertEntity(entity, dbName, collectionName) {
  const collectionRef = db.collection(dbName).doc(collectionName).collection('entities');
  collectionRef.add(entity);
}


module.exports = {
  getEntities,
  insertEntity,
  getLatestEntity,
};