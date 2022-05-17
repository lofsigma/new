import { useState, useEffect, useRef } from "react";

import {
  geoOrthographic,
  geoPath,
  geoBounds,
  geoCentroid,
  geoInterpolate,
  geoGraticule,
} from "d3-geo";

import { geoZoom } from "../lib/index.js";
import { feature } from "topojson-client";

export default function Home() {
  // Constants
  const width = 700;
  const height = 700;

  // References
  const svgRef = useRef();
  const projRef = useRef(
    geoOrthographic()
      .scale(250)
      .center([0, 0])
      .rotate([0, -30])
      .translate([width / 2, height / 2])
  );

  // Hooks
  const [features, setFeatures] = useState([]);
  const [path, setPath] = useState(() => geoPath().projection(projRef.current));

  // Fetch Features
  const fetchFeatures = async () => {
    fetch("/countries-110m.json")
      .then((res) => res.json())
      .then((d) => setFeatures(feature(d, d.objects.countries).features));
  };

  const render = () => {
    setPath(() => geoPath().projection(projRef.current));
  };

  // RUNS ONCE
  useEffect(() => {
    fetchFeatures();

    geoZoom().projection(projRef.current).onMove(render)(svgRef.current);
  }, []);
  return (
    <div
      className="wrapper"
      viewBox="0 0 700 700"
      preserveAspectRatio="xMidYMid meet"
    >
      <svg ref={svgRef} width={width} height={height}>
        <g className="countries">
          {features.map((f) => (
            <path
              d={path(f)}
              stroke="black"
              strokeWidth="0.3"
              opacity="0.8"
              key={f.properties.id}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
