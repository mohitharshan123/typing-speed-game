import * as firebase from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA36hmfLctxHlf7bzvp55SR7BSzf0X8JtQ",
  authDomain: "typing-game-a6a3e.firebaseapp.com",
  projectId: "typing-game-a6a3e",
  storageBucket: "typing-game-a6a3e.appspot.com",
  messagingSenderId: "262134156279",
  appId: "1:262134156279:web:2b843cf442f6bcb59dfcf2",
  measurementId: "G-LGNKC295VR",
};
const app = firebase.initializeApp(firebaseConfig);
var database = getFirestore(app);

export default database;
