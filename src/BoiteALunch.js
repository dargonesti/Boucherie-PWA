import React, { useState, Fragment } from 'react';
import './App.css';
import BlockUi from 'react-block-ui';
import SelectField from "./SelectField.js";
import BookingForm from './BookingForm.js';
import DaySquare from './Calendar/DaySquare.js'; 
import firebase from 'firebase';
import { useCollection } from 'react-firebase-hooks/firestore';

import useLocalStorage from "./myUseLocalStorage.js";
import {
  range, mois, sameDay, convertFBDate, getFirstDayOfTheMonth,
  getLastDayOfTheMonth, jourToString, dateToId, isDiner
} from "./utils.js";
import { ToastsContainer, ToastsStore } from 'react-toasts';
 
const DetailsBookables = ({ reservations, bookables, selectedDate, onBooking }) => {
  var spots = bookables || [];
  var dateString = (selectedDate.getDate()) + "/" + (selectedDate.getMonth() + 1) + "/" + selectedDate.getFullYear();
  if (bookables.length <= 0) return null;
  return (<div class="detailBookables">
    {spots.map((fs, ind) => {
      let reservation = (reservations || []).find(res => res.booking === fs.id);

      return (<div key={ind + "" + fs.id}>
        <div class={"freeSpot" +
          (fs.mode ? " " + fs.mode : "")}
          style={{ display: "inline-block", marginRight: 5 }} />
        <a href="#" onClick={(e) => {
          e.preventDefault();
          if (onBooking) onBooking(selectedDate, fs);
        }}>{dateString} - {fs.titre}</a>{
          reservation && (" : " + reservation.prenom + " " + reservation.nom + ", " +
            reservation.nbClients + " personnes. (" + reservation.email + ")")
        }</div>);
    })
    }
  </div>)
};

const BoiteALunch = ({ admin, user, reservations, reservAdmin, bookings, params, ...props }) => {
  const thisYear = parseInt(new Date().getFullYear());
  const curDate = new Date();

  const dinerBooking = (bookings || []).find(b => isDiner(b));
 
  function getActiveBooking(date) {
    var curDayRes = reservations.filter(res => sameDay(res.date, date));
  
    if(!dinerBooking || 
      curDayRes.some(res => res.booking === dinerBooking.id &&
        (res.adminBlock === undefined || res.adminBlock)
    )) {
      return [];
    }
    else{
      return [dinerBooking];
    }
  }

  const [viewingYear, setYear] = useState(new Date().getFullYear());
  const [viewingMonth, setMonth] = useState(new Date().getMonth());

  const [massBook, setMassBook] = useState({});
  const [lstToBook, setToBook] = useState({});
  const checkedToBook = Object.keys(massBook).filter(m => massBook[m]);
  const [saving, setSaving] = useState(false);

  const [selectedDate, setSelectedDate] = useState( null);
  var selDate = selectedDate ? new Date(Date.parse(selectedDate)) : new Date();
  const selectedYear = selDate.getFullYear();
  const selectedMonth = selDate.getMonth();

  var viewingDate = new Date(viewingYear, viewingMonth);

  var firstDay = getFirstDayOfTheMonth(viewingDate);//selDate);
  var lastDay = getLastDayOfTheMonth(viewingDate);//selDate);
 
 
  var weeks = [[]];
  for (var i = 0; i < 7; i++) {
    weeks[0].push(<div key={i} class="dayName">{jourToString(i)}</div>);
  }
  weeks.push([]);
 
  var lastWeek;
  var daysFromNow = 1;
  var firstWeekDay = new Date(curDate.getTime());
  firstWeekDay.setDate(firstWeekDay.getDate()+1);

  while(firstWeekDay.getDay() != 0){
    firstWeekDay = new Date(curDate.getTime());
    firstWeekDay.setDate(firstWeekDay.getDate()+ (++daysFromNow));
  }

  lastWeek = weeks[weeks.length - 1];
  
  for (var i = 0; i < 7; i++) {     
    let weekDay = new Date(curDate.getTime());
    weekDay.setDate(curDate.getDate() + (daysFromNow + i));
    
    let selected = selectedDate && selDate.getYear() === weekDay.getYear() &&
    weekDay.getMonth() === selDate.getMonth() &&
      weekDay.getDate() === selDate.getDate();
 
      let availableBooking = getActiveBooking(weekDay);

    lastWeek.push(<DaySquare key={i} day={weekDay}
      freeSpots={ availableBooking}
      selectedWeek={selected}
      willMassBook={lstToBook[dateToId(weekDay)]}
      booked={!availableBooking || !availableBooking[0]}
      onSelect={() => {
        if(!availableBooking || !availableBooking[0]) return;
          if (admin && Object.values(massBook).some(active => active)) {
            //onMouseDown instead - toogleDayToMassBook(thisDate);
          } else {
            if (sameDay(selDate, weekDay)) {
              setSelectedDate(null);
            } else {
              setSelectedDate(weekDay);
            }
        }
      }}
      onBooking={props.onBooking} />);
  }

  return (<div>
    <BlockUi tag="div" blocking={saving ? saving : undefined}>
      {/*} <LoginGoogle />*/}
      <h3 class="boiteALunchTitre">Réserver pour un dîner</h3>
     
      <div class="firebaseCalendar">
        {weeks.map((week, ind) => (<Fragment key={ind + 123}>
          <div class="calendarWeek">
            {week.map((day, ind) => day)}
          </div>
          <div key={ind + 321} class="calendarWeek">
            {selectedDate &&
             week.some(day => selDate && sameDay(day.props.day, selDate)) &&
             dinerBooking && 
            
      <BookingForm date={selectedDate} bookable={dinerBooking} 
      params={params} user={user} onClose={(e) => {
        setSelectedDate(null);
        ToastsStore.message("Réservation enregistrée!");
      }} onSave={() => {
        setSelectedDate(null);
        ToastsStore.message("Réservation enregistrée!");
      }} />}
              </div>
        </Fragment>))}
      </div>
      <div style={{ clear: "both" }} />
    </BlockUi>
    <ToastsContainer store={ToastsStore} />
  </div>);
};
 

console.log("Boite a lunch")
export default BoiteALunch;
