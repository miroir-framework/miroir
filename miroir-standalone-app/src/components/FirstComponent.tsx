import * as React from "react";
let Logo ="assets/a.jpg";
export default class FirstComponent extends React.Component <{}> {
  render() {
    return (
      <div>
        <h3>A Simple React Component Example with Typescript</h3>
        <div>
          <img height="250" src={Logo} /> 
        </div>
        <p>This component shows the Logrocket logo.</p>
        <p>For more info on Logrocket, please visit https://logrocket.com </p>
      </div>
    );
  }
}