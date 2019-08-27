import React, { useState, useEffect, Fragment } from 'react';

import './App.css';
import firebase from 'firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useListVals } from 'react-firebase-hooks/database';
import { useCollection } from 'react-firebase-hooks/firestore';
import Calendar from './Calendar/Calendar.js';

import useLocalStorage from "./myUseLocalStorage.js";
import { ToastsContainer, ToastsStore } from 'react-toasts';

import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { sameDay, toDateString, paramToString } from "./utils.js";

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

const ParamArray = ({ paramName, newVal, onChange }) => {

  return (<>
    <button class="arrayField"
      onClick={(ev) => {
        ev.preventDefault();
        onChange([...newVal, ""]);
      }} >+</button>

    {newVal.map((nv, i) => (<div>
      <input class="arrayInput" value={nv} key={i}
        onChange={ev => {
          var changed = [...newVal];
          changed[i] = ev.target.value;
          onChange(changed);
        }} />
      <button class="minusButton"
        onClick={(ev) => {
          ev.preventDefault();
          onChange(newVal.filter((_, j) => j != i));
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
          <b>{paramName} : </b> {["emailsAdmin"].includes(paramName) ?
            <ParamArray {...{ paramName, newVal: newParams[paramName] }}
              onChange={newVal => setParam(paramName, newVal)} />
            : (<input onChange={(ev) => {
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

const DisplayReservations = ({ reservations, reservAdmin, bookings }) => {
  const [showPast, setshowPast] = useLocalStorage("voirPast", false);
  /*{Header: "Détails", accessor:"details"},
    defaultSortDesc={true}
    defaultSorted={["date"]}
  */
  function getBookingTitle(id) {
    return bookings ? bookings.find(b => b.id === id).titre : "";
  }

  const sortedByDate = (lst) => lst.sort((r1, r2) => r1.date.getTime() - r2.date.getTime())
  const sotredAndFiltered = showPast ? sortedByDate : (lst) => sortedByDate(lst)
    .filter(row => row.date.getTime() >= new Date().setHours(0, 0, 0, 0))
    .map(row => ({ ...row, bookingTitle: getBookingTitle(row.booking) }));

  function cancelReservation(reserv) {
    console.log("TODO : Canceller la réservation : " + JSON.stringify(reserv));
    firebase.firestore().collection("reservations")
      .doc(reserv.id).update({ active: false })
      .then(() => {
        if (reserv.publicReservation) {
          firebase.firestore().collection("reservationsPublic")
            .doc(reserv.publicReservation).update({ adminBlock: false })
            .catch((err) => {
              console.error(err);
              ToastsStore.warning("Erreur lors de la libération publique de la réservation!", 9999);
            })
        }
      })
      //.get().then(res=>{
      // if(res.exists)
      .catch(err => {
        console.error(err);
        ToastsStore.error("Erreur lors de l'annulation de la résrvation!", 9999);
      });

  }

  return (<div class="displayReservations">
    <button class={"toogle" + (showPast ? "On" : "Off")} onClick={() =>
      setshowPast(!showPast)}>{showPast ? "Cacher" : "Voir"} Passées</button>
    <div style={{ clear: "both" }} />
    <ReactTable
      defaultPageSize={10}
      data={sotredAndFiltered(reservAdmin)}
      filterable={true}
      columns={[
        { Header: "Nom", accessor: "nom" },
        { Header: "Prénom", accessor: "prenom" },
        { Header: "Nb Clients", accessor: "nbClients" },
        { Header: "Email", accessor: "email" },
        { Header: "Tél.", accessor: "tel" },
        { Header: "Date", accessor: "date" },
        { Header: "Type", accessor: "bookingTitle" },
      ]}
      SubComponent={row => {
        return (
          <div style={{ padding: "20px" }}>
            Détails : {row.original.details}
            <br />
            <button class="cancel" onClick={(ev) => {
              ev.preventDefault();
              cancelReservation(row.original);
              //ToastsStore.warning("Pas encore implémenté", );
            }}>Annuler la réservation</button>
            <br />
            <span class="warning message" >(Ce bouton ne fais pas le remboursement par sois même!<br />
              Vous devez visiter votre compte <a href="https://dashboard.stripe.com/account/team">Stripe</a> pour faire le remboursement.)</span>
          </div>
        );
      }}
      resolveData={data => {
        return data.map(({ date, booking, ...showables }) => ({ date: toDateString(date), booking: (bookings && bookings[booking]) || booking, ...showables } || {}));
      }}
    />
  </div>);
}

const MesReservations = ({ user, bookings, reservations, params }) => {

  const fbMesReserv = useCollection(firebase.firestore().collection('reservations')
    .where("email", "==", user.email));
  var mesReserv = fbMesReserv.loading || fbMesReserv.error ? [] : fbMesReserv.value.docs
    .map(doc => ({
      ...doc.data(), id: doc.id,
      date: new Date(doc.data().date.seconds * 1000)
    }))
    .sort((res1, res2) => res1.date - res2.date);

  //var cancellations = reservAdmin.filter(res => res.bookingType === "off");
  //reservAdmin = reservAdmin.filter(res => res.bookingType !== "off"); 

  function getBookingTitle(id) {
    return bookings ? bookings.find(b => b.id === id).titre : "";
  }

  return (<div class="mesReservations">
    <h4>Mes réservations</h4>
    <div class="firebaseCalendar">

      {(mesReserv && mesReserv.length > 0) ?  
        mesReserv
        .filter(row => {
          return row.date.getTime() >= new Date().setHours(0, 0, 0, 0);})
        .map(res => (<div key={res.id} class={
          "maReservation" + 
          (!res.active ? " cancelled":"")}>
        <span class="type">{getBookingTitle(res.booking)} </span>
        <span class="nbClients"> pour {res.nbClients} personnes le </span>
 <span class="date"> {toDateString(res.date)} </span>
</div>))
:
<div class="aucuneReservations">Aucune Réservation enregistrée à cette addresse courriel</div>}

    </div>
    <ToastsContainer store={ToastsStore} />
  </div>);

};


export default MesReservations;
