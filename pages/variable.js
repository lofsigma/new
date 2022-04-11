import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [variable, setVariable] = useState("bear");
  return (
    <div>
      <div>{variable}</div>
    </div>
  );
}
