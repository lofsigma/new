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

export default function Home() {
  const width = 700;
  const height = 700;
  const sens = 75;

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
  const graticule = geoGraticule();

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

  const zoom3 = zoom()
    .scaleExtent([0.8, 8].map((x) => x * projRef.current.scale()))
    .on("start", (event) => {
      v0 = versor.cartesian(projRef.current.invert(point(event, this)));
      q0 = versor((r0 = projRef.current.rotate()));
    })
    .on("zoom", (event) => {
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
    });

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

    const zoomstarted = (event) => {
      v0 = versor.cartesian(projection.invert(point(event, this)));
      q0 = versor((r0 = projection.rotate()));
    };

    const zoomed = (event) => {
      projection.scale(event.transform.k);
      const pt = point(event, this);
      const v1 = versor.cartesian(projection.rotate(r0).invert(pt));
      const delta = versor.delta(v0, v1);
      let q1 = versor.multiply(q0, delta);

      // For multitouch, compose with a rotation around the axis.
      if (pt[2]) {
        const d = (pt[2] - a0) / 2;
        const s = -Math.sin(d);
        const c = Math.sign(Math.cos(d));
        q1 = versor.multiply([Math.sqrt(1 - s * s), 0, 0, c * s], q1);
      }

      projection.rotate(versor.rotation(q1));

      // In vicinity of the antipode (unstable) of q0, restart.
      if (delta[0] < 0.7) zoomstarted.call(this, event);
    };

    const zoomBehavior = (
      projection,
      {
        // Capture the projection???s original scale, before any zooming.
        scale = projection._scale === undefined
          ? (projection._scale = projection.scale())
          : projection._scale,
        scaleExtent = [0.8, 8],
      } = {}
    ) => {
      let v0, q0, r0, a0, tl;

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
        ????
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
            ss = Math.max(
              1,
              0.9 / Math.max(dx / dimensions.width, dy / height)
            );

          // smoothly reset scale.
          select(inputRef.current)
            .transition()
            .duration(750)
            .call(zoom3.transform, zoomIdentity.scale(ss));
          // .call(scaleTo, ss)
        }}
      >
        ????
      </button>
    </div>
  );
}
