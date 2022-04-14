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
import { timer } from "d3-timer";

const acos = Math.acos,
  asin = Math.asin,
  atan2 = Math.atan2,
  cos = Math.cos,
  hypot = Math.hypot,
  max = Math.max,
  min = Math.min,
  PI = Math.PI,
  sin = Math.sin,
  radians = PI / 180,
  degrees = 180 / PI;

class Versor {
  static fromCartesian([x, y, z]) {
    return [0, z, -y, x];
  }
  static fromAngles([l, p, g]) {
    l *= radians / 2;
    p *= radians / 2;
    g = ((g || 0) * radians) / 2;
    const sl = sin(l),
      cl = cos(l);
    const sp = sin(p),
      cp = cos(p);
    const sg = sin(g),
      cg = cos(g);
    return [
      cl * cp * cg + sl * sp * sg,
      sl * cp * cg - cl * sp * sg,
      cl * sp * cg + sl * cp * sg,
      cl * cp * sg - sl * sp * cg,
    ];
  }
  static toAngles([a, b, c, d]) {
    return [
      atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * degrees,
      asin(max(-1, min(1, 2 * (a * c - d * b)))) * degrees,
      atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * degrees,
    ];
  }
  static interpolateAngles(a, b) {
    const i = Versor.interpolate(Versor.fromAngles(a), Versor.fromAngles(b));
    return (t) => Versor.toAngles(i(t));
  }
  static interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    (a2 -= a1), (b2 -= b1), (c2 -= c1), (d2 -= d1);
    const x = new Array(4);
    return (t) => {
      const l = hypot(
        (x[0] = a1 + a2 * t),
        (x[1] = b1 + b2 * t),
        (x[2] = c1 + c2 * t),
        (x[3] = d1 + d2 * t)
      );
      (x[0] /= l), (x[1] /= l), (x[2] /= l), (x[3] /= l);
      return x;
    };
  }
  static interpolate([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    let dot = Versor.dot([a1, b1, c1, d1], [a2, b2, c2, d2]);
    if (dot < 0) (a2 = -a2), (b2 = -b2), (c2 = -c2), (d2 = -d2), (dot = -dot);
    if (dot > 0.9995)
      return Versor.interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]);
    const theta0 = acos(max(-1, min(1, dot)));
    const x = new Array(4);
    const l = hypot(
      (a2 -= a1 * dot),
      (b2 -= b1 * dot),
      (c2 -= c1 * dot),
      (d2 -= d1 * dot)
    );
    (a2 /= l), (b2 /= l), (c2 /= l), (d2 /= l);
    return (t) => {
      const theta = theta0 * t;
      const s = sin(theta);
      const c = cos(theta);
      x[0] = a1 * c + a2 * s;
      x[1] = b1 * c + b2 * s;
      x[2] = c1 * c + c2 * s;
      x[3] = d1 * c + d2 * s;
      return x;
    };
  }
  static dot([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    return a1 * a2 + b1 * b2 + c1 * c2 + d1 * d2;
  }
  static multiply([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    return [
      a1 * a2 - b1 * b2 - c1 * c2 - d1 * d2,
      a1 * b2 + b1 * a2 + c1 * d2 - d1 * c2,
      a1 * c2 - b1 * d2 + c1 * a2 + d1 * b2,
      a1 * d2 + b1 * c2 - c1 * b2 + d1 * a2,
    ];
  }
}

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

  let pth = geoPath().projection(projRef);

  const projection = geoOrthographic()
    .scale(250)
    .center([0, 0])
    .rotate([0, -30])
    .translate([width / 2, height / 2]);

  const [features, setFeatures] = useState([]);
  const [path, setPath] = useState(() => geoPath().projection(projRef));
  const [scale, setScale] = useState(projection.scale());
  const [angles, setAngles] = useState(projection.rotate());
  const graticule = geoGraticule();

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

  // p1 = d3.geoCentroid(country);
  // r1 = [(-p2[0], 20 - p2[1], 0)];
  // returns an interpolation function that goes from 0 to 1.
  // const ip = d3.geoInterpolate(p1, p2);

  // const iv = Versor.interpolateAngles(r1, r2);
  // projection.rotate(iv(t));

  // only runs once.
  const dragBehavior = (e, d) => {
    projRef.rotate();
    const k = sens / projRef.scale();
    const rotation = [
      projRef.rotate()[0] + e.dx * k,
      projRef.rotate()[1] - e.dy * k,
    ];
    projRef.rotate(rotation);
    setPath(() => geoPath().projection(projRef));
  };

  const getCurrentAngles = () => {
    console.log(angles);
  };

  useEffect(() => {
    fetchFeatures();
    select(inputRef.current)
      .call(drag().on("drag", dragBehavior))
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

    // //optional globe spin
    // timer(function (elapsed) {
    //   const rotate = projection.rotate();
    //   const k = sens / projection.scale();
    //   projection.rotate([rotate[0] - 1 * k, rotate[1]]);
    //   setPath(() => geoPath().projection(projection));
    // }, 200);
  }, []);

  useEffect(() => {
    let pth = geoPath().projection(projRef);
  }, [projRef.current]);

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
              d={pth(f)}
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
            d={pth(graticule())}
            fill="none"
            stroke="black"
            strokeWidth="0.3"
            opacity="0.8"
          />
          {bBox()}
        </g>
        <path
          fill="none"
          stroke="blue"
          strokeWidth="1"
          opacity="0.8"
          d={path({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [geoCentroid(features[1]), geoCentroid(features[2])],
            },
          })}
        />
      </svg>
      <button
        onClick={() => {
          const iv = Versor.interpolateAngles(angles, [
            -geoCentroid(
              features.filter((f) => f.properties.name === "Colombia")[0]
            )[0],
            10 -
              geoCentroid(
                features.filter((f) => f.properties.name === "Colombia")[0]
              )[1],
            0,
          ]);
          transition()
            .duration(1000)
            .tween("rot", () => (t) => {
              projection.rotate(iv(t));
              console.log("t", iv(t));
              setPath(() => geoPath().projection(projection));
            });
          setAngles(iv(1));
        }}
      >
        flower
        {/* {console.log(interpolateAngles)} */}
      </button>
      <button onClick={getCurrentAngles}>current Angle</button>
      <button
        onClick={() => {
          console.log("before", projection.scale());
          var bounds = path.bounds(
              features.filter((f) => f.properties.name === "Colombia")[0]
            ),
            dx = bounds[1][0] - bounds[0][0],
            dy = bounds[1][1] - bounds[0][1],
            x = (bounds[0][0] + bounds[1][0]) / 2,
            y = (bounds[0][1] + bounds[1][1]) / 2;
          projection.scale(300);
          setScale(300);
          setPath(() => geoPath().projection(projection));
          console.log("after", projection.scale());
        }}
      >
        something
      </button>
      <button
        onClick={() => {
          projection.center(
            geoCentroid(
              features.filter((f) => f.properties.name === "Colombia")[0]
            )
          );
          // projection.fitExtent(
          //   [
          //     [20, 20],
          //     [480, 480],
          //   ],
          //   features.filter((f) => f.properties.name === "Colombia")[0]
          // );
          setPath(() => geoPath().projection(projection));
          // setScale(projection.scale());
        }}
      >
        hey!
      </button>
    </div>
  );
}
