import * as React from "react";
import * as ReactDOM from "react-dom";
import FirstComponent from './components/FirstComponent'
import UserComponent from "./components/UserComponent";
import entityEntity from "./entities/Entity.json";
import reportEntity from "./entities/Report.json";

ReactDOM.render(
    <div>
      <h1>Hello, Welcome to React and TypeScript</h1>
      {entityEntity["name"]}
      {/* <FirstComponent/> */}
      <UserComponent name="John Doe" age={26} address="87 Summer St, Boston, MA 02110" dob={new Date()} />
    </div>,
    document.getElementById("root")
);