import React, { useState, useEffect, useRef } from "react";
import { drag } from "d3-drag";
import { zoom } from "d3-zoom";
import { feature } from "topojson-client";
import { event, select } from "d3-selection";
import { geoOrthographic, geoPath } from "d3-geo";
import { timer } from "d3-timer";

export default function Home() {
  const [features, setFeatures] = useState([]);
  const [path, setPath] = useState(() => {});
  // const [svg, setSVG] = useState(null);
  const width = 500;
  const height = 500;
  const sens = 75;
  const inputRef = useRef();

  let projection = geoOrthographic()
    .scale(250)
    .center([0, 0])
    .rotate([0, -30])
    .translate([width / 2, height / 2]);

  const initialScale = projection.scale();
  let r = initialScale;

  const getFeatures = () => {
    fetch("/countries-110m.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((d) => {
        setFeatures(feature(d, d.objects.countries).features);
        setPath(
          geoPath().projection(
            geoOrthographic()
              .scale(250)
              .center([0, 0])
              .rotate([0, -30])
              .translate([500 / 2, 500 / 2])
          )
        );
        // setPaths(features.map((feature) => path(feature)));
        // console.log(paths);
      });
  };

  useEffect(() => {
    // sets features.
    // console.log(
    //   geoPath().projection(
    //     geoOrthographic()
    //       .scale(250)
    //       .center([0, 0])
    //       .rotate([0, -30])
    //       .translate([500 / 2, 500 / 2])
    //   )
    // );

    // asynchronously sets features.
    getFeatures();
    // Calling select on the svg element.
    // select(inputRef.current)
    //   .call(
    //     drag().on("drag", (e, d) => {
    //       const rotate = projection.rotate();
    //       const k = sens / projection.scale();
    //       projection.rotate([rotate[0] + e.dx * k, rotate[1] - e.dy * k]);
    //       path = geoPath().projection(projection);
    //       // change paths.
    //       // setPaths(path(features));
    //       // select(inputRef.current).selectAll("path").attr("d", path);
    //     })
    //   )
    //   .call(
    //     zoom().on("zoom", (e, d) => {
    //       if (e.transform.k > 0.3) {
    //         projection.scale(initialScale * e.transform.k);
    //         path = geoPath().projection(projection);
    //         // select(inputRef.current).selectAll("path").attr("d", path);
    //         // features.map();
    //         r = projection.scale();
    //       } else {
    //         e.transform.k = 0.3;
    //       }
    //     })
    //   );

    timer((elapsed) => {
      const rotate = projection.rotate();
      const k = sens / projection.scale();
      projection.rotate([rotate[0] - 1 * k, rotate[1]]);
      setPath(geoPath().projection(projection));
      // svg.selectAll("path").attr("d", path);
    }, 200);
  });
  return (
    <div>
      <svg
        id="cow"
        width={width}
        height={height}
        ref={inputRef}
        // onDrag={(e) => {
        // const rotate = projection.rotate();
        // const k = sens / projection.scale();
        // projection.rotate([rotate[0] + e.dx * k, rotate[1] - e.dy * k]);
        // console.log(e.dx, e.dy);
        // }}
      >
        <circle
          fill="#EEE"
          stroke="000"
          strokeWidth="0.2"
          cx={width / 2}
          cy={height / 2}
          r={r}
        />
        <g className="countries">
          {/* {features.map((f) => (
            <path
              d={path(f)}
              fill="white"
              stroke="black"
              strokeWidth="0.3"
              opacity="0.8"
              key={f.id}
              onDrag={(e) => {}}
            />
          ))} */}
        </g>
      </svg>
      <button onClick={() => console.log(path)}></button>
    </div>
  );
}
