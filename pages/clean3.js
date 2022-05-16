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
import { Delaunay } from "d3-delaunay";
import {
  geoOrthographic,
  geoPath,
  geoBounds,
  geoCentroid,
  geoInterpolate,
  geoGraticule,
} from "d3-geo";

import Versor from "../lib/Versor";
import versor from "../lib/oldVersor";

export default function Home() {
  const width = 700;
  const height = 700;

  const canvasRef = useRef();
  const projRef = useRef(
    geoOrthographic()
      .scale(250)
      .center([0, 0])
      .rotate([0, -30])
      .translate([width / 2, height / 2])
  );

  const [features, setFeatures] = useState({});
  const [path, setPath] = useState(null);

  const fetchFeatures = () => {
    fetch("/countries-110m.json")
      .then((res) => res.json())
      .then((d) => {
        setFeatures({
          type: "FeatureCollection",
          features: feature(d, d.objects.countries).features,
        });
      });
  };

  const render = (land) => {
    // console.log(path(land));
    console.log("chick", path.context());
    canvasRef.current.getContext("2d").clearRect(0, 0, width, height);
    canvasRef.current.getContext("2d").beginPath(),
      path(land),
      (canvasRef.current.getContext("2d").fillStyle = "#000"),
      canvasRef.current.getContext("2d").fill();
  };

  // RUNS ONCE
  useEffect(() => {
    fetchFeatures();

    setPath(() =>
      geoPath()
        .projection(projRef.current)
        .context(canvasRef.current.getContext("2d"))
    );
  }, []);

  let v0, q0, r0;

  useEffect(() => {
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

    select(canvasRef.current).call(
      dragBehavior(projRef.current).on("drag.render", () => render(features))
    );
  }, [features]);

  return (
    <div className="wrapper">
      <canvas ref={canvasRef} height="1152" width="1152"></canvas>
    </div>
  );
}
