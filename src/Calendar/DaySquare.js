import React, { useState } from 'react';
import '../App.css';
 
const DaySquare = ({ day, booked, passed, freeSpots, today, selected,  selectedWeek, onSelect, onMouseDown, onBooking, willMassBook }) => {
  const [isHover, setHover] = useState(false);

  function handleMouseHover(e) {
    setHover(e.type === "mouseenter");
    //console.log(e.type);
  }

  var spots = freeSpots || [];
  var classDaySquare = "daySquare" + 
  (passed ? " passedDay" : "") +
    (isHover ? " hoverSpot" : "") + 
    (today ? " nowCell" : "") +
    (booked ? " passedDay":"") +  
    (selected ? " selectedCell" : "") +
    (selectedWeek ? " hoverSpot" : "") +
    ((spots.length > 0 && willMassBook &&
      Object.values(willMassBook).some(v => v)) ? " willMassBook" : "");

  return (<div class={classDaySquare} onClick={() => {
    if (onSelect) onSelect();
  }}
    onMouseDown={onMouseDown}
    onMouseEnter={onMouseDown}
  >
    <div class="dayTop">
      <div class="dayNumber">{day.getDate()}</div>
    </div>
    <div class="dayBottom">
      <div class="freeSpots"
        onMouseEnter={handleMouseHover}
        onMouseLeave={handleMouseHover} >
        {spots.map((fs, i) => <div key={i}
          class={"freeSpot" +
            (fs.mode ? " " + fs.mode : "") +
            ((willMassBook && willMassBook[fs.id]) ? " change" : "")}
          onClick={(e) => {
            console.log("Click Spot! - " + fs.titre);
            if (onBooking) onBooking(day, fs);
          }}></div>)}
      </div>
      {booked && <div class="bookedMessage">Déjà pris</div>}
    </div>
  </div>);
}

export default DaySquare;
