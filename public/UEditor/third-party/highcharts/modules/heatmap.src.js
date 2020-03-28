(function (Highcharts) {
    const seriesTypes = Highcharts.seriesTypes
    const each = Highcharts.each

    seriesTypes.heatmap = Highcharts.extendClass(seriesTypes.map, {
        colorKey: 'z',
        useMapGeometry: false,
        pointArrayMap: ['y', 'z'],
        translate: function () {
            const series = this
            const options = series.options
            let dataMin = Number.MAX_VALUE
            let dataMax = Number.MIN_VALUE

            series.generatePoints()

            each(series.data, function (point) {
                const x = point.x
                const y = point.y
                const value = point.z
                const xPad = (options.colsize || 1) / 2
                const yPad = (options.rowsize || 1) / 2

                point.path = [
                    'M', x - xPad, y - yPad,
                    'L', x + xPad, y - yPad,
                    'L', x + xPad, y + yPad,
                    'L', x - xPad, y + yPad,
                    'Z'
                ]

                point.shapeType = 'path'
                point.shapeArgs = {
                    d: series.translatePath(point.path)
                }

                if (typeof value === 'number') {
                    if (value > dataMax) {
                        dataMax = value
                    } else if (value < dataMin) {
                        dataMin = value
                    }
                }
            })

            series.translateColors(dataMin, dataMax)
        },

        getBox: function () {}

    })
}(Highcharts))
