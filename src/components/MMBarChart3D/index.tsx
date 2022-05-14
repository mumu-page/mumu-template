import React from 'react'
//导入折线图
import 'echarts/lib/chart/line';  //折线图是line,饼图改为pie,柱形图改为bar
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/markPoint';
import ReactECharts from 'echarts-for-react';
import {getOption} from "./util";

interface MMBarChart3DProps {
  option?: object
}

function MMBarChart3D(props: MMBarChart3DProps) {
  const {option = getOption} = props

  return (
    <ReactECharts option={option} theme="Imooc" style={{height: '400px'}}/>
  )
}

MMBarChart3D.componentName = 'MMBarChart3D'

export default MMBarChart3D