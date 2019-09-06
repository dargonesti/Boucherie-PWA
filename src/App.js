import React, { useState, useEffect } from 'react';
import './App.css';
import BookingForm from './BookingForm.js';
import BoiteALunch from './BoiteALunch.js';
import MesReservations from './MesReservations.js';
import AdminView from './AdminView.js';
import LoginForm from './Login/LoginForm.js';
import ListCommandes from './Calendar/Calendar.js';
import DisplayCommandes from "./DisplayCommandes.js";
import firebase from 'firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import {  useCollection} from 'react-firebase-hooks/firestore';
import {  useList} from 'react-firebase-hooks/database';

import useLocalStorage from "./myUseLocalStorage.js";
import { sameDay, getAvailablities, setParams, setBookings, setReservations } from "./utils";

import QuaggaReader from "./reader/QuaggaReader.js";

// Initialize Firebase
var config = {
  apiKey: "AIzaSyC4nguL_nUL8alZO2FEMc4HIhjFEXsU0RA",
  authDomain: "boucheriereader.firebaseapp.com",
  databaseURL: "https://boucheriereader.firebaseio.com",
  projectId: "boucheriereader",
  storageBucket: "",
  messagingSenderId: "392212335719",
  appId: "1:392212335719:web:257cbd0ab3d3da64"
};

const defaultParams = {
};

//const fire = 
firebase.initializeApp(config);

function convertFBDate(param) {
  if (typeof (param) == "object" &&
    param.seconds) {
    return new Date(param.seconds * 1000);
  }
  return param;
}


function App() {
  const fbCommandes = useList(firebase.database().ref("/commandes"));

  const fbBookings = useCollection(firebase.firestore().collection('bookingTemplate'));
  var bookings = fbBookings.loading || fbBookings.error ? [] : fbBookings.value.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((b1, b2) => b1.titre < b2.titre ? -1 : 1);

  const fbReservations = useCollection(firebase.firestore().collection('reservationsPublic'));
  var reservations = fbReservations.loading || fbReservations.error ? [] : fbReservations.value.docs
    .map(doc => ({ id: doc.id, ...doc.data(), date: new Date(doc.data().date.seconds * 1000) }));

  const fbParameters = useCollection(firebase.firestore().collection('adminParameters').orderBy("dateChangement", "desc").limit(1));
  var params = (fbParameters.loading || fbParameters.error ? [] : fbParameters.value.docs
    .map(doc => doc.data()))[0] || {};
  Object.keys(params).forEach(key => {
    params[key] = convertFBDate(params[key]);
    if (/(user)/gi.test(key)) delete params[key];
  });
  
  params = { ...defaultParams, ...params };

  setParams(params);
  setBookings(bookings);
  setReservations(reservations);

  const [bookingForm, setBookingForm] = useState(); 

  const [inLogin, setinLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminView, setAdminView] = useLocalStorage("inAdminView", false);

  const { initialising, user } = useAuthState(firebase.auth());

  const pageBoiteALunch = /.*(reservemidi).{0,1}/gi.test(window.location.href);

  console.log("Is page boite a lunch : " + pageBoiteALunch);

  useEffect(() => {
    var unsub = firebase.auth().onAuthStateChanged(function (user) {
      if (!user) return;

      console.log(user);

      console.log("Firebase Authed");
      let employeRef = firebase.firestore().collection("employes").doc(user.email);
      employeRef.get().then(snapshot => {
        if (snapshot.exists){
           console.log("exists!");
           //const email = snapshot.val();
         }else{
           console.log("user No Exists");
           employeRef.set({prenom:"prenom", nom:user.displayName, role:"new", dateCreation: firebase.firestore.Timestamp.fromDate(new Date()) });
         }
     })
      firebase.firestore().collection("admins").doc(user.email).get().then(res => {
        if (res.exists && res.data().admin)
          setIsAdmin(true);
        //setAdminView(true);
      });
    });
    return () => {
      unsub();
    };
  }, []);

  function onBooking(date, bookable) {
    setBookingForm({ date, bookable, params });
  }

  const LoginBar = () => (<>
    {isAdmin &&
      <button class={"loginBtn" + (!user ? " bouncy" : "")} onClick={() => {
        setAdminView(!adminView);
      }} > {adminView ? "Mode Client" : "Mode Admin"}</button>}

    <button class={"loginBtn" + (!user ? " bouncy" : "")} onClick={() => {
      if (user) {
        firebase.auth().signOut();
        setIsAdmin(false);
      } else {
        setinLogin(true);
      }
    }} > {user ? "Déconnecter" : "Se connecter"}</button>
  </>);

  //console.log(reservations);

  if (bookingForm && reservations) {
    
    if (bookings.some(b=> bookingForm.bookable.id == b.id && getAvailablities(bookingForm.date)[b.id] <= 0)){
      setBookingForm(null);
      console.warn("Une réservation existe déjà pour cette période!");
    }
  }

  if (inLogin) {
    return <LoginForm onClose={() => {
      setinLogin(false);
    }} />;
  }
  else if (bookingForm) {
    return (<div className="App">
      <LoginBar />
      <BookingForm {...bookingForm} user={user} onClose={(e) => {
        setBookingForm(null);
      }} onSave={() => {
        setBookingForm(null); 
      }} />
    </div>);
  }
  else if (pageBoiteALunch) {
    return <div>
      <LoginBar />
      <BoiteALunch  {...{ bookings, reservations, onBooking, params, user }} />
    </div>
  }
  else if (isAdmin && adminView) {
    return <div>
      <LoginBar />
      <AdminView {...{ user, bookings, onBooking, reservations, params }} />
    </div>
  } else {
    return (
      <div className="App">
        <LoginBar />
        <QuaggaReader />
        <DisplayCommandes {...{commandes:bookings, reservAdmin:bookings}} />
        <ListCommandes {...{ bookings, reservations, onBooking, params }} />
        {user && <MesReservations {...{user,bookings, params}} />}
      </div>
    );
  }
}


export default App;
