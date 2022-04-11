import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [func, setFunc] = useState(() => (x) => x);
  return (
    <div>
      <div>{func("chicken")}</div>
    </div>
  );
}
