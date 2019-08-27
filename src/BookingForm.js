import React, { useState } from 'react';
import './App.css';
import firebase from 'firebase';
//import PayForm from "./PayForm.js";
import SelectField from "./SelectField.js";
import BlockUi from 'react-block-ui';
import 'react-block-ui/style.css';
import {range, validEmail, toDateString, isDiner, getAvailablities} from "./utils.js";

 
const MemoField = ({ onChange, val, label, required }) => {
  //const [titre, setTitre] = useState(val || "");
  return (<div class="formField">
    <b>{label || ""} :</b>
    <textarea id={label} required={required} value={val}
      onChange={(ev) => {
        onChange(ev.target.value);
      }} />
  </div>);
} 

const TextField = ({ onChange, val, label, required }) => {
  //const [titre, setTitre] = useState(val || "");
  return (<div class="formField">
    <b>{label || ""} :</b>
    <input id={label} required={required} value={val}
      onChange={(ev) => {
        onChange(ev.target.value);
      }} />
  </div>);
}

const BookingForm = ({ params, date, bookable, onClose, onSave, user }) => {
  const [titre, setTitre] = useState("Mr.");
  const [nom, setNom] = useState((user && user.displayName) ? user.displayName.split(" ").pop() : "");
  const [prenom, setPrenom] = useState((user && user.displayName) ? user.displayName.split(" ")[0] : "");
  const [email, setEmail] = useState(user ? user.email : "");
  const [tel, setTel] = useState("");
  const [desc, setDesc] = useState("");
  const [nbClients, setNbClients] = useState(10);
  const [choixDiner, setChoixDiner] = useState(1);
  const price = (!isDiner(bookable) ? params.prixReservationSouper : params.prixReservationDiner )*100 || 4000;

  const [paying, setPaying] = useState(false);

  function valider() {
    return nom && prenom && validEmail.test(email);
  }
 
  return (<div class="bookForm">
    <BlockUi tag="div" blocking={paying ? paying : undefined}>
      <div class="enteteBooking">
        <div class="titreBooking">{bookable.titre}</div>
        <div class="dateBooking">{toDateString(date, true)}</div>
      </div>
      {user ? (<>
        <SelectField onChange={setTitre} val={titre} label={"Titre"}
          options={["Mr.", "Mme.", ""]} />

        <SelectField onChange={setNbClients} val={nbClients} label="Nombre de personnes"
          options={range(params.minClients,  getAvailablities(date)[bookable.id] )} />

          {isDiner(bookable) && 
          <SelectField onChange={setChoixDiner} val={choixDiner} label="Choix du dîner" 
          options={[1,2]} /> }

        <TextField onChange={setPrenom} val={prenom} label={"Prénom"} />
        <TextField onChange={setNom} val={nom} label={"Nom"} />
        <TextField onChange={setEmail} val={email} label={"Email"} />
        <TextField onChange={setTel} val={tel} label={"Téléphone"} />

        <MemoField onChange={setDesc} val={desc} label={"Description"} />

        <div class="formField">
          <b>Un dépôt de {price / 100}$ est demandé pour réserver.</b>
        </div>

        <div class="bookingBoutons formField">

          {/*<button onClick={() => {
        if (!user) {
          firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
              if (valider()) {
                saveFirebase();
              }
            } else {

            }
          });
          firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());

        } else if (valider()) {
          saveFirebase();
        }
        else {
          alert("Champs invalides!");
        }
      }
      }>Réserver</button>

          <PayForm price={price} user={user} date={date.toDateString()}
            onSave={onSave}
            onStartPay={(isPaying) => setPaying(isPaying)}
            reservationData={{
              booking: bookable.id,
              date: firebase.firestore.Timestamp.fromDate(date),
              user: user ? user.uid : "",
              bookingType: "meal",
              nbClients,
              details: desc,
              prenom,
              nom,
              email,
              tel,
              sex:titre,
              choixDiner:(isDiner(bookable) ? choixDiner : 0)
            }} />*/}
          <br /><button onClick={onClose}>Cancel</button>
        </div>
      </>)
        :
        (<div class="loginForm">
          Connectez vous pour réserver!
      <br /><button class="cancel" style={{marginTop:10}} onClick={onClose}>Cancel</button>
        </div>)}
      <div style={{ clear: "both" }} />
    </BlockUi>
  </div>);
};

export default BookingForm;
