import React, { useState, Fragment } from 'react';
import '../App.css';
import BlockUi from 'react-block-ui';
import SelectField from "../SelectField.js";
import firebase from 'firebase';
import * as R from "rambda";
import { useCollection } from 'react-firebase-hooks/firestore';

import useLocalStorage from "../myUseLocalStorage.js";
import DaySquare from './DaySquare.js';
import {
  range, mois, sameDay, convertFBDate, getFirstDayOfTheMonth,
  getLastDayOfTheMonth, jourToString, dateToId
  , groupNbClients, sumNbClients
} from "../utils.js";
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

const Calendar = ({ admin, user, reservations, reservAdmin, bookings, params, ...props }) => {
  const thisYear = parseInt(new Date().getFullYear());
  const curDate = new Date();

  const moisFutur = params.moisFutur || 12;
  const maxYear = thisYear + Math.floor((curDate.getMonth() + moisFutur) / 12);
  const maxDate = new Date(maxYear, (curDate.getMonth() + moisFutur) % 12, 7);
  const beforeMaxDate = (date) => date - maxDate <= 0;

  bookings=[];
  function getActiveBooking(date) {
    var curDayRes = reservations.filter(res => sameDay(res.date, date));
    return [];
    if (admin) {
      return bookings.map(b => ({
        ...b, mode:
          curDayRes.some(res => res.booking === b.id && !("adminBlock" in res)) ? "res" :
            (curDayRes.some(res => res.booking === b.id && res.adminBlock) ? 
            "off" : "on")
      }));
    } else {
      return bookings.filter(b=> getAvailablities(date)[b.id] > 0);
    }
  }

  function getAvailablities(date){
    var curDayRes = reservations.filter(res => sameDay(res.date, date));
    var bookedGrouped = groupNbClients(curDayRes);
    bookedGrouped = bookedGrouped[dateToId(date)];

    var usedSpots = R.map(b=> (bookedGrouped || {})[b.id] || 0 , R.indexBy(o=>o.id, bookings));
    //console.log(usedSpots);

    var availabilities = R.map(b=>0, usedSpots);
    bookings.forEach( b => {
      if(b.canBookManyGroups){
        availabilities[b.id] = params.maxClients - usedSpots[b.id];
      }else {
        availabilities[b.id] = usedSpots[b.id] > 0 ? 0 : params.maxClients;         
      }

      if(availabilities[b.id] < params.minClients){
        availabilities[b.id] = 0;
      }
    });
    //console.log(availabilities);
    return availabilities; 
  }

  const [viewingYear, setYear] = useState(new Date().getFullYear());
  const [viewingMonth, setMonth] = useState(new Date().getMonth());

  const [massBook, setMassBook] = useState({});
  const [lstToBook, setToBook] = useState({});
  const checkedToBook = Object.keys(massBook).filter(m => massBook[m]);
  const [saving, setSaving] = useState(false);

  const [selectedDate, setSelectedDate] = useLocalStorage("selectedDate", null);
  var selDate = selectedDate ? new Date(Date.parse(selectedDate)) : new Date();
  const selectedYear = selDate.getFullYear();
  const selectedMonth = selDate.getMonth();

  var viewingDate = new Date(viewingYear, viewingMonth);

  var firstDay = getFirstDayOfTheMonth(viewingDate);//selDate);
  var lastDay = getLastDayOfTheMonth(viewingDate);//selDate);

  function toogleDayToMassBook(day, bookId) {
    let actBook = getActiveBooking(day);
    var newVal = { ...lstToBook };
    for (var m of (bookId ? [bookId] : checkedToBook)) {
      if (actBook.some(active => active.id === m && active.mode !== "res")) {
        var newDayVal = newVal[dateToId(day)] || {};
        newDayVal[m] = newDayVal[m] ? false : m; // + m
        newVal[dateToId(day)] = newDayVal;
      }
    }
    setToBook(newVal);
  }

  function saveAdminBlocks() {
    var doSave = 0;
    for (let day in lstToBook) {
      Object.values(lstToBook[day]).forEach(booking => {
        if (booking) { // either false of booking.Id
          var dParts = day.split("-");
          doSave++;
          var parsedDay = new Date(dParts[0], dParts[1], dParts[2]);
          bloqueFirebase(parsedDay, booking, user,
            reservations.find(res => sameDay(res.date, parsedDay) && res.booking === booking),
            () => {
              if (--doSave <= 0) {
                setSaving(false);
                setToBook({});
                ToastsStore.success("Changement enregistré", 4500);
              }
            });
        }
      })
    }
    if (doSave) setSaving(true)
  }

  var weeks = [[]];
  for (var i = 0; i < 7; i++) {
    weeks[0].push(<div key={i} class="dayName">{jourToString(i)}</div>);
  }
  weeks.push([]);

  for (var i = firstDay.getDay(); i > 0; i--) {
    weeks[1].push(<DaySquare key={i - 1000} day={new Date(firstDay.getYear(), firstDay.getMonth(), -i + 1)} passed
      onSelect={() => {
        setSelectedDate(null);
        if (viewingMonth == 0) {
          setYear(viewingYear - 1);
        }
        setMonth((12 + viewingMonth - 1) % 12);
      }} />);
  }

  var lastWeek;
  for (var i = 0; i < lastDay.getDate(); i++) {
    let date = i + 1;

    if (weeks.length === 0 || weeks[weeks.length - 1].length === 7) {
      weeks.push([]);
    }
    lastWeek = weeks[weeks.length - 1];
    let deltaTime = (new Date(viewingYear, viewingMonth, date + 1)).getTime() - curDate.getTime();
    //(firstDay.getYear() != curDate.getYear() || curDate.getMonth() != firstDay.getMonth()) ? -1234 : date - curDate.getDate();
    let selected = selectedDate && selDate.getYear() === firstDay.getYear() &&
      firstDay.getMonth() === selDate.getMonth() &&
      date === selDate.getDate();

    let thisDate = new Date(viewingYear, viewingMonth, date);
    // offBlock={deltaTime < 0 ? [] : getOffBooking(thisDate)}
    lastWeek.push(<DaySquare key={i} day={thisDate}
      freeSpots={deltaTime < 0 ? [] : getActiveBooking(thisDate)}
      passed={false && deltaTime < 0} today={deltaTime === 0}
      selected={selected}
      willMassBook={lstToBook[dateToId(thisDate)]}
      onMouseDown={ev => {
        if (ev.nativeEvent.buttons > 0 &&
          admin && Object.values(massBook).some(active => active)) {
          toogleDayToMassBook(thisDate);
        }
      }}
      onSelect={() => {
        if (deltaTime >= 0) {
          if (admin && Object.values(massBook).some(active => active)) {
            //onMouseDown instead - toogleDayToMassBook(thisDate);
          } else {
            if (sameDay(selDate, thisDate)) {
              setSelectedDate(null);
            } else {
              setSelectedDate(thisDate);
            }
          }
        }
      }}
      onBooking={props.onBooking} />);
  }
  var j = 1;
  for (var i = lastWeek.length; i < 7; i++) {
    let squareDate = new Date(viewingYear, viewingMonth + 1, j++);
    lastWeek.push(<DaySquare key={i} day={squareDate} passed
      onSelect={() => {
        setSelectedDate(null);
        if (beforeMaxDate(squareDate)) {
          setYear(squareDate.getFullYear());
          setMonth(squareDate.getMonth());
        } else {
          ToastsStore.warning("La date sélectionnée est trop loin dans le futur");
        }
      }} />);
  }


  return <h3>(Example: )Calendrier des réservations</h3>;
  return (<div>
    <BlockUi tag="div" blocking={saving ? saving : undefined}>
      {/*} <LoginGoogle />*/}
      <h3>Calendrier des réservations</h3>
 
      <div class="calendarMonth">
        <SelectField onChange={(ev) => {
          setYear(parseInt(ev));
          setSelectedDate(null);
          if(!beforeMaxDate(new Date(parseInt(ev), viewingMonth))){
            setMonth(0);
          }
        }} val={viewingYear} label={"Année"}
          options={range(thisYear, maxYear)} />

        <SelectField onChange={(ev) => {
          setMonth(parseInt(ev));
          setSelectedDate(null);
        }} val={viewingMonth} label={"Mois"}
          options={(maxYear != viewingYear ?
            range(0, 11) :
            range(0, (curDate.getMonth() + moisFutur) % 12))
            .map(op => ([op, mois[op]]))} />


        {admin && (<div class="checkMassBook">
          <h5>Bloquer journées : </h5>
          {bookings.map(b => <div class="chkBlocking" key={b.id}>
            <input type="checkbox" name={b.id} value={b.id}
              onChange={(e) => {
                var newVal = { ...massBook };
                newVal[b.id] = !massBook[b.id];
                setMassBook(newVal);
                if (newVal[b.id])
                  setSelectedDate(null);
              }} />{b.titre}
          </div>)}
          <br />
          <button onClick={saveAdminBlocks}>Bloquer {Object.values(lstToBook).filter(b => b[bookings[0].id]).length} dîners
        et {Object.values(lstToBook).filter(b => b[bookings[1].id]).length} Soupers</button>
        </div>)}
      </div>

      <div class="firebaseCalendar">
        {weeks.map((week, ind) => (<Fragment key={ind + 123}>
          <div class="calendarWeek">
            {week.map((day, ind) => day)}
          </div>
          <div key={ind + 321} class="calendarWeek">
            {selectedDate && week.some(day => selDate && sameDay(day.props.day, selDate)) &&
              <DetailsBookables bookables={getActiveBooking(selDate)} selectedDate={selDate}
                onBooking={admin ? (date, bookable) => {
                  if (["off", "on"].includes(bookable.mode)) {
                    toogleDayToMassBook(date, bookable.id);
                  }
                } : props.onBooking}
                reservations={reservAdmin && reservAdmin.filter(res => sameDay(selDate, res.date))} />}
          </div>
        </Fragment>))}
      </div>
      <div style={{ clear: "both" }} />
    </BlockUi>
    <ToastsContainer store={ToastsStore} />
  </div>);
};

function bloqueFirebase(date, bookId, user, res, final) {
  const db = firebase.firestore();
  var wantLocked = res && res.adminBlock;

  var reservationPub = {
    booking: bookId,
    date: firebase.firestore.Timestamp.fromDate(date),
    user: user ? user.uid : "",
    adminBlock: !wantLocked
  };

  var promiseSave;

  if (res) {
    promiseSave = db.collection("reservationsPublic").doc(res.id).update(reservationPub);
  } else {
    promiseSave = db.collection("reservationsPublic").add(reservationPub);
  }
  promiseSave.then(function (docRef) {
    final();
  })
    .catch(function (error) {
      console.error("Erreur pour bloquer (" + date + "): ", error);
      final();
      ToastsStore.warning("Erreur lors de l'enregistrement", 4500);
    });
}


console.log("calendar")
export default Calendar;
