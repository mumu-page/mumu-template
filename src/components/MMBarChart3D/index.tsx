import React, {useCallback, useEffect, useRef} from 'react'
// import style from "./index.module.less";
// @ts-ignore
import {BorderBox1} from '@jiaminghi/data-view-react'
import {getOption} from "./util";
import * as eCharts from 'echarts'
import {ECBasicOption} from "echarts/types/dist/shared";
import {EChartsType} from "echarts/types/dist/echarts";

interface ComponentProps {
  color: string[]
  backgroundColor: string
  option?: ECBasicOption
  padding?: number
  height?: number
}

function MMBarChart3D(props: ComponentProps) {
  const {color, backgroundColor, option = getOption, padding = 30, height = 400} = props
  const ele = useRef<HTMLDivElement>(null)
  const chart = useRef<EChartsType>(null)

  const onResize = useCallback(() => {
    chart.current?.resize()
  }, [])

  useEffect(() => {
    if (!ele.current) return
    const _chart = eCharts.init(ele.current)
    // @ts-ignore
    chart.current = _chart
    _chart.setOption(option)
    const resizeObserverSize = new ResizeObserver(onResize)
    resizeObserverSize.observe(ele.current)
    return () => {
      resizeObserverSize.disconnect()
    }
  }, [])

  return (
    <BorderBox1 color={color} backgroundColor={backgroundColor}>
      <div ref={ele} style={{padding, height}}/>
    </BorderBox1>
  )
}

MMBarChart3D.componentName = 'MMBarChart3D'

export default MMBarChart3D