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
// import geoZoom from "d3-geo-zoom";
// import d3GeoZoom from "d3-geo-zoom";
// import versor from "versor";
import {
  geoOrthographic,
  geoAzimuthalEqualArea,
  geoPath,
  geoBounds,
  geoCentroid,
  geoInterpolate,
  geoGraticule,
} from "d3-geo";

import Versor from "../lib/Versor";
import versor from "../lib/oldVersor";

function debounce(fn, ms) {
  let timer;
  return (_) => {
    clearTimeout(timer);
    timer = setTimeout((_) => {
      timer = null;
      fn.apply(this, arguments);
    }, ms);
  };
}

const interpolator = () => {};

export default function Home() {
  const width = 700;
  const height = 700;

  const [dimensions, setDimensions] = useState({
    height: 0,
    width: 0,
  });

  const ref = useRef();
  const inputRef = useRef();
  const projRef = useRef(
    geoOrthographic()
      .scale(250)
      .center([0, 0])
      .rotate([0, -30])
      .translate([width / 2, height / 2])
  );
  // let drag = (proj) => {};

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
    const debouncedHandleResize = debounce(function handleResize() {
      setDimensions({
        height: window.innerHeight,
        width: inputRef.current.width.baseVal.value,
      });
      // projRef.current.translate([
      //   inputRef.current.width.baseVal.value / 2,
      //   height / 2,
      // ]);
      // setPath(() => geoPath().projection(projRef.current));
    }, 1000);

    window.addEventListener("resize", debouncedHandleResize);
    return (_) => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  });

  // let v0, q0, r0;

  let v0, q0, r0, a0, tl;

  const point = (event, that) => {
    const t = pointers(event, that);

    if (t.length !== tl) {
      tl = t.length;
      if (tl > 1) a0 = Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]);
      zoomstarted.call(that, event);
    }

    return tl > 1
      ? [
          d3.mean(t, (p) => p[0]),
          d3.mean(t, (p) => p[1]),
          Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]),
        ]
      : t[0];
  };

  const zoomstarted = (event) => {
    v0 = versor.cartesian(projRef.current.invert(point(event, this)));
    q0 = versor((r0 = projRef.current.rotate()));
  };

  const zoomed = (event) => {
    projRef.current.scale(event.transform.k);
    const pt = point(event, this);
    const v1 = versor.cartesian(projRef.current.rotate(r0).invert(pt));
    const delta = versor.delta(v0, v1);
    let q1 = versor.multiply(q0, delta);

    // For multitouch, compose with a rotation around the axis.
    if (pt[2]) {
      const d = (pt[2] - a0) / 2;
      const s = -Math.sin(d);
      const c = Math.sign(Math.cos(d));
      q1 = versor.multiply([Math.sqrt(1 - s * s), 0, 0, c * s], q1);
    }

    projRef.current.rotate(versor.rotation(q1));

    // In vicinity of the antipode (unstable) of q0, restart.
    if (delta[0] < 0.7) zoomstarted.call(this, event);
  };

  const zoom3 = zoom()
    .scaleExtent([330, 10000])
    .on("start", zoomstarted)
    .on("zoom", zoomed);

  useEffect(() => {
    // Fetch features from JSON file.
    fetchFeatures();

    function dragBehavior(projection) {
      let v0, q0, r0, a0, l;

      function pointer(event, that) {
        const t = pointers(event, that);

        if (t.length !== l) {
          l = t.length;
          if (l > 1) a0 = Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]);
          dragstarted.apply(that, [event, that]);
        }

        // For multitouch, average positions and compute rotation.
        if (l > 1) {
          const x = mean(t, (p) => p[0]);
          const y = mean(t, (p) => p[1]);
          const a = Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]);
          return [x, y, a];
        }

        return t[0];
      }

      function dragstarted(event) {
        v0 = versor.cartesian(projection.invert(pointer(event, this)));
        q0 = versor((r0 = projection.rotate()));
      }

      function dragged(event) {
        const p = pointer(event, this);
        const v1 = versor.cartesian(projection.rotate(r0).invert(p));
        const delta = versor.delta(v0, v1);
        let q1 = versor.multiply(q0, delta);

        // For multitouch, compose with a rotation around the axis.
        if (p[2]) {
          const d = (p[2] - a0) / 2;
          const s = -Math.sin(d);
          const c = Math.sign(Math.cos(d));
          q1 = versor.multiply([Math.sqrt(1 - s * s), 0, 0, c * s], q1);
        }

        projection.rotate(versor.rotation(q1));

        // In vicinity of the antipode (unstable) of q0, restart.
        if (delta[0] < 0.7) dragstarted.apply(this, [event, this]);
      }

      return drag().on("start", dragstarted).on("drag", dragged);
    }

    const zoomBehavior = (projection) => {
      return Object.assign(
        (selection) =>
          selection
            .property("__zoom", zoomIdentity.scale(projection.scale()))
            .call(zoom3),
        {
          on(type, ...options) {
            return options.length
              ? (zoom3.on(type, ...options), this)
              : zoom3.on(type);
          },
        }
      );
    };

    // initializes bar.
    // select(document.getElementById("scale-bar-wrapper")).call(
    //   scaleBarGenerator
    // );

    // select(inputRef.current).call(dragBehavior).call(zoomBehavior);
    select(inputRef.current)
      .call(
        dragBehavior(projRef.current).on("drag.render", () =>
          setPath(() => geoPath().projection(projRef.current))
        )
      )
      .call(
        zoomBehavior(projRef.current).on("zoom.render", () =>
          setPath(() => geoPath().projection(projRef.current))
        )
      );
    // .on("end.render", () => render(land50)));
    // geoZoom()
    //   .projection(projRef.current)
    //   .onMove(({ scale, rotation }) => {
    //     projRef.current.rotate(rotation);
    //     projRef.current.scale(scale);
    //     setPath(() => geoPath().projection(projRef.current));
    //   })(inputRef.current);
    // console.log(d3GeoZoom);
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
          console.log(featureGeoCentroid);
          const iv = Versor.interpolateAngles(projRef.current.rotate(), [
            -featureGeoCentroid[0],
            -featureGeoCentroid[1],
          ]);

          console.log("hey", iv(1));
          transition()
            .duration(750)
            .tween("rotate", () => (t) => {
              projRef.current.rotate(iv(t));
              projRef.current.fitSize(
                [width, height],
                features.filter((f) => f.properties.name === "Colombia")[0]
              );

              projRef.current.translate([655.08 / 2, height / 2]);
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
            ss = Math.max(1, 0.9 / Math.max(dx / 700, dy / height));

          const [[x0, y0], [x1, y1]] = geoBounds(
            features.filter((f) => f.properties.name === "Colombia")[0]
          );

          const [[xp0, yp0], [xp1, yp1]] = path.bounds(
            features.filter((f) => f.properties.name === "Colombia")[0]
          );

          const [[xi0, yi0], [xi1, yi1]] = [
            projRef.current.invert([xi0, yi0]),
            projRef.current.invert([xi1, yi1]),
          ];
          console.log(
            "path boundaries",
            [xi0, yi0],
            [xi1, yi1],
            [
              [xp0, yp0],
              [xp1, yp1],
            ]
          );

          //   console.log(
          //     "ss",
          //     ss,
          //     bounds,
          //     0.9 / Math.max(dx / 700, dy / height),
          //     "alt",
          //     Math.min(8, 0.9 / Math.max((x1 - x0) / 655.08, (y1 - y0) / height))
          //   );

          // smoothly reset scale.
          select(inputRef.current)
            .transition()
            .duration(750)
            .call(
              zoom3.transform,
              zoomIdentity.scale(
                0.9 / Math.max((x1 - x0) / 655.08, (y1 - y0) / height)
              )
            );
          // .call(zoom3.scaleTo, 15);

          setPath(() => geoPath().projection(projRef.current));
        }}
      >
        🌈
      </button>
      <button
        onClick={() => {
          console.log(
            geoOrthographic()
              .scale(250)
              .center([0, 0])
              .rotate([0, -30])
              .translate([width / 2, height / 2])
              .fitSize(
                [width, height],
                features.filter((f) => f.properties.name === "Colombia")[0]
              )
              .scale()
          );

          //   projRef.current.translate([655.08 / 2, height / 2]);
          //   setPath(() => geoPath().projection(projRef.current));
        }}
      >
        hey
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

          const i = interpolateNumber(
            projRef.current.scale(),
            geoOrthographic()
              .scale(250)
              .center([0, 0])
              .rotate([0, -30])
              .translate([width / 2, height / 2])
              .fitExtent(
                [
                  [5, 5],
                  [width - 5, height - 5],
                ],
                features.filter((f) => f.properties.name === "Colombia")[0]
              )
              .scale()
          );

          console.log("from", projRef.current.scale());
          console.log(
            "to",
            geoOrthographic()
              .scale(250)
              .center([0, 0])
              .rotate([0, -30])
              .translate([width / 2, height / 2])
              .fitSize(
                [width, height],
                features.filter((f) => f.properties.name === "Colombia")[0]
              )
              .scale()
          );
          transition()
            .duration(1000)
            .tween("rotate", () => (t) => {
              projRef.current.rotate(iv(t));
              projRef.current.scale(i(t));
              //   projRef.current.fitSize(
              //     [width, height],
              //     features.filter((f) => f.properties.name === "Colombia")[0]
              //   );

              //   projRef.current.translate([655.08 / 2, height / 2]);
              setPath(() => geoPath().projection(projRef.current));
            });
          // .call(

          // );
        }}
      >
        ⚡
      </button>
      <button
        onClick={() => {
          projRef.current.scale(
            geoOrthographic()
              .scale(250)
              .center([0, 0])
              .rotate([0, -30])
              .translate([width / 2, height / 2])
              .fitSize(
                [width, height],
                features.filter((f) => f.properties.name === "Colombia")[0]
              )
              .scale()
          );
          setPath(() => geoPath().projection(projRef.current));
        }}
      >
        3
      </button>
    </div>
  );
}
