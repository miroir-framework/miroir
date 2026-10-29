import { MlElement } from "miroir-core";
import { useState } from "react";

export const ChangeValueTypeSelect: React.FC<{ onChange: (type: MlElement) => void }> = ({
  onChange,
}) => {
  const [selectedType, setSelectedType] = useState("undefined");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value;
    setSelectedType(newType);
    let newMlSchema: MlElement | undefined;
    switch (newType) {
      case "undefined":
        newMlSchema = { type: "undefined" };
        break;
      case "record":
        newMlSchema = { type: "record", definition: { type: "any" } };
        break;
      case "array":
        newMlSchema = { type: "array", definition: { type: "any" } };
        break;
      case "simple":
        newMlSchema = { type: "string" }; // or any other simple type
        break;
      default:
        throw new Error(`Unsupported type: ${newType}`);
    }
    onChange(newMlSchema);
  };

  return (
    <div>
      <label htmlFor="valueTypeSelect">Change the value to:</label>
      <select id="valueTypeSelect" value={selectedType} onChange={handleChange}>
        <option value="undefined">Undefined</option>
        <option value="record">Object</option>
        <option value="array">Array</option>
        <option value="simple">Simple Type</option>
      </select>
    </div>
  );
};