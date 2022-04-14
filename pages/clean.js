import React, { useState, useEffect, useRef } from "react";
import { drag } from "d3-drag";
import { zoom, zoomIdentity } from "d3-zoom";
import { feature } from "topojson-client";
import { event, select } from "d3-selection";
import { transition } from "d3-transition";
import { format } from "d3-format";
import { geoScaleBar } from "d3-geo-scale-bar";
import { timer } from "d3-timer";
// import versor from "versor";
import {
  geoOrthographic,
  geoPath,
  geoBounds,
  geoCentroid,
  geoInterpolate,
  geoGraticule,
} from "d3-geo";

import Versor from "../lib/Versor";

export default function Home() {
  const width = 700;
  const height = 700;
  const sens = 75;

  const inputRef = useRef();
  const projRef = useRef(
    geoOrthographic()
      .scale(250)
      .center([0, 0])
      .rotate([0, -30])
      .translate([width / 2, height / 2])
  );

  const [features, setFeatures] = useState([]);
  const [path, setPath] = useState(() => geoPath().projection(projRef.current));
  const [scale, setScale] = useState(projRef.current.scale());
  const [active, setActive] = useState(null);
  const graticule = geoGraticule();

  useEffect(() => {}, []);

  return (
    <div>
      <h1>helllo</h1>
      <svg width={width} height={height} ref={inputRef}></svg>
    </div>
  );
}
