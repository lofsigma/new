import { useState, useEffect, useRef } from "react";

import {
  geoOrthographic,
  geoPath,
  geoBounds,
  geoCentroid,
  geoInterpolate,
  geoGraticule,
  geoProjection,
} from "d3-geo";

import { geoZoom } from "../lib/index.js";
import { interpolateNumber } from "d3-interpolate";
import Versor from "../lib/Versor";
import { feature } from "topojson-client";
import { transition } from "d3-transition";

export default function Home() {
  // Constants
  const width = 700;
  const height = 700;
  const graticule = geoGraticule();

  // References
  const svgRef = useRef();
  const projRef = useRef(
    geoOrthographic()
      .scale(330)
      .center([0, 0])
      .rotate([0, -30])
      .translate([width / 2, height / 2])
  );

  // Hooks
  const [features, setFeatures] = useState([]);
  const [path, setPath] = useState(() => geoPath().projection(projRef.current));

  // Functions
  const fetchFeatures = async () => {
    fetch("/countries-110m.json")
      .then((res) => res.json())
      .then((d) => setFeatures(feature(d, d.objects.countries).features));
  };

  const render = () => {
    setPath(() => geoPath().projection(projRef.current));
    console.log("after");
    console.log(projRef.current.scale());
    console.log(projRef.current.scale());
  };

  // RUNS ONCE
  useEffect(() => {
    fetchFeatures();

    geoZoom().projection(projRef.current).onMove(render)(svgRef.current);
  }, []);
  return (
    <div className="wrapper">
      <svg
        ref={svgRef}
        width="98%"
        viewBox="0 0 700 700"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={width} height={height} fill="none" stroke="red" />
        <g className="graticule">
          <path d={path(graticule())} fill="none" stroke="gray" opacity={0.6} />
        </g>
        <g className="countries">
          {features.map((f) => (
            <path
              d={path(f)}
              stroke="black"
              strokeWidth="0.3"
              opacity="1"
              fill="green"
              key={f.properties.id}
            />
          ))}
        </g>
      </svg>
      <button
        onClick={() => {
          // runs animation after loading.
          console.log("before");
          console.log(projRef.current.scale());
          console.log(projRef.current.scale());
          const featureGeoCentroid = geoCentroid(
            features.filter((f) => f.properties.name === "Colombia")[0]
          );
          const iv = Versor.interpolateAngles(projRef.current.rotate(), [
            -featureGeoCentroid[0],
            -featureGeoCentroid[1],
          ]);

          const i = interpolateNumber(
            projRef.current.scale(),
            geoOrthographic()
              .fitExtent(
                [
                  [5, 5],
                  [width - 5, height - 5],
                ],
                features.filter((f) => f.properties.name === "Colombia")[0]
              )
              .scale()
          );

          transition()
            .duration(1000)
            .tween("rotate", () => (t) => {
              projRef.current.rotate(iv(t));
              projRef.current.scale(i(t));
              render();
            });
          console.log("after");
          console.log(projRef.current.scale());
          console.log(projRef.current.scale());
        }}
      >
        %
      </button>
    </div>
  );
}
