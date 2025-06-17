import { JzodElement } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { useState } from "react";

export const ChangeValueTypeSelect: React.FC<{ onChange: (type: JzodElement) => void }> = ({
  onChange,
}) => {
  const [selectedType, setSelectedType] = useState("undefined");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value;
    setSelectedType(newType);
    let newJzodSchema: JzodElement | undefined;
    switch (newType) {
      case "undefined":
        newJzodSchema = { type: "undefined" };
        break;
      case "record":
        newJzodSchema = { type: "record", definition: { type: "any" } };
        break;
      case "array":
        newJzodSchema = { type: "array", definition: { type: "any" } };
        break;
      case "simple":
        newJzodSchema = { type: "string" }; // or any other simple type
        break;
      default:
        throw new Error(`Unsupported type: ${newType}`);
    }
    onChange(newJzodSchema);
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