// Import the functions you need from the SDKs you need
import { connectorConfig } from "@dataconnect/generated";
import Storage from "expo-native-storage";
import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import {
  connectDataConnectEmulator,
  getDataConnect,
} from "firebase/data-connect";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0ZMYDDSVTBR5-5zCXKGbqpQj2RNcMHtM",
  authDomain: "dance-721cb.firebaseapp.com",
  projectId: "dance-721cb",
  storageBucket: "dance-721cb.firebasestorage.app",
  messagingSenderId: "441711217271",
  appId: "1:441711217271:web:da5802faa1a1de2f10d472",
  measurementId: "G-WD0EDD6G9T",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(Storage),
});
connectAuthEmulator(auth, "http://10.0.0.25:9099");

const dataConnect = getDataConnect(app, connectorConfig);
connectDataConnectEmulator(dataConnect, "10.0.0.25", 9399);

export { app, auth };
