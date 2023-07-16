if (!window.ToolBox) {
    class ToolBox {
        constructor(chart) {
            this.onTrendSelect = this.onTrendSelect.bind(this)
            this.onHorzSelect = this.onHorzSelect.bind(this)
            this.onRaySelect = this.onRaySelect.bind(this)

            this.chart = chart
            this.drawings = []
            this.chart.cursor = 'default'
            this.makingDrawing = false

            this.interval = 24 * 60 * 60 * 1000
            this.activeBackgroundColor = 'rgba(0, 122, 255, 0.7)'
            this.activeIconColor = 'rgb(240, 240, 240)'
            this.iconColor = 'lightgrey'
            this.backgroundColor = 'transparent'
            this.hoverColor = 'rgba(60, 60, 60, 0.7)'

            this.elem = this.makeToolBox()
            this.subscribeHoverMove()
        }

        makeToolBox() {
            let toolBoxElem = document.createElement('div')
            toolBoxElem.style.position = 'absolute'
            toolBoxElem.style.zIndex = '2000'
            toolBoxElem.style.display = 'flex'
            toolBoxElem.style.alignItems = 'center'
            toolBoxElem.style.top = '25%'
            toolBoxElem.style.borderRight = '2px solid #3C434C'
            toolBoxElem.style.borderTop = '2px solid #3C434C'
            toolBoxElem.style.borderBottom = '2px solid #3C434C'
            toolBoxElem.style.borderTopRightRadius = '4px'
            toolBoxElem.style.borderBottomRightRadius = '4px'
            toolBoxElem.style.backgroundColor = 'rgba(25, 27, 30, 0.5)'
            toolBoxElem.style.flexDirection = 'column'

            this.chart.activeIcon = null

            let trend = this.makeToolBoxElement(this.onTrendSelect, 'KeyT', `<rect x="3.84" y="13.67" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -5.9847 14.4482)" width="21.21" height="1.56"/><path d="M23,3.17L20.17,6L23,8.83L25.83,6L23,3.17z M23,7.41L21.59,6L23,4.59L24.41,6L23,7.41z"/><path d="M6,20.17L3.17,23L6,25.83L8.83,23L6,20.17z M6,24.41L4.59,23L6,21.59L7.41,23L6,24.41z"/>`)
            let horz = this.makeToolBoxElement(this.onHorzSelect, 'KeyH', `<rect x="4" y="14" width="9" height="1"/><rect x="16" y="14" width="9" height="1"/><path d="M11.67,14.5l2.83,2.83l2.83-2.83l-2.83-2.83L11.67,14.5z M15.91,14.5l-1.41,1.41l-1.41-1.41l1.41-1.41L15.91,14.5z"/>`)
            let ray = this.makeToolBoxElement(this.onRaySelect, 'KeyR', `<rect x="8" y="14" width="17" height="1"/><path d="M3.67,14.5l2.83,2.83l2.83-2.83L6.5,11.67L3.67,14.5z M7.91,14.5L6.5,15.91L5.09,14.5l1.41-1.41L7.91,14.5z"/>`)
            //let testB = this.makeToolBoxElement(this.onTrendSelect, `<rect x="8" y="6" width="12" height="1"/><rect x="9" y="22" width="11" height="1"/><path d="M3.67,6.5L6.5,9.33L9.33,6.5L6.5,3.67L3.67,6.5z M7.91,6.5L6.5,7.91L5.09,6.5L6.5,5.09L7.91,6.5z"/><path d="M19.67,6.5l2.83,2.83l2.83-2.83L22.5,3.67L19.67,6.5z M23.91,6.5L22.5,7.91L21.09,6.5l1.41-1.41L23.91,6.5z"/><path d="M19.67,22.5l2.83,2.83l2.83-2.83l-2.83-2.83L19.67,22.5z M23.91,22.5l-1.41,1.41l-1.41-1.41l1.41-1.41L23.91,22.5z"/><path d="M3.67,22.5l2.83,2.83l2.83-2.83L6.5,19.67L3.67,22.5z M7.91,22.5L6.5,23.91L5.09,22.5l1.41-1.41L7.91,22.5z"/><rect x="22" y="9" width="1" height="11"/><rect x="6" y="9" width="1" height="11"/>`)
            toolBoxElem.appendChild(trend)
            toolBoxElem.appendChild(horz)
            toolBoxElem.appendChild(ray)
            //toolBoxElem.appendChild(testB)

            this.chart.div.append(toolBoxElem)

            let commandZHandler = (toDelete) => {
                if (!toDelete) return
                if ('price' in toDelete) {
                    if (toDelete.id !== 'toolBox') return commandZHandler(this.drawings[this.drawings.indexOf(toDelete) - 1])
                    this.chart.series.removePriceLine(toDelete.line)
                } else {
                    let logical
                    if (toDelete.ray) logical = this.chart.chart.timeScale().getVisibleLogicalRange()
                    this.chart.chart.removeSeries(toDelete.line);
                    if (toDelete.ray) this.chart.chart.timeScale().setVisibleLogicalRange(logical)
                }
                this.drawings.splice(this.drawings.length - 1)
            }
            this.chart.commandFunctions.push((event) => {
                if (event.metaKey && event.code === 'KeyZ') {
                    commandZHandler(this.drawings[this.drawings.length - 1])
                    return true
                }
            });

            return toolBoxElem
        }

        makeToolBoxElement(action, keyCmd, paths) {
            let elem = document.createElement('div')
            elem.style.margin = '3px'
            elem.style.borderRadius = '4px'
            elem.style.display = 'flex'

            let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", "29");
            svg.setAttribute("height", "29");

            let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            group.innerHTML = paths
            group.setAttribute("fill", this.iconColor)

            svg.appendChild(group)
            elem.appendChild(svg);

            elem.addEventListener('mouseenter', () => {
                elem.style.backgroundColor = elem === this.chart.activeIcon ? this.activeBackgroundColor : this.hoverColor
                document.body.style.cursor = 'pointer'
            })
            elem.addEventListener('mouseleave', () => {
                elem.style.backgroundColor = elem === this.chart.activeIcon ? this.activeBackgroundColor : this.backgroundColor
                document.body.style.cursor = this.chart.cursor
            })
            elem.addEventListener('click', () => {
                if (this.chart.activeIcon) {
                    this.chart.activeIcon.style.backgroundColor = this.backgroundColor
                    group.setAttribute("fill", this.iconColor)
                    document.body.style.cursor = 'crosshair'
                    this.chart.cursor = 'crosshair'
                    action(false)
                }
                if (this.chart.activeIcon === elem) {
                    this.chart.activeIcon = null
                    return
                }
                this.chart.activeIcon = elem
                group.setAttribute("fill", this.activeIconColor)
                elem.style.backgroundColor = this.activeBackgroundColor
                document.body.style.cursor = 'crosshair'
                this.chart.cursor = 'crosshair'
                action(true)
            })
            this.chart.commandFunctions.push((event) => {
                if (event.altKey && event.code === keyCmd) {
                    if (this.chart.activeIcon) {
                        this.chart.activeIcon.style.backgroundColor = this.backgroundColor
                        group.setAttribute("fill", this.iconColor)
                        document.body.style.cursor = 'crosshair'
                        this.chart.cursor = 'crosshair'
                        action(false)
                    }
                    this.chart.activeIcon = elem
                    group.setAttribute("fill", this.activeIconColor)
                    elem.style.backgroundColor = this.activeBackgroundColor
                    document.body.style.cursor = 'crosshair'
                    this.chart.cursor = 'crosshair'
                    action(true)
                    return true
                }
            })
            return elem
        }

        onTrendSelect(toggle, ray = false) {
            let trendLine = {
                line: null,
                markers: null,
                data: null,
                from: null,
                to: null,
                ray: ray,
            }
            let firstTime = null
            let firstPrice = null
            let currentTime = null


            if (!toggle) {
                this.chart.chart.unsubscribeClick(this.chart.clickHandler)
                return
            }
            let crosshairHandlerTrend = (param) => {
                this.chart.chart.unsubscribeCrosshairMove(crosshairHandlerTrend)

                if (!this.makingDrawing) return

                let logical
                let lastCandleTime = this.chart.candleData[this.chart.candleData.length - 1].time
                currentTime = this.chart.chart.timeScale().coordinateToTime(param.point.x)
                if (!currentTime) {
                    let barsToMove = param.logical - this.chart.chart.timeScale().coordinateToLogical(this.chart.chart.timeScale().timeToCoordinate(lastCandleTime))
                    logical = barsToMove <= 0 ? null : this.chart.chart.timeScale().getVisibleLogicalRange()
                    currentTime = dateToChartTime(new Date(chartTimeToDate(this.chart.candleData[this.chart.candleData.length - 1].time).getTime() + (barsToMove * this.interval)), this.interval)
                } else if (chartTimeToDate(lastCandleTime).getTime() <= chartTimeToDate(currentTime).getTime()) {
                    logical = this.chart.chart.timeScale().getVisibleLogicalRange()
                }

                let currentPrice = this.chart.series.coordinateToPrice(param.point.y)


                if (!currentTime) return this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                trendLine.data = calculateTrendLine(firstTime, firstPrice, currentTime, currentPrice, this.interval, this.chart, ray)
                trendLine.from = trendLine.data[0].time
                trendLine.to = trendLine.data[trendLine.data.length - 1].time


                if (ray) logical = this.chart.chart.timeScale().getVisibleLogicalRange()


                trendLine.line.setData(trendLine.data)

                if (logical) {
                    this.chart.chart.applyOptions({handleScroll: true})
                    setTimeout(() => {
                        this.chart.chart.timeScale().setVisibleLogicalRange(logical)
                    }, 1)
                    setTimeout(() => {
                        this.chart.chart.applyOptions({handleScroll: false})
                    }, 50)
                }
                if (!ray) {
                    trendLine.markers = [
                        {time: firstTime, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1},
                        {time: currentTime, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1}
                    ]
                    trendLine.line.setMarkers(trendLine.markers)
                }
                setTimeout(() => {
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                }, 10);
            }

            this.chart.clickHandler = (param) => {
                if (!this.makingDrawing) {
                    this.makingDrawing = true
                    trendLine.line = this.chart.chart.addLineSeries({
                        lineWidth: 2,
                        lastValueVisible: false,
                        priceLineVisible: false,
                        crosshairMarkerVisible: false,
                        autoscaleInfoProvider: () => ({
                            priceRange: {
                                minValue: 1_000_000_000,
                                maxValue: 0,
                            },
                        }),
                    })
                    firstPrice = this.chart.series.coordinateToPrice(param.point.y)
                    firstTime = !ray ? this.chart.chart.timeScale().coordinateToTime(param.point.x) : this.chart.candleData[this.chart.candleData.length - 1].time
                    this.chart.chart.applyOptions({
                        handleScroll: false
                    })
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                } else {
                    this.chart.chart.applyOptions({
                        handleScroll: true
                    })
                    this.makingDrawing = false
                    trendLine.line.setMarkers([])
                    this.drawings.push(trendLine)
                    this.chart.chart.unsubscribeCrosshairMove(crosshairHandlerTrend)
                    this.chart.chart.unsubscribeClick(this.chart.clickHandler)
                    document.body.style.cursor = 'default'
                    this.chart.cursor = 'default'
                    this.chart.activeIcon.style.backgroundColor = this.backgroundColor
                    this.chart.activeIcon = null
                }
            }
            this.chart.chart.subscribeClick(this.chart.clickHandler)
        }

        onHorzSelect(toggle) {
            let clickHandlerHorz = (param) => {
                let price = this.chart.series.coordinateToPrice(param.point.y)
                let lineStyle = LightweightCharts.LineStyle.Solid
                let line = new HorizontalLine(this.chart, 'toolBox', price, null, 2, lineStyle, true)
                this.drawings.push(line)
                this.chart.chart.unsubscribeClick(clickHandlerHorz)
                document.body.style.cursor = 'default'
                this.chart.cursor = 'default'
                this.chart.activeIcon.style.backgroundColor = this.backgroundColor
                this.chart.activeIcon = null
            }
            this.chart.chart.subscribeClick(clickHandlerHorz)
        }

        onRaySelect(toggle) {
            this.onTrendSelect(toggle, true)
        }

        subscribeHoverMove() {
            let hoveringOver = null
            let x, y
            let hoverOver = (param) => {
                if (!param.point || this.makingDrawing) return
                this.chart.chart.unsubscribeCrosshairMove(hoverOver)
                x = param.point.x
                y = param.point.y

                this.drawings.forEach((drawing) => {
                    let boundaryConditional
                    let horizontal = false

                    if ('price' in drawing) {
                        horizontal = true
                        let priceCoordinate = this.chart.series.priceToCoordinate(drawing.price)
                        boundaryConditional = Math.abs(priceCoordinate - param.point.y) < 6
                    } else {
                        let trendData = param.seriesData.get(drawing.line);
                        if (!trendData) return
                        let priceCoordinate = this.chart.series.priceToCoordinate(trendData.value)
                        let timeCoordinate = this.chart.chart.timeScale().timeToCoordinate(trendData.time)
                        boundaryConditional = Math.abs(priceCoordinate - param.point.y) < 6 && Math.abs(timeCoordinate - param.point.x) < 6
                    }

                    if (boundaryConditional) {
                        if (hoveringOver === drawing) return

                        if (!horizontal && !drawing.ray) drawing.line.setMarkers(drawing.markers)
                        document.body.style.cursor = 'pointer'
                        document.addEventListener('mousedown', checkForClick)
                        document.addEventListener('mouseup', checkForRelease)
                        hoveringOver = drawing
                    } else if (hoveringOver === drawing) {
                        if (!horizontal && !drawing.ray) drawing.line.setMarkers([])
                        document.body.style.cursor = this.chart.cursor
                        hoveringOver = null
                    }
                })
                this.chart.chart.subscribeCrosshairMove(hoverOver)
            }
            let originalIndex
            let originalTime
            let originalPrice
            let mouseDown = false
            let clickedEnd = false
            let checkForClick = (event) => {
                //if (!hoveringOver) return
                mouseDown = true
                document.body.style.cursor = 'grabbing'
                this.chart.chart.applyOptions({
                    handleScroll: false
                })

                this.chart.chart.unsubscribeCrosshairMove(hoverOver)

                // let [x, y] = [event.clientX, event.clientY]
                // if ('topBar' in this.chart) y = y - this.chart.topBar.offsetHeight
                if ('price' in hoveringOver) {
                    originalPrice = hoveringOver.price
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerHorz)
                } else if (Math.abs(this.chart.chart.timeScale().timeToCoordinate(hoveringOver.data[0].time) - x) < 4 && !hoveringOver.ray) {
                    clickedEnd = 'first'
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                } else if (Math.abs(this.chart.chart.timeScale().timeToCoordinate(hoveringOver.data[hoveringOver.data.length - 1].time) - x) < 4 && !hoveringOver.ray) {
                    clickedEnd = 'last'
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                } else {
                    originalPrice = this.chart.series.coordinateToPrice(y)
                    originalTime = this.chart.chart.timeScale().coordinateToTime(x * this.chart.scale.width)
                    this.chart.chart.subscribeCrosshairMove(checkForDrag)
                }
                originalIndex = this.chart.chart.timeScale().coordinateToLogical(x)
                this.chart.chart.unsubscribeClick(checkForClick)
            }
            let checkForRelease = (event) => {
                mouseDown = false
                document.body.style.cursor = 'pointer'

                this.chart.chart.applyOptions({handleScroll: true})
                if (hoveringOver && 'price' in hoveringOver && hoveringOver.id !== 'toolBox') {
                    this.chart.callbackFunction(`on_horizontal_line_move__${this.chart.id}__${hoveringOver.id};;;${hoveringOver.price.toFixed(8)}`);
                }
                hoveringOver = null
                document.removeEventListener('mousedown', checkForClick)
                document.removeEventListener('mouseup', checkForRelease)
                this.chart.chart.subscribeCrosshairMove(hoverOver)
            }
            let checkForDrag = (param) => {
                if (!param.point) return
                this.chart.chart.unsubscribeCrosshairMove(checkForDrag)
                if (!mouseDown) return

                let priceAtCursor = this.chart.series.coordinateToPrice(param.point.y)

                let priceDiff = priceAtCursor - originalPrice
                let barsToMove = param.logical - originalIndex

                let startBarIndex = this.chart.candleData.findIndex(item => chartTimeToDate(item.time).getTime() === chartTimeToDate(hoveringOver.data[0].time).getTime())
                let endBarIndex = this.chart.candleData.findIndex(item => chartTimeToDate(item.time).getTime() === chartTimeToDate(hoveringOver.data[hoveringOver.data.length - 1].time).getTime())

                let startBar
                let endBar
                if (hoveringOver.ray) {
                    endBar = this.chart.candleData[startBarIndex + barsToMove]
                    startBar = hoveringOver.data[hoveringOver.data.length - 1]
                } else {
                    startBar = this.chart.candleData[startBarIndex + barsToMove]
                    endBar = endBarIndex === -1 ? null : this.chart.candleData[endBarIndex + barsToMove]
                }

                let endDate = endBar ? endBar.time : dateToChartTime(new Date(chartTimeToDate(hoveringOver.data[hoveringOver.data.length - 1].time).getTime() + (barsToMove * this.interval)), this.interval)
                let startDate = startBar.time
                let startValue = hoveringOver.data[0].value + priceDiff
                let endValue = hoveringOver.data[hoveringOver.data.length - 1].value + priceDiff
                hoveringOver.data = calculateTrendLine(startDate, startValue, endDate, endValue, this.interval, this.chart, hoveringOver.ray)

                let logical
                if (chartTimeToDate(hoveringOver.data[hoveringOver.data.length - 1].time).getTime() >= chartTimeToDate(this.chart.candleData[this.chart.candleData.length - 1].time).getTime()) {
                    logical = this.chart.chart.timeScale().getVisibleLogicalRange()
                }
                hoveringOver.from = hoveringOver.data[0].time
                hoveringOver.to = hoveringOver.data[hoveringOver.data.length - 1].time
                hoveringOver.line.setData(hoveringOver.data)
                if (logical) this.chart.chart.timeScale().setVisibleLogicalRange(logical)

                if (!hoveringOver.ray) {
                    hoveringOver.markers = [
                        {time: startDate, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1},
                        {time: endDate, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1}
                    ]
                    hoveringOver.line.setMarkers(hoveringOver.markers)
                }

                originalIndex = param.logical
                originalPrice = priceAtCursor
                this.chart.chart.subscribeCrosshairMove(checkForDrag)
            }
            let crosshairHandlerTrend = (param) => {
                if (!param.point) return
                this.chart.chart.unsubscribeCrosshairMove(crosshairHandlerTrend)
                if (!mouseDown) return

                let currentPrice = this.chart.series.coordinateToPrice(param.point.y)
                let currentTime = this.chart.chart.timeScale().coordinateToTime(param.point.x)

                let [firstTime, firstPrice] = [null, null]
                if (clickedEnd === 'last') {
                    firstTime = hoveringOver.data[0].time
                    firstPrice = hoveringOver.data[0].value
                } else if (clickedEnd === 'first') {
                    firstTime = hoveringOver.data[hoveringOver.data.length - 1].time
                    firstPrice = hoveringOver.data[hoveringOver.data.length - 1].value
                }

                let logical
                let lastCandleTime = this.chart.candleData[this.chart.candleData.length - 1].time
                if (!currentTime) {
                    let barsToMove = param.logical - this.chart.chart.timeScale().coordinateToLogical(this.chart.chart.timeScale().timeToCoordinate(lastCandleTime))
                    logical = barsToMove <= 0 ? null : this.chart.chart.timeScale().getVisibleLogicalRange()
                    currentTime = dateToChartTime(new Date(chartTimeToDate(this.chart.candleData[this.chart.candleData.length - 1].time).getTime() + (barsToMove * this.interval)), this.interval)
                } else if (chartTimeToDate(lastCandleTime).getTime() <= chartTimeToDate(currentTime).getTime()) {
                    logical = this.chart.chart.timeScale().getVisibleLogicalRange()
                }

                hoveringOver.data = calculateTrendLine(firstTime, firstPrice, currentTime, currentPrice, this.interval, this.chart)
                hoveringOver.line.setData(hoveringOver.data)

                hoveringOver.from = hoveringOver.data[0].time
                hoveringOver.to = hoveringOver.data[hoveringOver.data.length - 1].time
                if (logical) this.chart.chart.timeScale().setVisibleLogicalRange(logical)

                hoveringOver.markers = [
                    {time: firstTime, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1},
                    {time: currentTime, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1}
                ]
                hoveringOver.line.setMarkers(hoveringOver.markers)

                setTimeout(() => {
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                }, 10);
            }
            let crosshairHandlerHorz = (param) => {
                if (!param.point) return
                this.chart.chart.unsubscribeCrosshairMove(crosshairHandlerHorz)
                if (!mouseDown) return
                hoveringOver.updatePrice(this.chart.series.coordinateToPrice(param.point.y))
                setTimeout(() => {
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerHorz)
                }, 10)
            }
            this.chart.chart.subscribeCrosshairMove(hoverOver)
        }

        renderDrawings() {
            //let logical = this.chart.chart.timeScale().getVisibleLogicalRange()
            this.drawings.forEach((item) => {
                if ('price' in item) return
                let startDate = dateToChartTime(new Date(Math.round(chartTimeToDate(item.from).getTime() / this.interval) * this.interval), this.interval)
                let endDate = dateToChartTime(new Date(Math.round(chartTimeToDate(item.to).getTime() / this.interval) * this.interval), this.interval)
                let data = calculateTrendLine(startDate, item.data[0].value, endDate, item.data[item.data.length - 1].value, this.interval, this.chart, item.ray)
                if (data.length !== 0) item.data = data
                item.line.setData(data)
            })
            //this.chart.chart.timeScale().setVisibleLogicalRange(logical)
        }

        clearDrawings() {
            this.drawings.forEach((item) => {
                if ('price' in item) this.chart.series.removePriceLine(item.line)
                else this.chart.chart.removeSeries(item.line)
            })
            this.drawings = []
        }
    }

    window.ToolBox = ToolBox
}