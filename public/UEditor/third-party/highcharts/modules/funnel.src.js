/**
 * @license
 * Highcharts funnel module, Beta
 *
 * (c) 2010-2012 Torstein Hønsi
 *
 * License: www.highcharts.com/license
 */

/*global Highcharts */
(function (Highcharts) {
    'use strict'

    // create shortcuts
    const defaultOptions = Highcharts.getOptions()
    const defaultPlotOptions = defaultOptions.plotOptions
    const seriesTypes = Highcharts.seriesTypes
    const merge = Highcharts.merge
    const noop = function () {}
    const each = Highcharts.each

    // set default options
    defaultPlotOptions.funnel = merge(defaultPlotOptions.pie, {
        center: ['50%', '50%'],
        width: '90%',
        neckWidth: '30%',
        height: '100%',
        neckHeight: '25%',

        dataLabels: {
            // position: 'right',
            connectorWidth: 1,
            connectorColor: '#606060'
        },
        size: true, // to avoid adapting to data label size in Pie.drawDataLabels
        states: {
            select: {
                color: '#C0C0C0',
                borderColor: '#000000',
                shadow: false
            }
        }
    })

    seriesTypes.funnel = Highcharts.extendClass(seriesTypes.pie, {

        type: 'funnel',
        animate: noop,

        /**
	 * Overrides the pie translate method
	 */
        translate: function () {
            const
                // Get positions - either an integer or a percentage string must be given
                getLength = function (length, relativeTo) {
                    return (/%$/).test(length)
                        ? relativeTo * parseInt(length, 10) / 100
                        : parseInt(length, 10)
                }

            let sum = 0
            const series = this
            const chart = series.chart
            const plotWidth = chart.plotWidth
            const plotHeight = chart.plotHeight
            let cumulative = 0 // start at top
            const options = series.options
            const center = options.center
            const centerX = getLength(center[0], plotWidth)
            const centerY = getLength(center[0], plotHeight)
            const width = getLength(options.width, plotWidth)
            let tempWidth
            let getWidthAt
            const height = getLength(options.height, plotHeight)
            const neckWidth = getLength(options.neckWidth, plotWidth)
            const neckHeight = getLength(options.neckHeight, plotHeight)
            const neckY = height - neckHeight
            const data = series.data
            let path
            let fraction
            const half = options.dataLabels.position === 'left' ? 1 : 0

            let x1
            let y1
            let x2
            let x3
            let y3
            let x4
            let y5

            // Return the width at a specific y coordinate
            series.getWidthAt = getWidthAt = function (y) {
                return y > height - neckHeight || height === neckHeight
                    ? neckWidth
                    : neckWidth + (width - neckWidth) * ((height - neckHeight - y) / (height - neckHeight))
            }
            series.getX = function (y, half) {
                return centerX + (half ? -1 : 1) * ((getWidthAt(y) / 2) + options.dataLabels.distance)
            }

            // Expose
            series.center = [centerX, centerY, height]
            series.centerX = centerX

            /*
		 * Individual point coordinate naming:
		 *
		 * x1,y1 _________________ x2,y1
		 *  \                         /
		 *   \                       /
		 *    \                     /
		 *     \                   /
		 *      \                 /
		 *     x3,y3 _________ x4,y3
		 *
		 * Additional for the base of the neck:
		 *
		 *       |               |
		 *       |               |
		 *       |               |
		 *     x3,y5 _________ x4,y5
		 */

            // get the total sum
            each(data, function (point) {
                sum += point.y
            })

            each(data, function (point) {
                // set start and end positions
                y5 = null
                fraction = sum ? point.y / sum : 0
                y1 = centerY - height / 2 + cumulative * height
                y3 = y1 + fraction * height
                // tempWidth = neckWidth + (width - neckWidth) * ((height - neckHeight - y1) / (height - neckHeight));
                tempWidth = getWidthAt(y1)
                x1 = centerX - tempWidth / 2
                x2 = x1 + tempWidth
                tempWidth = getWidthAt(y3)
                x3 = centerX - tempWidth / 2
                x4 = x3 + tempWidth

                // the entire point is within the neck
                if (y1 > neckY) {
                    x1 = x3 = centerX - neckWidth / 2
                    x2 = x4 = centerX + neckWidth / 2

                    // the base of the neck
                } else if (y3 > neckY) {
                    y5 = y3

                    tempWidth = getWidthAt(neckY)
                    x3 = centerX - tempWidth / 2
                    x4 = x3 + tempWidth

                    y3 = neckY
                }

                // save the path
                path = [
                    'M',
                    x1, y1,
                    'L',
                    x2, y1,
                    x4, y3
                ]
                if (y5) {
                    path.push(x4, y5, x3, y5)
                }
                path.push(x3, y3, 'Z')

                // prepare for using shared dr
                point.shapeType = 'path'
                point.shapeArgs = { d: path }

                // for tooltips and data labels
                point.percentage = fraction * 100
                point.plotX = centerX
                point.plotY = (y1 + (y5 || y3)) / 2

                // Placement of tooltips and data labels
                point.tooltipPos = [
                    centerX,
                    point.plotY
                ]

                // Slice is a noop on funnel points
                point.slice = noop

                // Mimicking pie data label placement logic
                point.half = half

                cumulative += fraction
            })

            series.setTooltipPoints()
        },
        /**
	 * Draw a single point (wedge)
	 * @param {Object} point The point object
	 * @param {Object} color The color of the point
	 * @param {Number} brightness The brightness relative to the color
	 */
        drawPoints: function () {
            const series = this
            const options = series.options
            const chart = series.chart
            const renderer = chart.renderer

            each(series.data, function (point) {
                const graphic = point.graphic
                const shapeArgs = point.shapeArgs

                if (!graphic) { // Create the shapes
                    point.graphic = renderer.path(shapeArgs)
                        .attr({
                            fill: point.color,
                            stroke: options.borderColor,
                            'stroke-width': options.borderWidth
                        })
                        .add(series.group)
                } else { // Update the shapes
                    graphic.animate(shapeArgs)
                }
            })
        },

        /**
	 * Funnel items don't have angles (#2289)
	 */
        sortByAngle: noop,

        /**
	 * Extend the pie data label method
	 */
        drawDataLabels: function () {
            const data = this.data
            const labelDistance = this.options.dataLabels.distance
            let leftSide
            let sign
            let point
            let i = data.length
            let x
            let y

            // In the original pie label anticollision logic, the slots are distributed
            // from one labelDistance above to one labelDistance below the pie. In funnels
            // we don't want this.
            this.center[2] -= 2 * labelDistance

            // Set the label position array for each point.
            while (i--) {
                point = data[i]
                leftSide = point.half
                sign = leftSide ? 1 : -1
                y = point.plotY
                x = this.getX(y, leftSide)

                // set the anchor point for data labels
                point.labelPos = [
                    0, // first break of connector
                    y, // a/a
                    x + (labelDistance - 5) * sign, // second break, right outside point shape
                    y, // a/a
                    x + labelDistance * sign, // landing point for connector
                    y, // a/a
                    leftSide ? 'right' : 'left', // alignment
                    0 // center angle
                ]
            }

            seriesTypes.pie.prototype.drawDataLabels.call(this)
        }

    })
}(Highcharts))
