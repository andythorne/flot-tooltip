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
        	enabled: true,
        	
        	shared:  true,
        	element: {
        		id: '',
        		classes: ['flot-tooltip'],
            	position: 'point', // options: [point,fixed]
            	attach: ['bottom', 'right'], // options: [ center|top|bottom, center|left|right ]
        	},
        	animate: true,
            
            // cursor offset
            offset: {
                x: 10,
                y: 20
            },

            // callbacks
            events: {
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
        this.tipPosition = {x: 0, y: 0};

        this.init(plot);
    };

    // main plugin function
    FlotTooltip.prototype.init = function(plot) {

    	
        var that = this;

        plot.hooks.bindEvents.push(function (plot, eventHolder) {

        	that.plot = plot;
        	
            // get plot options
            that.plotOptions = plot.getOptions();

            // if not enabled return
            if (typeof that.plotOptions.tooltip === 'undefined' || that.plotOptions.tooltip.enabled === false) return;

            // shortcut to access tooltip options
            that.tooltipOptions = that.plotOptions.tooltip;

            // create tooltip DOM element
            that.tip = that.getDomElement();

            // bind event
            $( plot.getPlaceholder() ).bind("plothover", plothover);
 
        });
        
		plot.hooks.shutdown.push(function (plot, eventHolder){
			$(plot.getPlaceholder()).unbind("plothover", plothover);
		});
        
		function plothover(event, pos, item) {
			var $tip = that.getDomElement();
			var plot = that.plot;

            if (item) {

                var x = item.datapoint[0],
                    y = item.datapoint[1];
                
                var tt = [];
                
    	    	var points = plot.getData();
    	    	
    	        for(var k = 0; k < points.length; k++){
    	             for(var m = 0; m < points[k].data.length; m++){
    	            	 if(points[k].data[m][0] == x){
    	            		 // there is another data point on this x axis!
    	            		 tt.push("<span style='color:"+points[k].color+";'>"+points[k].label + "</span>: " + parseInt(points[k].data[m][1]));
    	            	 }    	            	 
    	             }
    	        }
    	        
                if (that.previousPoint === null || that.previousPoint.dataIndex != item.dataIndex || that.previousPoint.seriesIndex != item.seriesIndex) {
                	that.previousPoint = item;

                    var yPos =  -  plot.getPlaceholder().offset().top;
                    var xPos = item.pageX -  plot.getPlaceholder().offset().left;
                    var content = tt.join('<br/>' );
                    
                    that.update(content, xPos, yPos);
                }

                // run callback
                if(typeof that.tooltipOptions.events.hover === 'function') {
                    that.tooltipOptions.events.hover(item, $tip);
                }

            }
            else {
                $tip.hide().html('');
            }
        }
    };

    /**
     * get or create tooltip
     * @return jQuery object
     */
    FlotTooltip.prototype.getDomElement = function() {
        var $tip;

        var id 		= this.tooltipOptions.element.id;
        var classes = this.tooltipOptions.element.classes.join('.');
        var ph 		= this.plot.getPlaceholder();
        
        if( id && ph.find('#'+id).length > 0 ){
            $tip = ph.find('#'+id);
        } else if( classes && ph.find('.'+classes).length > 0 ){
            $tip = ph.find('.'+classes);
        } else {
            $tip = $('<div id="'+id+'" class="'+classes+'" />'); 
            $tip.appendTo(ph).hide();
        }

        return $tip;
    };

    /**
     * Update the tooltip position and content
     * @param string content String of what the tooltip contains
     * @param int x X coord
     * @param int y Y coord
     */
    FlotTooltip.prototype.update = function(content, x, y) {
        
        var tipWidth = this.tip.outerWidth() + this.tooltipOptions.offset.x;
        var tipHeight = this.tip.outerHeight() + this.tooltipOptions.offset.y;
        
        var pageX = x - $(window).scrollLeft();
        var pageY = y - $(window).scrollTop();
        
        var css = {
        	top: 'inherit',
        	left: 'inherit',
        	bottom: 'inherit',
        	right: 'inherit',
        };
        
        var isAtPointer = this.tooltipOptions.element.position == 'pointer';
        var xPos = this.tooltipOptions.element.attach[1];
        var yPos = this.tooltipOptions.element.attach[0];
        if( xPos == 'left' ){
        	css.left = isAtPointer ? x - tipWidth -  this.tooltipOptions.offset.x : this.tooltipOptions.offset.x ;
        } else if( xPos == 'right' ){
        	css.right = isAtPointer ? x : this.tooltipOptions.offset.x;
        } else if ( xPos == 'center' ){
        	css.left = isAtPointer ? x - (tipWidth / 2) : this.tooltipOptions.offset.x ;
        }
        if( yPos == 'top' ){
        	css.top = isAtPointer ? y - tipWidth -  this.tooltipOptions.offset.x : this.tooltipOptions.offset.y ;
        } else if( yPos == 'bottom' ){
        	css.bottom = isAtPointer ? y : this.tooltipOptions.offset.y;
        } else if( yPos == 'center' ){
        	css.top = isAtPointer ? y - (tipHeight / 2) : this.tooltipOptions.offset.y ;
        }

        this.tipPosition.x = x;
        this.tipPosition.y = y;
        
        this.tip.css(css).html(content).show();
    };

    /**
     * Init
     */
    var init = function(plot) {
      new FlotTooltip(plot);
    };

    // define Flot plugin
    $.plot.plugins.push({
        init: init,
        options: defaultOptions,
        name: 'tooltip',
        version: '0.0.1'
    });

})(jQuery);
