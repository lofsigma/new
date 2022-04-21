import React, { useState, useEffect, useRef } from "react";
import { drag } from "d3-drag";
import { zoom, zoomIdentity } from "d3-zoom";
import { feature } from "topojson-client";
import { event, select } from "d3-selection";
import { transition } from "d3-transition";
// import * as Versor from "versor";
import {
  geoOrthographic,
  geoPath,
  geoBounds,
  geoCentroid,
  geoInterpolate,
  geoGraticule,
} from "d3-geo";

export default function Home() {
  const width = 500;
  const height = 500;
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

  const fetchFeatures = () => {
    fetch("/countries-110m.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((d) => {
        setFeatures(feature(d, d.objects.countries).features);
      });
  };

  // runs once
  useEffect(() => {
    fetchFeatures();
    select(inputRef.current)
      .call(
        drag().on("drag", (e, d) => {
          const k = sens / projRef.current.scale();
          const rotation = [
            projRef.current.rotate()[0] + e.dx * k,
            projRef.current.rotate()[1] - e.dy * k,
          ];
          projRef.current.rotate(rotation);
          setPath(() => geoPath().projection(projRef.current));
        })
      )
      .call(
        zoom().on("zoom", (e, d) => {
          if (e.transform.k > 0.3) {
            projRef.current.scale(scale * e.transform.k);
            setPath(() => geoPath().projection(projRef.current));
            setScale(projection.scale());
          } else {
            e.transform.k = 0.3;
          }
        })
      );
  }, []);

  // runs everytime projection changes.
  //   useEffect(() => {
  //     setPath(geoPath().projection(projRef));
  //   }, [projRef.current]);

  return (
    <div>
      <h1>hello</h1>
      <svg width={width} height={height}>
        <g>
          <path
            d={path(geoGraticule()())}
            fill="none"
            stroke="black"
            strokeWidth="0.3"
            opacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
}
