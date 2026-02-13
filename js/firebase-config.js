import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";

console.log("Loading Firebase config module...");

let app;
let db;
let storage;
let messaging;
let analytics;

try {
  // Your web app's Firebase configuration
  const firebaseConfig = {
  apiKey: "AIzaSyAeLbTp9WWoyE2w2iSLntUZDj3l6cuwq3Y",
  authDomain: "pilc2026.firebaseapp.com",
  projectId: "pilc2026",
  storageBucket: "pilc2026.firebasestorage.app",
  messagingSenderId: "638929312262",
  appId: "1:638929312262:web:45bbcdf6719777f0728187",
  measurementId: "G-5MSJ05SKWB"
};

  // Add logging for current environment
  console.log("Current hosting environment:", window.location.hostname);
  
  // Initialize Firebase
  console.log("Initializing Firebase...");
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  messaging = getMessaging(app);
  analytics = getAnalytics(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { app, db, storage, messaging, analytics, getToken, onMessage };
