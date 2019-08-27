import React, { useState, useEffect, Fragment } from 'react';
import logo from '../logo.svg';
import '../App.css';  
import firebase from 'firebase'; 
import { useAuthState } from 'react-firebase-hooks/auth';
import { useListVals } from 'react-firebase-hooks/database';
import { useCollection } from 'react-firebase-hooks/firestore';
 
    
const LoginGoogle = ({}) => {
  const { initialising, user } = useAuthState(firebase.auth());

  if(initialising){
    return  <button disabled class="loginBtn">Chargement...</button>
  } else if(user){
    return (<button class="logoutBtn" onClick={()=>{
      firebase.auth().signOut();
    }}>Déconnexion</button>);
  }else{
  return (<button class="loginBtn" onClick={()=>{ 
    firebase.auth().signInWithPopup( new firebase.auth.GoogleAuthProvider());
  }}>Se Connecter</button>);
}
}



export default LoginGoogle;
