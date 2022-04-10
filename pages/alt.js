import React, { useState, useEffect, useRef } from "react";
import { drag } from "d3-drag";
import { zoom } from "d3-zoom";
import { feature } from "topojson-client";
import { event, select } from "d3-selection";
import { geoOrthographic, geoPath } from "d3-geo";
import { timer } from "d3-timer";

export default function Home() {
  const width = 500;
  const height = 500;
  const sens = 75;
  const inputRef = useRef();
  let projection = geoOrthographic()
    .scale(250)
    .center([0, 0])
    .rotate([0, -30])
    .translate([width / 2, height / 2]);
  const [features, setFeatures] = useState([]);
  const [newPath, setNewPath] = useState(geoPath().projection(projection));
  const [paths, setPaths] = useState(
    features.map((feature) => geoPath().projection(projection)(feature))
  );
  let path = geoPath().projection(projection);
  // const [svg, setSVG] = useState(null);

  const initialScale = projection.scale();
  let r = initialScale;

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

  useEffect(() => {
    setPaths(
      features.map((feature) => geoPath().projection(projection)(feature))
    );
  }, [projection]);

  // only runs once.
  useEffect(() => {
    fetchFeatures();
    select(inputRef.current)
      .call(
        drag().on("drag", (e, d) => {
          const rotate = projection.rotate();
          const k = sens / projection.scale();
          projection.rotate([rotate[0] + e.dx * k, rotate[1] - e.dy * k]);
          path = geoPath().projection(projection);
          setNewPath(geoPath().projection(projection));
          // select(inputRef.current).selectAll("path").attr("d", path);
        })
      )
      .call(
        zoom().on("zoom", (e, d) => {
          if (e.transform.k > 0.3) {
            projection.scale(initialScale * e.transform.k);
            r = projection.scale();
          } else {
            e.transform.k = 0.3;
          }
        })
      );
  }, []);
  return (
    <div>
      <svg id="cow" width={width} height={height} ref={inputRef}>
        <circle
          fill="#EEE"
          stroke="000"
          strokeWidth="0.2"
          cx={width / 2}
          cy={height / 2}
          r={r}
        />
        <g className="countries">
          {/* {console.log(path)} */}
          {features.map((f, i) => (
            <path
              d={paths[i]}
              fill="white"
              stroke="black"
              strokeWidth="0.3"
              opacity="0.8"
              key={f.id}
              onDrag={(e) => {}}
            />
          ))}
        </g>
      </svg>
      <button onClick={() => console.log(path)}></button>
    </div>
  );
}
