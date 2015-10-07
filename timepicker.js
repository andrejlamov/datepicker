function timepicker(id) {

    var margin = {bottom: 10};
    var width = 0;
    var height = 0;
    
    // Disable mobile refresh
    document.ontouchmove = function(e) {e.preventDefault()};

    // Time ranges
    var am = d3.range(0, 12).map(function(d) { return {value: d, type: 'hour'}});
    var pm = d3.range(12, 24).map(function(d) { return {value: d, type: 'hour'}});
    var minutes = d3.range(0, 60, 5).map(function(d) { return {value: d, type: 'minute'}});

    var data = d3.merge([am, pm, minutes]);

    // Time display
    var time = [0,0];

    var text = d3.select(id)
        .append('div')
        .style({
            'width': '100%',
            'height': '1em',
            'background': 'lightGrey',
            'text-align': 'center'
        });

    var format = function(d) {
        var i = parseInt(d);
        if(i < 10) {
            return '0' + (i + '');
        }
        return i;
    }

    var display = function() {
        text.text(format(time[0]) +':'
                  + format(time[1]));
    };

    display();

    // Touch event
    var touch = function(e) {
        if (d3.event.type == 'mousemove' && d3.event.buttons != 1) {
            return;
        }

        // Get elemtent
        var p = d3.mouse(this);
        var elem = document.elementFromPoint(p[0], p[1]);
        var path  = d3.select(elem);

        // If element is within voronoi path
        if(path.classed('tick')){
            var datum = path.datum();
            var point = datum.point;
            var d = datum.d;

            d3.selectAll('.' + d.type)
              .style('fill', 'white')
              .style('opacity', 1);

            var origin = [width/2, height/2];
            var backtip = [Math.round(origin[0] + (origin[0] - point[0])*0.1),
                           Math.round(origin[1] + (origin[1] - point[1])*0.1)];

            if(d.type == 'minute') {
                path.style('opacity', 0.2)
                d3.selectAll('.minute_pointer')
                  .attr("d", pointer_line([backtip, origin, point]));
                time[1] = d.value;
            } else {
                path.style('opacity', 0.2)
                d3.selectAll('.hour_pointer')
                  .attr("d", pointer_line([backtip, origin, point]));
                time[0] = d.value;
            }
            display();
        }
    };

    // Clock
    var svg = d3.select(id)
                .append('svg')
                .on('touchstart', touch)
                .on('touchend', touch)
                .on('touchmove', touch)
                .on('click', touch)
                .on('mousestart', touch)
                .on('mousemove', touch)
                .on('mouseend', touch);

    // Calc coordinates for each tick
    var gen_vertices = function(data, radius, width, height) {
        return data.map(function(d,i) {
            var radian = ((360*(Math.PI/180))/data.length)*i;
            var x = radius * Math.sin(radian);
            var xx = width/2 + x;
            var y = radius * Math.cos(radian) * (-1);
            var yy = height/2 + y;
            return [xx, yy]
        });
    };

    // Voronoi paths
    var voro_path = svg.append("g").selectAll("path");

    var polygon = function(d) {
        var p =  "M" + d.join("L") + "Z";
        return p;
    };

    // Clock pointer
    var pointer_line = d3.svg.line()
                         .x(function(d) { return d[0]; })
                         .y(function(d) { return d[1]; })
                         .interpolate("linear");

    var minute_pointer = svg.append("g")
                            .append('path')
                            .attr('d', pointer_line([[0,0],[0,0]]))
                            .attr('class', 'minute_pointer');

    var hour_pointer = svg.append("g")
                          .append('path')
                          .attr('d', pointer_line([[0,0],[0,0]]))
                          .attr('class', 'hour_pointer');

    // Frame

    var frame = svg.append('circle')
                   .attr('class', 'frame');


    // Main resize
    var resize = function() {
        width = parseInt(d3.select(id).style('width'));
        height = parseInt(d3.select(id).style('height')) - margin.bottom;

        svg.attr({
            'width': width,
            'height': height
        });

        var radius = d3.min([height/2, width/2]);

        var vertices = d3.merge([gen_vertices(pm, radius*0.4, width, height)
                             , gen_vertices(am, radius*0.6, width, height)
                             , gen_vertices(minutes, radius*0.95, width, height)]);

        var voronoi = d3.geom.voronoi();
        var voro_data = voronoi(vertices);

        // Add ref to data
        voro_data.forEach(function(d, i) {
            d['d'] = data[i];
        });

        // Voronoi paths
        voro_path = voro_path
            .data(voro_data, polygon);

        voro_path.exit().remove();

        voro_path.enter()
                 .append("path")
                 .attr("class", function(d, i) {
                     return d.d.type;
                 })
                 .classed('tick', true)
                 .attr("d", polygon);


        // Frame
        frame.attr({
            'cx': width/2,
            'cy': height/2,
            'r': radius
        });
        var number_labels = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
        var number_vert = gen_vertices(number_labels, radius*0.95, width, height)
        var numbers = svg.selectAll(".number")
            .data(number_vert)
        numbers.enter()
            .append("text")
            .text(function(d,i) { return number_labels[i] })
            .attr("class", "number")
        numbers.attr("transform", function(d) { return "translate(" + d + ")"; })

        var number_labels = ["00", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"];
        var number_vert = gen_vertices(number_labels, radius*0.4, width, height)
        var numbers = svg.selectAll(".number_24")
            .data(number_vert)
        numbers.enter()
            .append("text")
            .attr("opacity", 0.5)
            .text(function(d,i) { return number_labels[i] })
            .attr("class", "number_24")
        numbers.attr("transform", function(d) { return "translate(" + d + ")"; })

        

        // Nodes
        // var circle = svg.selectAll('.node')
        //                 .data(voro_data);

        // circle.enter()
        //     .append("text")
        //     .attr('class', 'node')
        //     .text(function(d) { return d.d.value })
        
        // circle.exit().remove();

        // svg.selectAll('.node')
        //    .attr("transform", function(d) { return "translate(" + d.point + ")"; })
        //    .attr("r", 1.5);
    };

    return {
        resize: resize
    }
}
