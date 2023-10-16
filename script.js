// Define SVG dimensions
var width = 1400,
    height = 960;

// Define projection and path generator
var projection = d3.geoMercator()
    .center([-100, 40]) // Centered around North America (longitude, latitude)
    // .scale((width + 1) / 2 / Math.PI)
    // .translate([width / 2, height / 2])
    .scale(500) // Adjust the scale as needed
    .translate([width / 2, height / 2])
    .precision(0.1);

var path = d3.geoPath().projection(projection);
var graticule = d3.geoGraticule10();

// Create SVG element
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "bg");

// Load and process TopoJson and GeoJSON data
Promise.all([d3.json("data/land-110m.json"), d3.json("data/merged_locations_extended.geojson")])
    .then(ready)
    .catch((error) => console.error("Error loading data: ", error));

function ready([world, geojson]) {
    addGraticules();
    renderBaseMap([world, geojson]);
    // addBoundaries(world);
    addMarkers(geojson);
}

function renderBaseMap([world, geojson]) {
    svg.append("path")
        .datum(topojson.feature(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path);
}

function addGraticules() {
    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);
}

function addBoundaries(world) {
    // Extract country features from TopoJSON
    var countries = topojson.feature(world, world.objects.countries).features;

    // Bind the features to path elements and render them
    svg.selectAll(".country")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path);
}

function addMarkers(geojson) {
    geojson.features.forEach(function (country) {
        // Get the coordinates of the country
        var coords = projection([
            +country.geometry.coordinates[0],
            +country.geometry.coordinates[1]
        ]);
        var x = coords[0];
        var y = coords[1];

        // Add random variations to the coordinates
        var xOffset = Math.random() * 15; // Adjust the range as needed
        var yOffset = Math.random() * 15; // Adjust the range as needed
        x += xOffset;
        y += yOffset;

        // Create a group for the marker and text
        var group = svg.append("g")
                       .attr("transform", "translate(" + x + "," + y + ")")
                       .datum(country); // Bind the data to the group here

        // Add tooltip
        var tooltip = d3.select("#tooltip");

        group.on("mouseover", function(event, d) {
            tooltip.style("display", "inline-block")
                .html("Loc: " + country.properties.countryCode +
                 "<br>Year: " + country.properties.Year + 
                 "<br>Title: " + country.properties.name +
                 "<br>Abs: " + country.properties.abstract
                )
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", function(event, d) {
            tooltip.style("display", "none");
        });

        // Append the custom marker (arrow-like shape) to the group
        group.append("path")
             .attr("class", "marker")
             .attr("d", "M0,0l-8.8-17.7C-12.1-24.3-7.4-32,0-32h0c7.4,0,12.1,7.7,8.8,14.3L0,0z")
             .attr("transform", "scale(0)")
             .transition()
             .delay(400)
             .duration(800)
             .attr("transform", "scale(.75)");

        // Append the country code text to the group
        var cc = country.properties.countryCode;
        group.append("text")
             .attr("dx", ".5em")
             .attr("dy", ".35em")
             .text(cc)
             .attr("class", "cc");
    });
}
