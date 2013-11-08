flot-tooltip
============

Tooltip plugin for flot, inluding shared tooltips, positioning and smooth animations.

Default Config
--------------
	tooltip: {
		enabled: true,							// true|false
		shared:  true,							// if true, tooltip will display all y values for the selected x
		element: {
			id: '',								// id of the tooltip (this is set per graph)
			classes: ['flot-tooltip'],			// class of the tooltip
			position: 'point', 					// where the tooltip will appear. options: point|fixed
			attach: ['bottom', 'right'], 		// where the tooptip will be attached to. options: [ center|top|bottom, center|left|right ]
		},
		animate: false,							// if true, try and animate (TODO: This is buggy)
		offset: {								// offset that will be applied to each tooltip
			x: 20,
			y: 20
		},
		
		// function to format the tooltip. Arguments are and array of objects containing 'series' and 'ponint' data
		formatTooltip: function( dataPoints ){	
			var content = [];
			for( var i=0 ; i<dataPoints.length ; i++ ){
				content.push("<span style='color:" + dataPoints[i].series.color + ";'>" + dataPoints[i].series.label + "</span>: " + dataPoints[i].point[1]);
			}
			return content.join('<br/>'); 
		},
		
		// function to modify the positioning. position has properties 'top', 'left', 'bottom' and 'right'
		positionTooltip: function( position ){ },
		
		// events
		events: {
			// function to call on hover
			hover: function(flotItem, $tooltipEl) {} 
		}
		
	}
	
	
Examples
--------
See the [example](example/) folder.
