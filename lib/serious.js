// import React, { useState, useEffect, useRef } from "react";

// import { feature } from "topojson-client";

// const d3 = await Promise.all([
//   import("d3-drag"),
//   import("d3-zoom"),
//   import("d3-selection"),
//   import("d3-transition"),
//   import("d3-format"),
//   import("d3-geo-scale-bar"),
//   import("d3-geo"),
//   import("d3-array"),
//   import("d3-timer"),
//   import("d3-geo"),
//   import("d3-interpolate"),
//   import("d3-tile"),
// ]).then((d3) => Object.assign({}, ...d3));

// // #### EVERYTHING IN THE FUNCTION IS RERUN EXPECT HOOKS ####

// export default function Home() {
//   // #### REFERENCES ####
//   const projRef = useRef(d3.geoMercator());

//   // #### HOOKS ####
//   const [features, setFeatures] = useState([]);
//   const [path, setPath] = useState(() =>
//     d3.geoPath().projection(projRef.current)
//   );

//   const tile = d3
//     .tile()
//     .size([700, 700])
//     .scale(projRef.current.scale() * 2 * Math.PI)
//     .translate(projRef.current([0, 0]));

//   const fetchFeatures = async () => {
//     await fetch("/countries-110m.json")
//       .then((res) => res.json())
//       .then((d) => {
//         setFeatures(feature(d, d.objects.countries).features);
//       });
//   };

//   projRef.current.fitSize(
//     [700, 700],
//     features.filter((f) => f.properties.name === "Colombia")[0]
//   );

//   // runs on every re0

//   const url = (x, y, z) =>
//     `https://${
//       "abc"[Math.abs(x + y) % 3]
//     }.tiles.mapbox.com/v4/mapbox.natural-earth-2/${z}/${x}/${y}${""}.png?access_token=pk.eyJ1IjoibG9mc2lnbWEiLCJhIjoiY2wxMTZuN3k0MDA2ejNkbGExeDBwN3I5dyJ9.04dvALaxo1Op_S8XCpKOPw`;

//   // ##### RUN ONCE #####
//   useEffect(() => {
//     // Fetch Features from file.
//     fetchFeatures();
//   }, []);
//   return (
//     <div className="wrapper">
//       <h1>hello</h1>
//       <svg heigth="700" width="700" viewBox="0,0,700,700">
//         {/* COLOMBIA */}
//         <defs>
//           <path
//             id="colombia"
//             d={path(
//               features.filter((f) => f.properties.name === "Colombia")[0]
//             )}
//           />
//           <clipPath id="clip">
//             <use href="#colombia" />
//           </clipPath>
//         </defs>
//         <g clipPath="url(#clip)">
//           {tile().map(([x, y, z], i, { translate: [tx, ty], scale: k }) => (
//             <image
//               xlinkHref={url(x, y, z)}
//               x={(x + tx) * k - 0.5}
//               y={(y + ty) * k - 0.5}
//               width={k + 1}
//               height={k + 1}
//             />
//           ))}
//           {tile().map(([x, y, z], i, { translate: [tx, ty], scale: k }) => (
//             <image
//               xlinkHref={url(x, y, z)}
//               x={(x + tx) * k}
//               y={(y + ty) * k}
//               width={k}
//               height={k}
//             />
//           ))}
//         </g>
//         <use
//           href="#colombia"
//           fill="none"
//           stroke="black"
//           strokeWidth="0.5"
//           d={path(features.filter((f) => f.properties.name === "Colombia")[0])}
//         />
//       </svg>
//     </div>
//   );
// }
