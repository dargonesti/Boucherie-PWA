import { map, reduce, indexBy } from "rambda"; 

function range(min, max) {
  var len = max - min + 1;
  var arr = new Array(len);
  for (var i = 0; i < len; i++) {
    arr[i] = min + i;
  }
  return arr;
}

function groupBy(pk, lst) {
  var key = pk;
  if (typeof (pk) !== "function") {
    key = (obj) => obj[pk];
  }
  if (Array.isArray(lst)) {
    return lst.reduce((total, cur) => {
      var processedKey = key(cur);
      if (!total[processedKey]) {
        total[processedKey] = [];
      }
      total[processedKey].push(cur);
      return total;
    }, {});
  } else if (typeof lst === "object") {
    return groupBy(key, Object.values(lst));
  }
  return {};
}

const validEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}/igm;

function getFirstDayOfTheMonth(pd) {
  return new Date(gyear(pd), pd.getMonth(), 1);
}
function getLastDayOfTheMonth(pd) {
  return new Date(gyear(pd), pd.getMonth() + 1, 0);
}
function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}
function getDaysInCurrentMonth(pd) {
  return getFirstDayOfTheMonth(pd).getDate();
}

function gday(pd) {
  return pd.getDay();
}
function gyear(pd) {
  return pd.getFullYear();
}

function jourToString(jour) {
  return joursemaine[jour];
}

function sameDay(j1, j2) {
  if (!j1 && !j2) return true;
  else if (!j1 || !j2) return false;
  return j1.getYear() == j2.getYear() &&
    j1.getMonth() == j2.getMonth() &&
    j1.getDate() == j2.getDate();
}

function dateToId(day) {
  return day.getFullYear() + "-" + day.getMonth() + "-" + day.getDate();
}

const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const joursemaine = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const toDateString = (date, avecJour) => ((date && date.getMilliseconds) ?
  (avecJour ? jourToString(date.getDay()) + " le " : "") +
  date.getDate() + " " + mois[date.getMonth()] + " " + date.getFullYear() :
  date);

function isDiner(bookable) {
  return bookable && /(diner|dîner)/gi.test(bookable.titre);
}

function paramToString(param) {
  if (Array.isArray(param)) {
    return param.join(", ");
  } else if (typeof (param) == "object") {
    return JSON.stringify(param);
  }
  else return param;
}

function sumNbClients(resLst) {
  var ret = resLst.reduce((total, cur) => {
    return (cur && !isNaN(cur.nbClients) ? cur.nbClients : 0) + total;
  }, 0);
  return ret <= 0 && resLst && resLst.length > 0 ? 999 : ret;
}

function groupNbClients(resLst) {
  var grouped = groupBy((cur) => dateToId(cur.date), resLst); 

  for (var day in grouped) {
    grouped[day] = groupBy("booking", grouped[day]);
  } 

  var ret = map(day =>
    map(dayVal =>
      reduce((t, res) => {
        if(res.adminBlock) return t + 1000;
        if(res.adminBlock === false) return t;
        return t +
          (isNaN(res.nbClients) ?
            1000 : res.nbClients);
      }, 0, dayVal), day),
    grouped);
  return ret;
}

function getAvailablities(date){
  var curDayRes = reservations.filter(res => sameDay(res.date, date));
  var bookedGrouped = groupNbClients(curDayRes);
  bookedGrouped = bookedGrouped[dateToId(date)];

  var usedSpots = map(b=> (bookedGrouped || {})[b.id] || 0 , indexBy(o=>o.id, bookings));
  //console.log(usedSpots);

  var availabilities = map(b=>0, usedSpots);
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

var params = {};
var bookings = [];
var reservations = [];
const setParams = o=>{params=o;};
const setBookings = o=>{bookings=o;};
const setReservations = o=>{reservations=o;};
export {
  setParams,
  setBookings,
  setReservations,

  range,
  groupBy,
  validEmail,
  getFirstDayOfTheMonth,
  getLastDayOfTheMonth,
  getDaysInMonth,
  getDaysInCurrentMonth,
  gday,
  gyear,
  jourToString,
  sameDay,
  toDateString,
  dateToId,
  mois, joursemaine,
  isDiner,
  paramToString,
  sumNbClients,
  groupNbClients,
  getAvailablities
};
