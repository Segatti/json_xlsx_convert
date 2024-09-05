// firebaseConfig.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const serviceAccount = require('./keys_firebase.json');

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'gs://sandboxb-43947.appspot.com'
});

const bucket = getStorage().bucket();

module.exports = bucket;
