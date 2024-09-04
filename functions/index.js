const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializa o SDK do Firebase Admin
admin.initializeApp();

exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from Firebase!");
});
