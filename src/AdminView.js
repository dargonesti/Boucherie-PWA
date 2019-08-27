import React, { useState, useEffect, Fragment } from 'react';

import './App.css';
import firebase from 'firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useListVals } from 'react-firebase-hooks/database';
import { useCollection } from 'react-firebase-hooks/firestore';
import Calendar from './Calendar/Calendar.js';
import DisplayCommandes from "./DisplayCommandes.js";

import useLocalStorage from "./myUseLocalStorage.js";
import {ToastsContainer, ToastsStore} from 'react-toasts';

import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { sameDay, toDateString } from "./utils.js";

const DisplayParams = ({ adminParameters, onEdit }) => (
  <div class="adminParameters"> 
    {Object.keys(adminParameters).map(paramName => (
      <div key={paramName} class="adminParam">
        <b>{paramName} : </b> {paramToString(adminParameters[paramName])}
      </div>
    ))}

    <div class="adminParam">
      <button onClick={onEdit}>Modifier</button>
    </div>
  </div>);

const getType = (paramName) => {
  return {
    "maxClients": "number",
    "minClients": "number",
    "prixDiner": "number",
    "prixSouper": "number",
    //"emailsAdmin": "array"
  }[paramName] || "text";
};

const ParamArray = ({paramName, newVal, onChange}) => {

  return (<>
   <button class="arrayField"
   onClick={(ev)=>{
    ev.preventDefault();
    onChange([...newVal, ""]);
  }} >+</button>

  {newVal.map((nv,i)=>(<div>
  <input class="arrayInput" value={nv} key={i} 
  onChange={ev=>{
    var changed = [...newVal];
    changed[i] = ev.target.value;
    onChange(changed);
  }} />
   <button class="minusButton"
   onClick={(ev)=>{
    ev.preventDefault();
    onChange(newVal.filter((_,j)=>j!=i));
  }} >x</button>
  </div>))}
 
  </>);
};

const EditParams = ({ adminParameters, onEdited, user }) => {
  var { dateChangement, ...editableParams } = adminParameters;
  const [newParams, setNewParams] = useState(editableParams);
  const setParam = (key, value) => {
    var newVal = {};
    newVal[key] = getType(key) == "number" ? parseFloat(value) : value;
    setNewParams({ ...newParams, ...newVal });
  };

  console.log("EditParams");

  return (
    <div class="adminParameters"> 
      {Object.keys(newParams).map(paramName => (
        <div key={paramName} class="adminParam">
          <b>{paramName} : </b> {["emailsAdmin", "champsCommande"].includes(paramName) ? 
            <ParamArray {...{paramName, newVal:newParams[paramName]}}
            onChange={newVal=>setParam(paramName, newVal)} />
          :(<input onChange={(ev) => {
            console.log(ev);
            setParam(paramName, ev.target.value);
          }}
            type={getType(paramName)}
            value={paramToString(newParams[paramName])} />
            )}
        </div>
      ))}
      <div class="adminParam">
        <button onClick={() => {
          firebase.firestore().collection('adminParameters')
            .add({
              ...newParams,
              dateChangement: firebase.firestore.Timestamp.fromDate(new Date()),
              user: user.uid
            })
            .then(() => {
              ToastsStore.success("Changement enregistré", 4500);
            }).catch(ex => {
              console.error(ex);
              ToastsStore.warning("Erreur lors de l'enregistrement", 4500);
            });

          onEdited();
        }}>Sauvegarder</button>

        <button class="cancel" onClick={onEdited}>Annuler</button>
      </div>
    </div>);
};
 
const AdminView = ({ user, commandes, onBooking, reservations, params }) => {
  const [section, setSection] = useLocalStorage("section", "cal"); //param, cal, res
  const [editParams, setEditParams] = useState(false);

  const fbReservAdmin = useCollection(firebase.firestore().collection('reservations')
  .where("active", "==", true));
  var reservAdmin = fbReservAdmin.loading || fbReservAdmin.error ? [] : fbReservAdmin.value.docs
    .map(doc => ({ ...doc.data(), id: doc.id, booking: doc.data().booking, date: new Date(doc.data().date.seconds * 1000), user: doc.data().user }))
    .sort((res1, res2) => res1.date-res2.date);

  var cancellations = reservAdmin.filter(res => res.bookingType === "off");
  reservAdmin = reservAdmin.filter(res => res.bookingType !== "off");

  const reservSansDayOff = reservations.filter(res => !("adminBlock" in res));
 
  return (<div>
    <h3>Gestion des réservations <i>(Admin)</i></h3>
    <div class="adminHeader">
      <div class={"adminPageLink"+(section === "cal" ? " active":"")} onClick={() => setSection("cal")}>Calendrier</div>
      <div class={"adminPageLink"+(section === "res" ? " active":"")} onClick={() => setSection("res")}>Réservations</div>
      <div class={"adminPageLink"+(section === "param" ? " active":"")} onClick={() => setSection("param")}>Paramètres</div>
    </div>

   {false && (<h5><i>Bonjour {user.displayName}</i></h5>)}
 
    <div class="firebaseCalendar">

      {section === "param" && (!editParams ?
        <DisplayParams adminParameters={params} onEdit={() => {
          setEditParams(true);
        }} /> :
        <EditParams adminParameters={params} user={user}
          onEdited={() => {
            setEditParams(false);
          }} />)}

      {section !== "param" && section !== "res" &&
        <Calendar admin {...{ commandes, reservations, reservAdmin, onBooking, params, user }} />}

      {section === "res" && (<DisplayCommandes {...{ reservSansDayOff, reservAdmin, commandes }} />)}

    </div>
          <ToastsContainer store={ToastsStore}/>
  </div>);

};

function paramToString(param) {
  if(Array.isArray(param)){
    return param.join(", ");
  } else if (typeof (param) == "object"){
    return JSON.stringify(param);
  }
  else return param;
}

export default AdminView;
