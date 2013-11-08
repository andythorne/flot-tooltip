/*
 * jquery.flot.tooltip
 * 
 * @author Andy Thorne
 * @url https://github.com/andythorne/flot-tooltip
 */ 
(function ($) {

	// plugin options, default values
	var defaultOptions = {
		tooltip: {
		    enabled: true,                          // true|false
		    shared:  true,                          // if true, tooltip will display all y values for the selected x
		    element: {
		        id: '',                             // id of the tooltip (this is set per graph)
		        classes: ['flot-tooltip'],          // class of the tooltip
		        position: 'point',                  // where the tooltip will appear. options: point|fixed
		        attach: ['bottom', 'right'],        // where the tooptip will be attached to. options: [ center|top|bottom, center|left|right ]
		    },
		    animate: false,                         // if true, try and animate (TODO: This is buggy)
		    offset: {                               // offset that will be applied to each tooltip
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
	};

	// object
	var FlotTooltip = function(plot) {

		// variables
		this.plot = plot;
		this.plotOptions = {};
		this.tooltipOptions = {};
		this.previousPoint = null;
		
		this.tip = null;
		this.tipPosition = {
			top: 'inherit',
			left: 'inherit',
			bottom: 'inherit',
			right: 'inherit',
		};

		this.init(plot);
	};

	// main plugin function
	FlotTooltip.prototype.init = function(plot) {
		
		var that = this;

		plot.hooks.bindEvents.push(function (plot, eventHolder) {

			/* Plot Object */
			that.plot = plot;
			
			/* get plot options */
			that.plotOptions = plot.getOptions();

			/* if not enabled return */
			if (typeof that.plotOptions.tooltip === 'undefined' || that.plotOptions.tooltip.enabled === false) return;

			/* shortcut to access tooltip options */
			that.tooltipOptions = that.plotOptions.tooltip;

			/* create tooltip DOM element */
			that.tip = that.getDomElement();

			/* bind events */
			$( plot.getPlaceholder() ).bind("plothover", plothover);
			$( plot.getPlaceholder() ).bind("mouseleave", hideTooltip);
			$( eventHolder ).bind('mousemove', mouseMove);
            $( eventHolder ).bind("mouseleave", hideTooltip);
 
		});
		
		
		/**
		 * Unbind any events on shutdown
		 */
		plot.hooks.shutdown.push(function (plot, eventHolder){
			$(plot.getPlaceholder()).unbind("plothover", plothover);
			$(plot.getPlaceholder()).unbind("mouseleave", hideTooltip);
            $(eventHolder).unbind("mousemove", mouseMove);
            $(eventHolder).unbind("mouseleave", hideTooltip);
		});
		
		
		/**
		 * function to run when plothover event is triggered
		 */
		function plothover(event, pos, item) {

			/* 
			 * check if we have selected a point, or if the current mouseover target 
			 * is the tooltip, in which case we should ignore it and display the last
			 * selected point. If we didn't do this then the tooltip would flicker 
			 * when we mouseover the tooltip.
			 */
			if (item || (that.tip && event.target == plot.getPlaceholder()[0])) {
				
				if(!item && that.previousPoint !== null){
					that.update( that.previousPoint );
				} else if (that.previousPoint === null || that.previousPoint.dataIndex != item.dataIndex || that.previousPoint.seriesIndex != item.seriesIndex) {
					/* Check if the current point has changed */
					that.previousPoint = item;
					that.update( item );
				}

				/* Run hover callback */
				if(typeof that.tooltipOptions.events.hover === 'function') {
					that.tooltipOptions.events.hover(item, that.tip);
				}

			} else {
				/* If no item is selected, remove the tooltip content */
				that.tip.hide();
			}
		}
		
		function mouseMove(event){
			
			if(that.tip && event.target == event.target == plot.getPlaceholder()[0])
				return;
			that.updatePosition();
			
			/* If we are outside the graph, hide the tooltip */
			var offset = $(this).offset().left - plot.getPlaceholder().offset().left,
				margin = 0
			;
			if(typeof that.plotOptions.grid.margin.left != 'undefined'){
				margin += that.plotOptions.grid.margin.left;
			}
			if(typeof that.plotOptions.grid.margin.right != 'undefined'){
				margin += that.plotOptions.grid.margin.right;
			}
			
			if(event.offsetX + offset - (that.tooltipOptions.offset.x / 2) >  that.plot.getPlaceholder().width() - margin){
				hideTooltip();
			}
		}
		
		function hideTooltip(event){
			that.tip.hide();
			that.plot.unhighlight();
		}
	};

	/**
	 * set or create tooltip
	 * @return jQuery object
	 */
	FlotTooltip.prototype.getDomElement = function() {
		
		this.tip = null;

		var id		 = this.tooltipOptions.element.id;
		var classes  = this.tooltipOptions.element.classes.join('.');
		var ph		 = this.plot.getPlaceholder();
		
		if( id && ph.find('#'+id).length > 0 ){
			this.tip = ph.find('#'+id);
		} else if( classes && ph.find('.'+classes).length > 0 ){
			this.tip = ph.find('.'+classes);
		} else {
			this.tip = $('<div id="'+id+'" class="'+classes+'" />'); 
			this.tip.appendTo(ph).hide();
		}

		return this.tip;
	};

	/**
	 * Update the tooltip position and content
	 * @param Item content Object of an item
	 */
	FlotTooltip.prototype.update = function( item ) {
		
		if(!item)
			return;
		
		var dataPoints 	= [],
			dataX 		= item.datapoint[0],
			dataY 		= item.datapoint[1],
			y 			= item.pageY - this.plot.getPlaceholder().offset().top,
			x 			= item.pageX - this.plot.getPlaceholder().offset().left
		;
		
		/* Loop around all the data in the graph and try to find other plots for this x value */
		points = this.plot.getData();
	    this.plot.unhighlight();
		for(var k = 0; k < points.length; k++){
			 for(var m = 0; m < points[k].data.length; m++){
				 if(points[k].data[m][0] == dataX){
					 // there is another data point on this x axis!
					 dataPoints.push({
						 series: points[k],
						 point: points[k].data[m]
					 });
					 
					 this.plot.highlight(k, m);
				 }						 
			 }
		}	
		
		/* Trigger tooltip format and render */
		var innerContent = this.tooltipOptions.formatTooltip.call(this, dataPoints);
		this.tip.html(innerContent).show();
		
		/* Update position */
		this.updatePosition( x, y );
	};

	FlotTooltip.prototype.updatePosition = function( x, y ) {
		
		var 
			tipWidth 	= this.tip.outerWidth() + this.tooltipOptions.offset.x,
			tipHeight 	= this.tip.outerHeight() + this.tooltipOptions.offset.y,
			isAtPointer = this.tooltipOptions.element.position == 'point',
			xPos 		= this.tooltipOptions.element.attach[1],
			yPos 		= this.tooltipOptions.element.attach[0],
			css 		= {
							  top: 'inherit',
							  left: 'inherit',
							  bottom: 'inherit',
							  right: 'inherit',
						  }
		;
		
		/* Position the tooltip based on config options */
		if( xPos == 'left' ){
			css.left = isAtPointer ? x - tipWidth -  this.tooltipOptions.offset.x : this.tooltipOptions.offset.x ;
		} else if( xPos == 'right' ){
			css.right = isAtPointer ? this.plot.getPlaceholder().width() - tipWidth - x - this.tooltipOptions.offset.x  : this.tooltipOptions.offset.x;
		} else if ( xPos == 'center' ){
			css.left = isAtPointer ? x - (tipWidth / 2) : this.tooltipOptions.offset.x ;
		}
		if( yPos == 'top' ){
			css.top = isAtPointer ? y - tipHeight - this.tooltipOptions.offset.x : this.tooltipOptions.offset.y ;
		} else if( yPos == 'bottom' ){
			css.bottom = isAtPointer ? this.plot.getPlaceholder().height() - tipHeight - y - this.tooltipOptions.offset.y : this.tooltipOptions.offset.y;
		} else if( yPos == 'center' ){
			css.top = isAtPointer ? y - (tipHeight / 2) : this.tooltipOptions.offset.y ;
		}
		
		/* If it's off the end, switch to showing it on the opposite side */
		if(css.right < 0){
			css.right	= css.right + tipWidth + (2 * this.tooltipOptions.offset.x);
		}
		if(css.left < 0){
			css.top	= css.left + tipWidth + (2 * this.tooltipOptions.offset.y);
		}
		if(css.top < 0){
			css.top	= css.top + tipHeight + (2 * this.tooltipOptions.offset.y);
		}
		if(css.bottom < 0){
			css.bottom	= css.bottom + tipHeight + (2 * this.tooltipOptions.offset.y);
		}

		/* Update position object */
		this.tipPosition = css;
		
		if( typeof this.tooltipOptions.positionTooltip == 'function' ){
			this.tooltipOptions.positionTooltip.call(this, css);
		}		
		
		if( this.tooltipOptions.animate && false)
			this.tip.show().animate(css);
		else
			this.tip.show().css(css);
	};

	/**
	 * Init
	 */
	var init = function(plot) {
	  new FlotTooltip(plot);
	};

	$.plot.plugins.push({
		init: init,
		options: defaultOptions,
		name: 'tooltip',
		version: '0.0.1'
	});

})(jQuery);
