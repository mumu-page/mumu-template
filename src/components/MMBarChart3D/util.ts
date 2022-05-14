import * as echarts from 'echarts'

const offsetX = 20;
const offsetY = 10;
// 绘制左侧面
const CubeLeft = echarts.graphic.extendShape({
  shape: {
    x: 0,
    y: 0,
  },
  buildPath: function (ctx, shape) {
    // 会canvas的应该都能看得懂，shape是从custom传入的
    const xAxisPoint = shape.xAxisPoint;
    // console.log(shape);
    const c0 = [shape.x, shape.y];
    const c1 = [shape.x - offsetX, shape.y - offsetY];
    const c2 = [xAxisPoint[0] - offsetX, xAxisPoint[1] - offsetY];
    const c3 = [xAxisPoint[0], xAxisPoint[1]];
    ctx.moveTo(c0[0], c0[1])?.lineTo(c1[0], c1[1]).lineTo(c2[0], c2[1]).lineTo(c3[0], c3[1]).closePath();
  },
});
// 绘制右侧面
const CubeRight = echarts.graphic.extendShape({
  shape: {
    x: 0,
    y: 0,
  },
  buildPath: function (ctx, shape) {
    const xAxisPoint = shape.xAxisPoint;
    const c1 = [shape.x, shape.y];
    const c2 = [xAxisPoint[0], xAxisPoint[1]];
    const c3 = [xAxisPoint[0] + offsetX, xAxisPoint[1] - offsetY];
    const c4 = [shape.x + offsetX, shape.y - offsetY];
    ctx.moveTo(c1[0], c1[1])?.lineTo(c2[0], c2[1]).lineTo(c3[0], c3[1]).lineTo(c4[0], c4[1]).closePath();
  },
});
// 绘制顶面
const CubeTop = echarts.graphic.extendShape({
  shape: {
    x: 0,
    y: 0,
  },
  buildPath: function (ctx, shape) {
    const c1 = [shape.x, shape.y];
    const c2 = [shape.x + offsetX, shape.y - offsetY]; //右点
    const c3 = [shape.x, shape.y - offsetX];
    const c4 = [shape.x - offsetX, shape.y - offsetY];
    ctx.moveTo(c1[0], c1[1])?.lineTo(c2[0], c2[1]).lineTo(c3[0], c3[1]).lineTo(c4[0], c4[1]).closePath();
  },
});
// 注册三个面图形
echarts.graphic.registerShape('CubeLeft', CubeLeft);
echarts.graphic.registerShape('CubeRight', CubeRight);
echarts.graphic.registerShape('CubeTop', CubeTop);

const VALUE = [100, 200, 300, 400, 300, 200, 100];

export const getOption = {
  backgroundColor: '#012366',
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
    formatter: function (params: any[], ticket: any, callback: any) {
      const item = params[1];
      return item.name + ' : ' + item.value;
    },
  },
  grid: {
    left: '10%',
    right: '10%',
    top: '15%',
    bottom: '10%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['1001', '1002', '1003', '1004', '1005', '1006', '1007'],
    axisLine: {
      show: true,
      lineStyle: {
        width: 2,
        color: '#2B7BD6',
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      fontSize: 14,
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      show: true,
      lineStyle: {
        width: 2,
        color: '#2B7BD6',
      },
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#153D7D',
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      fontSize: 14,
    },
    // boundaryGap: ['20%', '20%'],
  },
  series: [
    {
      type: 'custom',
      renderItem: (params: any, api: { coord: (arg0: any[]) => any; value: (arg0: number) => any; }) => {
        const location = api.coord([api.value(0), api.value(1)]);
        return {
          type: 'group',
          children: [
            {
              type: 'CubeLeft',
              shape: {
                api,
                xValue: api.value(0),
                yValue: api.value(1),
                x: location[0],
                y: location[1],
                xAxisPoint: api.coord([api.value(0), 0]),
              },
              style: {
                fill: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  {
                    offset: 0,
                    color: '#33BCEB',
                  },
                  {
                    offset: 1,
                    color: '#337CEB',
                  },
                ]),
              },
            },
            {
              type: 'CubeRight',
              shape: {
                api,
                xValue: api.value(0),
                yValue: api.value(1),
                x: location[0],
                y: location[1],
                xAxisPoint: api.coord([api.value(0), 0]),
              },
              style: {
                fill: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  {
                    offset: 0,
                    color: '#28A2CE',
                  },
                  {
                    offset: 1,
                    color: '#1A57B7',
                  },
                ]),
              },
            },
            {
              type: 'CubeTop',
              shape: {
                api,
                xValue: api.value(0),
                yValue: api.value(1),
                x: location[0],
                y: location[1],
                xAxisPoint: api.coord([api.value(0), 0]),
              },
              style: {
                fill: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  {
                    offset: 0,
                    color: '#43C4F1',
                  },
                  {
                    offset: 1,
                    color: '#28A2CE',
                  },
                ]),
              },
            },
          ],
        };
      },
      data: VALUE,
    },
    {
      type: 'bar',
      label: {
        normal: {
          show: true,
          position: 'top',
          formatter: (e: { value: string; }) => {
            return e.value + '次';
            /*console.log(e)
            switch (e.name) {
                case '1001':
                    return e.value;
                case '1002':
                    return VALUE[1];
                case '1003':
                    return VALUE[2];
            }*/
          },
          fontSize: 16,
          color: '#43C4F1',
          offset: [0, -25],
        },
      },
      itemStyle: {
        color: 'transparent',
      },
      tooltip: {},
      data: VALUE,
    },
  ],
};
