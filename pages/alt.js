import React, { useState, useEffect, useRef } from "react";
import { drag } from "d3-drag";
import { zoom, zoomIdentity } from "d3-zoom";
import { feature } from "topojson-client";
import { event, select } from "d3-selection";
import {
  geoOrthographic,
  geoPath,
  geoBounds,
  geoCentroid,
  geogra,
  geoGraticule,
} from "d3-geo";
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
  const [path, setPath] = useState(() => geoPath().projection(projection));
  const [scale, setScale] = useState(projection.scale());

  const graticule = geoGraticule();

  // let graticule = geoGraticule();

  // console.log("HELLO", graticule());

  // function addBoundingBox(event, d) {
  //   const bounds = path.bounds(d);
  //   svg
  //     .append("rect")
  //     .attr("class", "bbox")
  //     .attr("x", bounds[0][0])
  //     .attr("y", bounds[0][1])
  //     .attr("width", bounds[1][0] - bounds[0][0])
  //     .attr("height", bounds[1][1] - bounds[0][1]);
  // }
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

  const bBox = () =>
    features.length && (
      <path
        fill="none"
        stroke="red"
        strokeWidth="1"
        opacity="0.8"
        strokeDasharray="5 5"
        d={path(
          graticule
            .extentMajor(
              geoBounds(
                features.filter((f) => f.properties.name === "Colombia")[0]
              )
            )
            .outline()
        )}
      />
    );

  // only runs once.
  useEffect(() => {
    fetchFeatures();
    select(inputRef.current)
      .call(
        drag().on("drag", (e, d) => {
          const rotate = projection.rotate();
          const k = sens / projection.scale();
          projection.rotate([rotate[0] + e.dx * k, rotate[1] - e.dy * k]);
          setPath(() => geoPath().projection(projection));
        })
      )
      .call(
        zoom().on("zoom", (e, d) => {
          if (e.transform.k > 0.3) {
            projection.scale(scale * e.transform.k);
            setPath(() => geoPath().projection(projection));
            setScale(projection.scale());
          } else {
            e.transform.k = 0.3;
          }
        })
      );

    //optional globe spin
    timer(function (elapsed) {
      const rotate = projection.rotate();
      const k = sens / projection.scale();
      projection.rotate([rotate[0] - 1 * k, rotate[1]]);
      setPath(() => geoPath().projection(projection));
    }, 200);
  }, []);

  return (
    <div className="wrapper">
      <svg id="cow" width={width} height={height} ref={inputRef}>
        <circle
          fill="#d3d3d3"
          stroke="000"
          strokeWidth="0.2"
          cx={width / 2}
          cy={height / 2}
          r={scale}
        />
        <g className="countries">
          {features.map((f) => (
            <path
              d={path(f)}
              fill="white"
              stroke="black"
              strokeWidth="0.3"
              opacity="0.8"
              key={f.name}
            />
          ))}
        </g>
        <g>
          <path
            d={path(geoGraticule())}
            fill="none"
            stroke="black"
            strokeWidth="0.3"
            opacity="0.8"
          />
          {bBox()}
          {/* {features.length && (
            <path
              fill="none"
              stroke="red"
              strokeWidth="1"
              opacity="0.8"
              strokeDasharray="5 5"
              d={path(graticule.extentMajor(geoBounds(features[5])).outline())}
            />
          )}
          {console.log(
            geoGraticule().extentMajor(geoBounds(features[5])).outline()
          )}
          {console.log("a", path)}
          {console.log("b", geoGraticule())}
          {console.log("c", geoGraticule().extentMajor())}
          {console.log("d", graticule.extentMajor(geoBounds(features[5])))}
          {console.log(
            "e",
            JSON.stringify(
              graticule.extentMajor(geoBounds(features[5])).outline()
            )
          )}
          {console.log("f", geoBounds(features[5]))}
          {console.log("g", features)}
          {console.log(
            "h",
            path(graticule.extentMajor(geoBounds(features[5])).outline()).catch(
              (e) => console.log(e)
            )
          )} */}
        </g>
      </svg>
    </div>
  );
}
