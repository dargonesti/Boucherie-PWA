import React, { useState, useEffect, Redirect } from "react";
import '../App.css';

import firebase from 'firebase'
import { useAuthState } from 'react-firebase-hooks/auth';
import {validEmail} from "../utils";
import BlockUi from 'react-block-ui';
import {ToastsContainer, ToastsStore} from 'react-toasts';
 

const LoginForm = ({onClose, ...props}) => {
  //Contains : displayName, email, photoURL, isAnonymous
  const { initialising, user } = useAuthState(firebase.auth());

  var [email, setEmail] = useState("");
  var [pass, setPass] = useState("");
  var [confirmPass, setConfirm] = useState("");
  var [emailing, setEmailing] = useState(false);
  var [wantCreateUser, setCreateUser] = useState(false);

  function clickLogin(e) {
    if(e)e.preventDefault();
    if(!validEmail.test(email) || !pass) {
      ToastsStore.warning("Champs non valides", 4500);

      return;
    }
    var auth = firebase.auth();
    const LogIn = (email, pass) => auth[`signInWithEmailAndPassword`](email, pass); 

    LogIn(email, pass)
      .then(() => {if(onClose)onClose()})
      .catch(e=>{
        ToastsStore.warning("Erreur lors de la connection", 4500);
        return;
      });
    //.catch(() => auth.showToast("Erreur Google-Login", 3000, "danger"));
  }

  function clickRegister(e) {
    e.preventDefault();
    if(!wantCreateUser){
    setCreateUser(true);
    }else{
      Register();
    }
  }
  function Register() {
    if(!validEmail.test(email)){
      ToastsStore.warning("Adresse email non valides", 4500);
      return;
    }
    if(pass !== confirmPass){
      ToastsStore.warning("Le champ de confirmation de mot de passe est différent", 4500);
      return;
    }
    var auth = firebase.auth(); 
    const CreateUser = (email, pass) => auth[`createUserWithEmailAndPassword`](email, pass);

    CreateUser(  email, pass )
    .then(() => {if(onClose)onClose()})
      .catch(() => ToastsStore.warning("Erreur Google-Login", 4500));
  }
  function clickForgot(e){
    e.preventDefault();
    if(validEmail.test(email)){
    firebase.auth().sendPasswordResetEmail(email)
    .then(a=>ToastsStore.success("Vérifiez vos courriels.", 4500))
    .catch(a=>ToastsStore.warning("Erreur lors de l'envoie du courriel", 4500));
    }else{
      ToastsStore.warning("Email invalide!", 4500);
    }
  }

  if(user && onClose)
  {
    onClose();
  }

  return ( 
    <BlockUi tag="div"blocking={emailing ? emailing : undefined} >
      <form class="login">
        <h4>Login</h4>
        <div class="formLogin">
          {user && <Redirect to="/" />}
          
          <div class={"socialLine"} />

          <button
            onClick={e => {
              e.preventDefault();

              var provider = new firebase.auth.GoogleAuthProvider();
              firebase.auth().signInWithPopup(provider)
                .then(() => {
                  //setRedirect("/"); appelé sur auth().onchanged... instead
                  if(onClose)onClose()
                })
                .catch(function (error) {
                  console.log("Error authenticating user:", error);
                });
              //auth.showToast("TODO : Call Firebase's Google Login.");
            }}
          >
            login Google
            </button>

          <div class="formField login">
            <b>Email :</b>
            <input
              id="email"
              onChange={(ev) => setEmail(ev.target.value)}
              autoFocus
              value={email}
            />
          </div>

          <div class="formField login">
            <b>Mot de passe :</b>
            <input
              type="password"
              id="pass"
              onChange={(ev) => setPass(ev.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (!wantCreateUser)
                    clickLogin();
                  console.log("Submit");
                }
              }
              }
            />
          </div>

          {wantCreateUser &&
            (<div class="formField login">
              <b>Confirmer mot de passe :</b>
              <input
              type="password"
                id="pass-confirm"
                onChange={(ev) => setConfirm(ev.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter')
                    Register();
                }
                }
              />
            </div>)}
        </div>

        {!wantCreateUser && (<>
        <button class="login" onClick={clickLogin}>
          Connexion
          </button>
        <br /></>)}

        <button class="register" onClick={clickRegister}>
          Créer compte
          </button>
        <br />

        {!wantCreateUser && (<>
        <button class="forgot" onClick={clickForgot}>
          Mot de passe oublié
          </button>
        <br/></>)}

          <button class="cancel" onClick={(e)=>{
            e.preventDefault();
            if(onClose) onClose()
          }}>
          Annuler
          </button> 
          <ToastsContainer store={ToastsStore}/>
      </form>      
    </BlockUi>
  );
};

export default LoginForm;
