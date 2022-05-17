import React, { useState, useEffect, useRef } from "react";
import { drag } from "d3-drag";
import { zoom, zoomIdentity } from "d3-zoom";
import { feature } from "topojson-client";
import { event, select, pointers } from "d3-selection";
import { transition } from "d3-transition";
import { format } from "d3-format";
import { geoScaleBar } from "d3-geo-scale-bar";
import { mean } from "d3-array";
import { timer } from "d3-timer";
import { interpolateNumber } from "d3-interpolate";
import { Delaunay } from "d3-delaunay";
import { geoZoom } from "d3-geo-zoom";
import {
  geoOrthographic,
  geoPath,
  geoBounds,
  geoCentroid,
  geoInterpolate,
  geoGraticule,
} from "d3-geo";

import Versor from "../lib/Versor";
import versor from "../lib/oldVersor";

export default function Home() {
  const width = 700;
  const height = 700;

  const ref = useRef();
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
  const [active, setActive] = useState(null);

  const fetchFeatures = () => {
    fetch("/countries-110m.json")
      .then((res) => res.json())
      .then((d) => {
        setFeatures(feature(d, d.objects.countries).features);
      });
  };

  useEffect(() => {
    select(inputRef.current);
    //   // .call(
    //   //   dragBehavior(projRef.current).on("drag.render", () =>
    //   //     setPath(() => geoPath().projection(projRef.current))
    //   //   )
    //   // )
    //   .call(
    //     zoomBehavior(projRef.current).on("zoom.render", () =>
    //       setPath(() => geoPath().projection(projRef.current))
    //     )
    // );

    geoZoom()
      .projection(projRef.current)
      .onMove(() => {
        setPath(() => geoPath().projection(projRef.current));
      })(inputRef);
  }, []);

  return (
    <div className="wrapper">
      <svg
        width="100%"
        height={height}
        ref={inputRef}
        viewBox="0 0 700 700"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle
          fill="#d3d3d3"
          stroke="000"
          strokeWidth="0.2"
          cx="50%"
          cy="50%"
          r={projRef.current.scale()}
        />
        <g className="countries">
          {features.map((f) => (
            <path
              d={path(f)}
              fill={f.properties.name === active ? "orange" : "white"}
              stroke="black"
              strokeWidth="0.3"
              opacity="0.8"
              key={f.properties.id}
              onClick={() => {
                f.properties.name === active
                  ? setActive(null)
                  : setActive(f.properties.name);
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
