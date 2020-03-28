/**
 * @license Map plugin v0.1 for Highcharts
 *
 * (c) 2011-2013 Torstein Hønsi
 *
 * License: www.highcharts.com/license
 */

/*
 * See www.highcharts.com/studies/world-map.htm for use case.
 *
 * To do:
 * - Optimize long variable names and alias adapter methods and Highcharts namespace variables
 * - Zoom and pan GUI
 */
(function (Highcharts) {
    let UNDEFINED
    const Axis = Highcharts.Axis
    const Chart = Highcharts.Chart
    const Point = Highcharts.Point
    const Pointer = Highcharts.Pointer
    const each = Highcharts.each
    const extend = Highcharts.extend
    const merge = Highcharts.merge
    const pick = Highcharts.pick
    const numberFormat = Highcharts.numberFormat
    const defaultOptions = Highcharts.getOptions()
    const seriesTypes = Highcharts.seriesTypes
    const plotOptions = defaultOptions.plotOptions
    const wrap = Highcharts.wrap
    const Color = Highcharts.Color
    const noop = function () {}

    /*
	 * Return an intermediate color between two colors, according to pos where 0
	 * is the from color and 1 is the to color
	 */
    function tweenColors(from, to, pos) {
        let i = 4
        const rgba = []

        while (i--) {
            rgba[i] = Math.round(
                to.rgba[i] + (from.rgba[i] - to.rgba[i]) * (1 - pos)
            )
        }
        return 'rgba(' + rgba.join(',') + ')'
    }

    // Set the default map navigation options
    defaultOptions.mapNavigation = {
        buttonOptions: {
            align: 'right',
            verticalAlign: 'bottom',
            x: 0,
            width: 18,
            height: 18,
            style: {
                fontSize: '15px',
                fontWeight: 'bold',
                textAlign: 'center'
            }
        },
        buttons: {
            zoomIn: {
                onclick: function () {
                    this.mapZoom(0.5)
                },
                text: '+',
                y: -32
            },
            zoomOut: {
                onclick: function () {
                    this.mapZoom(2)
                },
                text: '-',
                y: 0
            }
        }
        // enableButtons: false,
        // enableTouchZoom: false,
        // zoomOnDoubleClick: false,
        // zoomOnMouseWheel: false

    }

    /**
	 * Utility for reading SVG paths directly.
	 */
    Highcharts.splitPath = function (path) {
        let i

        // Move letters apart
        path = path.replace(/([A-Za-z])/g, ' $1 ')
        // Trim
        path = path.replace(/^\s*/, '').replace(/\s*$/, '')

        // Split on spaces and commas
        path = path.split(/[ ,]+/)

        // Parse numbers
        for (i = 0; i < path.length; i++) {
            if (!/[a-zA-Z]/.test(path[i])) {
                path[i] = parseFloat(path[i])
            }
        }
        return path
    }

    // A placeholder for map definitions
    Highcharts.maps = {}

    /**
	 * Override to use the extreme coordinates from the SVG shape, not the
	 * data values
	 */
    wrap(Axis.prototype, 'getSeriesExtremes', function (proceed) {
        const isXAxis = this.isXAxis
        let dataMin
        let dataMax
        const xData = []

        // Remove the xData array and cache it locally so that the proceed method doesn't use it
        each(this.series, function (series, i) {
            if (series.useMapGeometry) {
                xData[i] = series.xData
                series.xData = []
            }
        })

        // Call base to reach normal cartesian series (like mappoint)
        proceed.call(this)

        // Run extremes logic for map and mapline
        dataMin = pick(this.dataMin, Number.MAX_VALUE)
        dataMax = pick(this.dataMax, Number.MIN_VALUE)
        each(this.series, function (series, i) {
            if (series.useMapGeometry) {
                dataMin = Math.min(dataMin, series[isXAxis ? 'minX' : 'minY'])
                dataMax = Math.max(dataMax, series[isXAxis ? 'maxX' : 'maxY'])
                series.xData = xData[i] // Reset xData array
            }
        })

        this.dataMin = dataMin
        this.dataMax = dataMax
    })

    /**
	 * Override axis translation to make sure the aspect ratio is always kept
	 */
    wrap(Axis.prototype, 'setAxisTranslation', function (proceed) {
        const chart = this.chart
        let mapRatio
        const plotRatio = chart.plotWidth / chart.plotHeight
        const isXAxis = this.isXAxis
        let adjustedAxisLength
        const xAxis = chart.xAxis[0]
        let padAxis

        // Run the parent method
        proceed.call(this)

        // On Y axis, handle both
        if (chart.options.chart.type === 'map' && !isXAxis && xAxis.transA !== UNDEFINED) {
            // Use the same translation for both axes
            this.transA = xAxis.transA = Math.min(this.transA, xAxis.transA)

            mapRatio = (xAxis.max - xAxis.min) / (this.max - this.min)

            // What axis to pad to put the map in the middle
            padAxis = mapRatio > plotRatio ? this : xAxis

            // Pad it
            adjustedAxisLength = (padAxis.max - padAxis.min) * padAxis.transA
            padAxis.minPixelPadding = (padAxis.len - adjustedAxisLength) / 2
        }
    })

    // --- Start zooming and panning features

    wrap(Chart.prototype, 'render', function (proceed) {
        const chart = this
        const mapNavigation = chart.options.mapNavigation

        proceed.call(chart)

        // Render the plus and minus buttons
        chart.renderMapNavigation()

        // Add the double click event
        if (mapNavigation.zoomOnDoubleClick) {
            Highcharts.addEvent(chart.container, 'dblclick', function (e) {
                chart.pointer.onContainerDblClick(e)
            })
        }

        // Add the mousewheel event
        if (mapNavigation.zoomOnMouseWheel) {
            Highcharts.addEvent(chart.container, document.onmousewheel === undefined ? 'DOMMouseScroll' : 'mousewheel', function (e) {
                chart.pointer.onContainerMouseWheel(e)
            })
        }
    })

    // Extend the Pointer
    extend(Pointer.prototype, {

        /**
		 * The event handler for the doubleclick event
		 */
        onContainerDblClick: function (e) {
            const chart = this.chart

            e = this.normalize(e)

            if (chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) {
                chart.mapZoom(
                    0.5,
                    chart.xAxis[0].toValue(e.chartX),
                    chart.yAxis[0].toValue(e.chartY)
                )
            }
        },

        /**
		 * The event handler for the mouse scroll event
		 */
        onContainerMouseWheel: function (e) {
            const chart = this.chart
            let delta

            e = this.normalize(e)

            // Firefox uses e.detail, WebKit and IE uses wheelDelta
            delta = e.detail || -(e.wheelDelta / 120)
            if (chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) {
                chart.mapZoom(
                    delta > 0 ? 2 : 0.5,
                    chart.xAxis[0].toValue(e.chartX),
                    chart.yAxis[0].toValue(e.chartY)
                )
            }
        }
    })
    // Implement the pinchType option
    wrap(Pointer.prototype, 'init', function (proceed, chart, options) {
        proceed.call(this, chart, options)

        // Pinch status
        if (options.mapNavigation.enableTouchZoom) {
            this.pinchX = this.pinchHor =
				this.pinchY = this.pinchVert = true
        }
    })

    // Add events to the Chart object itself
    extend(Chart.prototype, {
        renderMapNavigation: function () {
            const chart = this
            const options = this.options.mapNavigation
            const buttons = options.buttons
            let n
            let button
            let buttonOptions
            const outerHandler = function () {
                this.handler.call(chart)
            }

            if (options.enableButtons) {
                for (n in buttons) {
                    if (buttons.hasOwnProperty(n)) {
                        buttonOptions = merge(options.buttonOptions, buttons[n])

                        button = chart.renderer.button(buttonOptions.text, 0, 0, outerHandler)
                            .attr({
                                width: buttonOptions.width,
                                height: buttonOptions.height
                            })
                            .css(buttonOptions.style)
                            .add()
                        button.handler = buttonOptions.onclick
                        button.align(extend(buttonOptions, { width: button.width, height: button.height }), null, 'spacingBox')
                    }
                }
            }
        },

        /**
		 * Fit an inner box to an outer. If the inner box overflows left or right, align it to the sides of the
		 * outer. If it overflows both sides, fit it within the outer. This is a pattern that occurs more places
		 * in Highcharts, perhaps it should be elevated to a common utility function.
		 */
        fitToBox: function (inner, outer) {
            each([['x', 'width'], ['y', 'height']], function (dim) {
                const pos = dim[0]
                const size = dim[1]
                if (inner[pos] + inner[size] > outer[pos] + outer[size]) { // right overflow
                    if (inner[size] > outer[size]) { // the general size is greater, fit fully to outer
                        inner[size] = outer[size]
                        inner[pos] = outer[pos]
                    } else { // align right
                        inner[pos] = outer[pos] + outer[size] - inner[size]
                    }
                }
                if (inner[size] > outer[size]) {
                    inner[size] = outer[size]
                }
                if (inner[pos] < outer[pos]) {
                    inner[pos] = outer[pos]
                }
            })

            return inner
        },

        /**
		 * Zoom the map in or out by a certain amount. Less than 1 zooms in, greater than 1 zooms out.
		 */
        mapZoom: function (howMuch, centerXArg, centerYArg) {
            if (this.isMapZooming) {
                return
            }

            const chart = this
            const xAxis = chart.xAxis[0]
            const xRange = xAxis.max - xAxis.min
            const centerX = pick(centerXArg, xAxis.min + xRange / 2)
            const newXRange = xRange * howMuch
            const yAxis = chart.yAxis[0]
            const yRange = yAxis.max - yAxis.min
            const centerY = pick(centerYArg, yAxis.min + yRange / 2)
            const newYRange = yRange * howMuch
            const newXMin = centerX - newXRange / 2
            const newYMin = centerY - newYRange / 2
            const animation = pick(chart.options.chart.animation, true)
            let delay
            const newExt = chart.fitToBox({
                x: newXMin,
                y: newYMin,
                width: newXRange,
                height: newYRange
            }, {
                x: xAxis.dataMin,
                y: yAxis.dataMin,
                width: xAxis.dataMax - xAxis.dataMin,
                height: yAxis.dataMax - yAxis.dataMin
            })

            xAxis.setExtremes(newExt.x, newExt.x + newExt.width, false)
            yAxis.setExtremes(newExt.y, newExt.y + newExt.height, false)

            // Prevent zooming until this one is finished animating
            delay = animation ? animation.duration || 500 : 0
            if (delay) {
                chart.isMapZooming = true
                setTimeout(function () {
                    chart.isMapZooming = false
                }, delay)
            }

            chart.redraw()
        }
    })

    /**
	 * Extend the default options with map options
	 */
    plotOptions.map = merge(plotOptions.scatter, {
        animation: false, // makes the complex shapes slow
        nullColor: '#F8F8F8',
        borderColor: 'silver',
        borderWidth: 1,
        marker: null,
        stickyTracking: false,
        dataLabels: {
            verticalAlign: 'middle'
        },
        turboThreshold: 0,
        tooltip: {
            followPointer: true,
            pointFormat: '{point.name}: {point.y}<br/>'
        },
        states: {
            normal: {
                animation: true
            }
        }
    })

    const MapAreaPoint = Highcharts.extendClass(Point, {
        /**
		 * Extend the Point object to split paths
		 */
        applyOptions: function (options, x) {
            const point = Point.prototype.applyOptions.call(this, options, x)

            if (point.path && typeof point.path === 'string') {
                point.path = point.options.path = Highcharts.splitPath(point.path)
            }

            return point
        },
        /**
		 * Stop the fade-out
		 */
        onMouseOver: function () {
            clearTimeout(this.colorInterval)
            Point.prototype.onMouseOver.call(this)
        },
        /**
		 * Custom animation for tweening out the colors. Animation reduces blinking when hovering
		 * over islands and coast lines. We run a custom implementation of animation becuase we
		 * need to be able to run this independently from other animations like zoom redraw. Also,
		 * adding color animation to the adapters would introduce almost the same amount of code.
		 */
        onMouseOut: function () {
            const point = this
            const start = +new Date()
            const normalColor = Color(point.options.color)
            const hoverColor = Color(point.pointAttr.hover.fill)
            const animation = point.series.options.states.normal.animation
            const duration = animation && (animation.duration || 500)

            if (duration && normalColor.rgba.length === 4 && hoverColor.rgba.length === 4) {
                delete point.pointAttr[''].fill // avoid resetting it in Point.setState

                clearTimeout(point.colorInterval)
                point.colorInterval = setInterval(function () {
                    let pos = (new Date() - start) / duration
                    const graphic = point.graphic
                    if (pos > 1) {
                        pos = 1
                    }
                    if (graphic) {
                        graphic.attr('fill', tweenColors(hoverColor, normalColor, pos))
                    }
                    if (pos >= 1) {
                        clearTimeout(point.colorInterval)
                    }
                }, 13)
            }
            Point.prototype.onMouseOut.call(point)
        }
    })

    /**
	 * Add the series type
	 */
    seriesTypes.map = Highcharts.extendClass(seriesTypes.scatter, {
        type: 'map',
        pointAttrToOptions: { // mapping between SVG attributes and the corresponding options
            stroke: 'borderColor',
            'stroke-width': 'borderWidth',
            fill: 'color'
        },
        colorKey: 'y',
        pointClass: MapAreaPoint,
        trackerGroups: ['group', 'markerGroup', 'dataLabelsGroup'],
        getSymbol: noop,
        supportsDrilldown: true,
        getExtremesFromAll: true,
        useMapGeometry: true, // get axis extremes from paths, not values
        init: function (chart) {
            const series = this
            const valueDecimals = chart.options.legend.valueDecimals
            let legendItems = []
            let name
            let from
            let to
            let fromLabel
            let toLabel
            let colorRange
            let valueRanges
            let gradientColor
            let grad
            let tmpLabel
            const horizontal = chart.options.legend.layout === 'horizontal'

            Highcharts.Series.prototype.init.apply(this, arguments)
            colorRange = series.options.colorRange
            valueRanges = series.options.valueRanges

            if (valueRanges) {
                each(valueRanges, function (range) {
                    from = range.from
                    to = range.to

                    // Assemble the default name. This can be overridden by legend.options.labelFormatter
                    name = ''
                    if (from === UNDEFINED) {
                        name = '< '
                    } else if (to === UNDEFINED) {
                        name = '> '
                    }
                    if (from !== UNDEFINED) {
                        name += numberFormat(from, valueDecimals)
                    }
                    if (from !== UNDEFINED && to !== UNDEFINED) {
                        name += ' - '
                    }
                    if (to !== UNDEFINED) {
                        name += numberFormat(to, valueDecimals)
                    }

                    // Add a mock object to the legend items
                    legendItems.push(Highcharts.extend({
                        chart: series.chart,
                        name: name,
                        options: {},
                        drawLegendSymbol: seriesTypes.area.prototype.drawLegendSymbol,
                        visible: true,
                        setState: function () {},
                        setVisible: function () {}
                    }, range))
                })
                series.legendItems = legendItems
            } else if (colorRange) {
                from = colorRange.from
                to = colorRange.to
                fromLabel = colorRange.fromLabel
                toLabel = colorRange.toLabel

                // Flips linearGradient variables and label text.
                grad = horizontal ? [0, 0, 1, 0] : [0, 1, 0, 0]
                if (!horizontal) {
                    tmpLabel = fromLabel
                    fromLabel = toLabel
                    toLabel = tmpLabel
                }

                // Creates color gradient.
                gradientColor = {
                    linearGradient: { x1: grad[0], y1: grad[1], x2: grad[2], y2: grad[3] },
                    stops:
					[
					    [0, from],
					    [1, to]
					]
                }

                // Add a mock object to the legend items.
                legendItems = [{
                    chart: series.chart,
                    options: {},
                    fromLabel: fromLabel,
                    toLabel: toLabel,
                    color: gradientColor,
                    drawLegendSymbol: this.drawLegendSymbolGradient,
                    visible: true,
                    setState: function () {},
                    setVisible: function () {}
                }]

                series.legendItems = legendItems
            }
        },

        /**
		 * If neither valueRanges nor colorRanges are defined, use basic area symbol.
		 */
        drawLegendSymbol: seriesTypes.area.prototype.drawLegendSymbol,

        /**
		 * Gets the series' symbol in the legend and extended legend with more information.
		 *
		 * @param {Object} legend The legend object
		 * @param {Object} item The series (this) or point
		 */
        drawLegendSymbolGradient: function (legend, item) {
            const spacing = legend.options.symbolPadding
            const padding = pick(legend.options.padding, 8)
            let positionY
            let positionX
            const gradientSize = this.chart.renderer.fontMetrics(legend.options.itemStyle.fontSize).h
            const horizontal = legend.options.layout === 'horizontal'
            let box1
            let box2
            let box3
            const rectangleLength = pick(legend.options.rectangleLength, 200)

            // Set local variables based on option.
            if (horizontal) {
                positionY = -(spacing / 2)
                positionX = 0
            } else {
                positionY = -rectangleLength + legend.baseline - (spacing / 2)
                positionX = padding + gradientSize
            }

            // Creates the from text.
            item.fromText = this.chart.renderer.text(
                item.fromLabel,	// Text.
                positionX,		// Lower left x.
                positionY		// Lower left y.
            ).attr({
                zIndex: 2
            })
                .add(item.legendGroup)
            box1 = item.fromText.getBBox()

            // Creates legend symbol.
            // Ternary changes variables based on option.
            item.legendSymbol = this.chart.renderer.rect(
                horizontal ? box1.x + box1.width + spacing : box1.x - gradientSize - spacing,		// Upper left x.
                box1.y,																				// Upper left y.
                horizontal ? rectangleLength : gradientSize,											// Width.
                horizontal ? gradientSize : rectangleLength,										// Height.
                2																					// Corner radius.
            ).attr({
                zIndex: 1
            })
                .add(item.legendGroup)
            box2 = item.legendSymbol.getBBox()

            // Creates the to text.
            // Vertical coordinate changed based on option.
            item.toText = this.chart.renderer.text(
                item.toLabel,
                box2.x + box2.width + spacing,
                horizontal ? positionY : box2.y + box2.height - spacing
            ).attr({
                zIndex: 2
            })
                .add(item.legendGroup)
            box3 = item.toText.getBBox()

            // Changes legend box settings based on option.
            if (horizontal) {
                legend.offsetWidth = box1.width + box2.width + box3.width + (spacing * 2) + padding
                legend.itemY = gradientSize + padding
            } else {
                legend.offsetWidth = Math.max(box1.width, box3.width) + (spacing) + box2.width + padding
                legend.itemY = box2.height + padding
                legend.itemX = spacing
            }
        },

        /**
		 * Get the bounding box of all paths in the map combined.
		 */
        getBox: function (paths) {
            let maxX = Number.MIN_VALUE
            let minX = Number.MAX_VALUE
            let maxY = Number.MIN_VALUE
            let minY = Number.MAX_VALUE

            // Find the bounding box
            each(paths || this.options.data, function (point) {
                const path = point.path
                let i = path.length
                let even = false // while loop reads from the end
                let pointMaxX = Number.MIN_VALUE
                let pointMinX = Number.MAX_VALUE
                let pointMaxY = Number.MIN_VALUE
                let pointMinY = Number.MAX_VALUE

                while (i--) {
                    if (typeof path[i] === 'number' && !isNaN(path[i])) {
                        if (even) { // even = x
                            pointMaxX = Math.max(pointMaxX, path[i])
                            pointMinX = Math.min(pointMinX, path[i])
                        } else { // odd = Y
                            pointMaxY = Math.max(pointMaxY, path[i])
                            pointMinY = Math.min(pointMinY, path[i])
                        }
                        even = !even
                    }
                }
                // Cache point bounding box for use to position data labels
                point._maxX = pointMaxX
                point._minX = pointMinX
                point._maxY = pointMaxY
                point._minY = pointMinY

                maxX = Math.max(maxX, pointMaxX)
                minX = Math.min(minX, pointMinX)
                maxY = Math.max(maxY, pointMaxY)
                minY = Math.min(minY, pointMinY)
            })
            this.minY = minY
            this.maxY = maxY
            this.minX = minX
            this.maxX = maxX
        },

        /**
		 * Translate the path so that it automatically fits into the plot area box
		 * @param {Object} path
		 */
        translatePath: function (path) {
            const series = this
            let even = false // while loop reads from the end
            const xAxis = series.xAxis
            const yAxis = series.yAxis
            let i

            // Preserve the original
            path = [].concat(path)

            // Do the translation
            i = path.length
            while (i--) {
                if (typeof path[i] === 'number') {
                    if (even) { // even = x
                        path[i] = Math.round(xAxis.translate(path[i]))
                    } else { // odd = Y
                        path[i] = Math.round(yAxis.len - yAxis.translate(path[i]))
                    }
                    even = !even
                }
            }
            return path
        },

        setData: function () {
            Highcharts.Series.prototype.setData.apply(this, arguments)
            this.getBox()
        },

        /**
		 * Add the path option for data points. Find the max value for color calculation.
		 */
        translate: function () {
            const series = this
            let dataMin = Number.MAX_VALUE
            let dataMax = Number.MIN_VALUE

            series.generatePoints()

            each(series.data, function (point) {
                point.shapeType = 'path'
                point.shapeArgs = {
                    d: series.translatePath(point.path)
                }

                // TODO: do point colors in drawPoints instead of point.init
                if (typeof point.y === 'number') {
                    if (point.y > dataMax) {
                        dataMax = point.y
                    } else if (point.y < dataMin) {
                        dataMin = point.y
                    }
                }
            })

            series.translateColors(dataMin, dataMax)
        },

        /**
		 * In choropleth maps, the color is a result of the value, so this needs translation too
		 */
        translateColors: function (dataMin, dataMax) {
            const seriesOptions = this.options
            const valueRanges = seriesOptions.valueRanges
            const colorRange = seriesOptions.colorRange
            const colorKey = this.colorKey
            let from
            let to

            if (colorRange) {
                from = Color(colorRange.from)
                to = Color(colorRange.to)
            }

            each(this.data, function (point) {
                const value = point[colorKey]
                let range
                let color
                let i
                let pos

                if (valueRanges) {
                    i = valueRanges.length
                    while (i--) {
                        range = valueRanges[i]
                        from = range.from
                        to = range.to
                        if ((from === UNDEFINED || value >= from) && (to === UNDEFINED || value <= to)) {
                            color = range.color
                            break
                        }
                    }
                } else if (colorRange && value !== undefined) {
                    pos = 1 - ((dataMax - value) / (dataMax - dataMin))
                    color = value === null ? seriesOptions.nullColor : tweenColors(from, to, pos)
                }

                if (color) {
                    point.color = null // reset from previous drilldowns, use of the same data options
                    point.options.color = color
                }
            })
        },

        drawGraph: noop,

        /**
		 * We need the points' bounding boxes in order to draw the data labels, so
		 * we skip it now and call if from drawPoints instead.
		 */
        drawDataLabels: noop,

        /**
		 * Use the drawPoints method of column, that is able to handle simple shapeArgs.
		 * Extend it by assigning the tooltip position.
		 */
        drawPoints: function () {
            const series = this
            const xAxis = series.xAxis
            const yAxis = series.yAxis
            const colorKey = series.colorKey

            // Make points pass test in drawing
            each(series.data, function (point) {
                point.plotY = 1 // pass null test in column.drawPoints
                if (point[colorKey] === null) {
                    point[colorKey] = 0
                    point.isNull = true
                }
            })

            // Draw them
            seriesTypes.column.prototype.drawPoints.apply(series)

            each(series.data, function (point) {
                const dataLabels = point.dataLabels
                const minX = xAxis.toPixels(point._minX, true)
                const maxX = xAxis.toPixels(point._maxX, true)
                const minY = yAxis.toPixels(point._minY, true)
                const maxY = yAxis.toPixels(point._maxY, true)

                point.plotX = Math.round(minX + (maxX - minX) * pick(dataLabels && dataLabels.anchorX, 0.5))
                point.plotY = Math.round(minY + (maxY - minY) * pick(dataLabels && dataLabels.anchorY, 0.5))

                // Reset escaped null points
                if (point.isNull) {
                    point[colorKey] = null
                }
            })

            // Now draw the data labels
            Highcharts.Series.prototype.drawDataLabels.call(series)
        },

        /**
		 * Animate in the new series from the clicked point in the old series.
		 * Depends on the drilldown.js module
		 */
        animateDrilldown: function (init) {
            const toBox = this.chart.plotBox
            const level = this.chart.drilldownLevels[this.chart.drilldownLevels.length - 1]
            const fromBox = level.bBox
            const animationOptions = this.chart.options.drilldown.animation
            let scale

            if (!init) {
                scale = Math.min(fromBox.width / toBox.width, fromBox.height / toBox.height)
                level.shapeArgs = {
                    scaleX: scale,
                    scaleY: scale,
                    translateX: fromBox.x,
                    translateY: fromBox.y
                }

                // TODO: Animate this.group instead
                each(this.points, function (point) {
                    point.graphic
                        .attr(level.shapeArgs)
                        .animate({
                            scaleX: 1,
                            scaleY: 1,
                            translateX: 0,
                            translateY: 0
                        }, animationOptions)
                })

                delete this.animate
            }
        },

        /**
		 * When drilling up, pull out the individual point graphics from the lower series
		 * and animate them into the origin point in the upper series.
		 */
        animateDrillupFrom: function (level) {
            seriesTypes.column.prototype.animateDrillupFrom.call(this, level)
        },

        /**
		 * When drilling up, keep the upper series invisible until the lower series has
		 * moved into place
		 */
        animateDrillupTo: function (init) {
            seriesTypes.column.prototype.animateDrillupTo.call(this, init)
        }
    })

    // The mapline series type
    plotOptions.mapline = merge(plotOptions.map, {
        lineWidth: 1,
        backgroundColor: 'none'
    })
    seriesTypes.mapline = Highcharts.extendClass(seriesTypes.map, {
        type: 'mapline',
        pointAttrToOptions: { // mapping between SVG attributes and the corresponding options
            stroke: 'color',
            'stroke-width': 'lineWidth',
            fill: 'backgroundColor'
        },
        drawLegendSymbol: seriesTypes.line.prototype.drawLegendSymbol
    })

    // The mappoint series type
    plotOptions.mappoint = merge(plotOptions.scatter, {
        dataLabels: {
            enabled: true,
            format: '{point.name}',
            color: 'black',
            style: {
                textShadow: '0 0 5px white'
            }
        }
    })
    seriesTypes.mappoint = Highcharts.extendClass(seriesTypes.scatter, {
        type: 'mappoint'
    })

    /**
	 * A wrapper for Chart with all the default values for a Map
	 */
    Highcharts.Map = function (options, callback) {
        const hiddenAxis = {
            endOnTick: false,
            gridLineWidth: 0,
            labels: {
                enabled: false
            },
            lineWidth: 0,
            minPadding: 0,
            maxPadding: 0,
            startOnTick: false,
            tickWidth: 0,
            title: null
        }
        let seriesOptions

        // Don't merge the data
        seriesOptions = options.series
        options.series = null

        options = merge({
            chart: {
                type: 'map',
                panning: 'xy'
            },
            xAxis: hiddenAxis,
            yAxis: merge(hiddenAxis, { reversed: true })
        },
        options, // user's options

        { // forced options
            chart: {
                inverted: false
            }
        })

        options.series = seriesOptions

        return new Highcharts.Chart(options, callback)
    }
}(Highcharts))
