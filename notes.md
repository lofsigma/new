invert([x,y]) -> [lon, lat]

- returns unprojected points.

projection([lon, lat]) -> [x,y]

-returns projected points.

fitExtent([[x₀, y₀], [x₁, y₁]], object)

- sets projection's _scale_ and _translate_ to fit object in the center of extent.
