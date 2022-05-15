import React from 'react'
import {Col, Divider, Row} from "antd";
import style from './index.module.less'

interface MMBannerProps {
  /* 水平间距 */
  gutterKey?: number
  /* 垂直间距 */
  vGutterKey?: number
  /* 列数 */
  colCountKey?: number
}

type Item = { [key: number]: number }

const gutters = {} as Item;
const vGutters = {} as Item;
const colCounts = {} as Item;

[8, 16, 24, 32, 40, 48].forEach((value, i) => {
  gutters[i] = value;
});
[8, 16, 24, 32, 40, 48].forEach((value, i) => {
  vGutters[i] = value;
});
[2, 3, 4, 6, 8, 12].forEach((value, i) => {
  colCounts[i] = value;
});

const Icon = () => <svg
  viewBox="0 0 1024 1024" height="1em" width="1em"
  fill="currentColor" focusable="false"
  aria-hidden="true">
  <g stroke="none" strokeWidth="1" fillRule="evenodd">
    <rect transform="translate(354.000000, 512.000000) rotate(90.000000) translate(-354.000000, -512.000000) " x="-56"
          y="472" width="820" height="80" rx="40"/>
    <path
      d="M864,62 L160,62 C71.63444,62 0,133.63444 0,222 L0,802 C0,890.36556 71.63444,962 160,962 L864,962 C952.36556,962 1024,890.36556 1024,802 L1024,222 C1024,133.63444 952.36556,62 864,62 Z M160,142 L864,142 C908.18278,142 944,177.81722 944,222 L944,802 C944,846.18278 908.18278,882 864,882 L160,882 C115.81722,882 80,846.18278 80,802 L80,222 C80,177.81722 115.81722,142 160,142 Z"
      fillRule="nonzero"/>
    <rect transform="translate(670.000000, 512.000000) rotate(90.000000) translate(-670.000000, -512.000000) " x="260"
          y="472" width="820" height="80" rx="40"/>
  </g>
</svg>

function MMGrid(props: MMBannerProps) {
  const {gutterKey = 1, vGutterKey = 1, colCountKey = 2} = props
  const cols = [];
  const colCount = colCounts[colCountKey];
  for (let i = 0; i < colCount; i++) {
    cols.push(
      <Col key={i.toString()} span={24 / colCount}>
        <div className={style.mmDroppablePlaceholder}>Column</div>
      </Col>,
    );
  }

  return (
    <div className={style.mmGrid}>
      <Row gutter={[gutters[gutterKey], vGutters[vGutterKey]]}>{cols}</Row>
      <Divider className={style.divider} plain dashed>
        <a className={style.add}><Icon/><span className={style.text}>添加网格列</span></a>
      </Divider>
    </div>
  )
}

MMGrid.componentName = 'MMGrid'

export default MMGrid