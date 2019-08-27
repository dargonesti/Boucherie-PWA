import React, { useState, useEffect, Fragment } from 'react';

import './App.css';
import firebase from 'firebase';

import useLocalStorage from "./myUseLocalStorage.js";
import {ToastsContainer, ToastsStore} from 'react-toasts';

import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { sameDay, toDateString } from "./utils.js";

const DisplayCommandes = ({ reservations, reservAdmin, commandes }) => {
  const [showPast, setshowPast] = useLocalStorage("voirPast", false);
  /*{Header: "Détails", accessor:"details"},
    defaultSortDesc={true}
    defaultSorted={["date"]}
  */
 function getBookingTitle(id){
   return commandes ? commandes.find(b=>b.id === id).titre : "";
 }

  const sortedByDate = (lst) => lst.sort((r1, r2) => r1.date.getTime() - r2.date.getTime())
  const sotredAndFiltered = showPast ? sortedByDate : (lst) => sortedByDate(lst)
  .filter(row => row.date.getTime() >= new Date().setHours(0, 0, 0, 0))
  .map(row => ({...row, bookingTitle: getBookingTitle(row.booking)}));

  function cancelReservation(reserv){
    console.log("TODO : Canceller la réservation : " + JSON.stringify(reserv));
    firebase.firestore().collection("reservations")
    .doc(reserv.id).update({active:false})
    .then(()=>{
      if(reserv.publicReservation){
        firebase.firestore().collection("reservationsPublic")
        .doc(reserv.publicReservation).update({adminBlock: false})
        .catch((err)=>{
          console.error(err);
          ToastsStore.warning("Erreur lors de la libération publique de la réservation!", 9999);
        })
      }
    })
    //.get().then(res=>{
     // if(res.exists)
    .catch(err=>{
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
        { Header: "Email", accessor: "email" },
        { Header: "Tél.", accessor: "tel" },
        { Header: "Creation", accessor: "dateCreation" },
        { Header: "Date Due", accessor: "dateDue" },
        { Header: "Etat", accessor: "etat" },
      ]}
      SubComponent={row => {
        return (
          <div style={{ padding: "20px" }}>
            Détails : {row.original.details}
           <br />
           <button class="cancel" onClick={(ev)=>{
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
        return data.map(({ date, booking, ...showables }) => ({ date: toDateString(date), booking: (commandes && commandes[booking]) || booking, ...showables } || {}));
      }}
    />
  </div>);
}

export default DisplayCommandes;
