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

  let zoomBehavior = zoom()
    .scaleExtent([1, 10])
    .on("zoom", (e, d) => {
      if (e.transform.k > 0.3) {
        projRef.current.scale(scale * e.transform.k);
        setPath(() => geoPath().projection(projRef.current));
        setScale(projRef.current.scale());

        //   g.attr("transform", t);

        // Pass the k property of the zoom's transform
        // to the scale bar's scaleFactor.
        // Then call the scaleBar again.
        select(document.getElementById("scale-bar-wrapper")).attr(
          "transform",
          e.transform
        );
        scaleBarGenerator.zoomFactor(e.transform.k);
        select(document.getElementById("scale-bar-wrapper")).call(
          scaleBarGenerator
        );
      } else {
        e.transform.k = 0.3;
      }
    });

  // scale bar generator
  const scaleBarGenerator = geoScaleBar()
    .zoomClamp(true) // Set this to true to keep the bar's width constant
    .projection(projRef.current)
    .size([width, height])
    .left(0.05)
    .top(0.85)
    .tickFormat((d) => format(",")(+d.toFixed(1)));

  const fetchFeatures = () => {
    fetch("/countries-110m.json")
      .then((res) => res.json())
      .then((d) => {
        setFeatures(feature(d, d.objects.countries).features);
      });
  };

  useEffect(() => {
    // Fetch features from JSON file.
    fetchFeatures();

    select(document.getElementById("scale-bar-wrapper")).call(
      scaleBarGenerator
    );

    // select the SVG DOM element.
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
        zoom()
          .scaleExtent([1, 10])
          .translateExtent([
            [0, 0],
            [width, height],
          ])
          .on("zoom", (e, d) => {
            if (e.transform.k > 0.3) {
              projRef.current.scale(scale * e.transform.k);
              setPath(() => geoPath().projection(projRef.current));
              setScale(projRef.current.scale());

              //   scaleBarGenerator.zoomFactor(e.transform.k);
              //   select(document.getElementById("scale-bar-wrapper")).call(
              //     scaleBarGenerator
              //   );
              select(document.getElementById("scale-bar-wrapper")).attr(
                "transform",
                e.transform
              );
              scaleBarGenerator.zoomFactor(e.transform.k);
              select(document.getElementById("scale-bar-wrapper")).call(
                scaleBarGenerator
              );
            } else {
              e.transform.k = 0.3;
            }
          })
      );
    //   .call(
    //     zoom().on("zoom", (e) => {
    //       const t = e.transform;

    //       select(document.getElementById("scale-bar-wrapper")).attr(
    //         "transform",
    //         t
    //       );

    //       // Pass the k property of the zoom's transform
    //       // to the scale bar's scaleFactor.
    //       // Then call the scaleBar again.
    //       scaleBarGenerator.zoomFactor(e.transform.k);
    //       select(document.getElementById("scale-bar-wrapper")).call(
    //         scaleBarGenerator
    //       );
    //     })
    //   );
  }, []);

  return (
    <div className="wrapper">
      <svg width={width} height={height} ref={inputRef}>
        <circle
          fill="#d3d3d3"
          stroke="000"
          strokeWidth="0.2"
          cx={width / 2}
          cy={height / 2}
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
                // toggle active class.
                f.properties.name === active
                  ? setActive(null)
                  : setActive(f.properties.name);
              }}
            />
          ))}
        </g>
        <g id="scale-bar-wrapper"></g>
      </svg>
      <button
        onClick={() => {
          const featureGeoCentroid = geoCentroid(
            features.filter((f) => f.properties.name === "Colombia")[0]
          );
          const iv = Versor.interpolateAngles(projRef.current.rotate(), [
            -featureGeoCentroid[0],
            -featureGeoCentroid[1],
          ]);
          transition()
            .duration(750)
            .tween("rotate", () => (t) => {
              projRef.current.rotate(iv(t));
              setPath(() => geoPath().projection(projRef.current));
            });
        }}
      >
        🌸
      </button>
      <button
        onClick={() => {
          const featureGeoCentroid = geoCentroid(
            features.filter((f) => f.properties.name === "Colombia")[0]
          );
          const iv = Versor.interpolateAngles(projRef.current.rotate(), [
            -featureGeoCentroid[0],
            -featureGeoCentroid[1],
          ]);
          transition()
            .duration(750)
            .tween("rotation", () => (t) => {
              projRef.current.rotate(iv(t));
              setPath(() => geoPath().projection(projRef.current));
            });
          // zoom
          var bounds = path.bounds(
              features.filter((f) => f.properties.name === "Colombia")[0]
            ),
            dx = bounds[1][0] - bounds[0][0],
            dy = bounds[1][1] - bounds[0][1],
            ss = Math.max(1, 0.9 / Math.max(dx / width, dy / height));

          // smoothly reset scale.
          select(inputRef.current)
            .transition()
            .duration(750)
            .call(zoomBehavior.transform, zoomIdentity.scale(ss));
        }}
      >
        🌈
      </button>
    </div>
  );
}
