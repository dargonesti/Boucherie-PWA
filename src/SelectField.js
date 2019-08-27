import React, { useState } from 'react';
import './App.css';
import 'react-block-ui/style.css';


const SelectField = ({ onChange, val, label, options }) => {
  const [titre, setTitre] = useState("");

  return (<div class="formField">
    <b>{label || ""} :</b>
    <select onChange={(ev) => {
      onChange(ev.target.value);
      setTitre(ev.target.value);
    }}
    defaultValue={val}
    key={val} >

       {(options && Array.isArray(options[0])) ?
         options.map(op => <option key={op[0]} value={op[0]} >{op[1]}</option>) 
        :
        options.map(op => <option  key={op} value={op} >{op}</option>) 
      }
    </select>
  </div>);
}

export default SelectField;
