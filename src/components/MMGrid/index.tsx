import React, { memo, useEffect, useRef, useState } from 'react'
import { baseComponents, Component, baseRenderComponent } from '../baseMapping';
import Grid from './Grid';
import Cell, { ICell } from './Cell';
import { COMPONENT_ELEMENT_ITEM_ID_PREFIX, GRID_PLACEHOLDER } from '@/pages/utils';
import { uuid } from '@/utils/utils';
import style from './index.module.less'

type ChildItem = (ICell & { props: { children: Component[] } })

interface MMBannerProps {
  /* 组件ID */
  id?: string
  /* 水平间距 */
  gutter?: number
  /* 垂直间距 */
  vGutter?: number
  /* 列数 */
  colCount?: number
  /* 行数 */
  rowCount?: number
  /* 自定义事件 */
  onEvent: (id: string | undefined | null, type: string, data?: any) => void
  onRemoteComponentLoad: ({ config, name, js, css, schema }: any) => void
  /* 是否编辑 */
  isEdit?: boolean
  /* 布局 */
  children?: ChildItem[]
}

const defaultLayout = [
  { middle: true, width: 1, height: 2, props: { children: [] }, id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}` },
  { middle: true, width: 2, height: 1, props: { children: [] }, id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}` },
  { middle: true, width: 2, height: 1, props: { children: [] }, id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}` },
  { middle: true, props: { children: [] }, id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}` },
  { middle: true, props: { children: [] }, id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}` },
  { middle: true, props: { children: [] }, id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}` },
]

function MMGrid(props: MMBannerProps) {
  const { gutter = 0, vGutter = 0, colCount = 3, rowCount = 3, onEvent, isEdit, children = defaultLayout, onRemoteComponentLoad } = props
  const [cells, setCells] = useState<React.ReactElement[]>([])
  const grid = useRef<HTMLDivElement>(null)

  const getItem = (cell: ChildItem, index: number) => {
    let cellElement: string | React.ReactNode
    if (cell.props?.children?.[0]) {
      cellElement = baseRenderComponent({
        isChild: true,
        component: cell.props.children[0],
        index,
        mapping: baseComponents,
        onRemoteComponentLoad,
        onEvent,
        isEdit
      })
    }
    if (isEdit) {
      cellElement = <div
      >{cellElement || `Column-${index + 1}`}</div>
    }
    return <>{cellElement}</>
  }

  useEffect(() => {
    if (!Array.isArray(children)) return
    const _cells: React.ReactElement[] = []
    children.forEach((_, index) => {
      _cells.push(<Cell
        key={_.id}
        id={_.id}
        dataId={_.id}
        width={_.width}
        height={_.height}
        middle={_.middle}
        className={isEdit ? style.mmDroppablePlaceholder : ''}
      >
        {getItem(_, index)}
      </Cell>)
    })
    setCells(_cells)
  }, [colCount, rowCount, children])

  return (
    <div
      className={style.mmGrid}>
      <Grid
        ref={grid}
        flow="row dense"
        columns={colCount}
        minRowHeight="100px"
        columnGap={gutter}
        rowGap={vGutter}>
        {cells}
      </Grid>
    </div>
  )
}

MMGrid.componentName = 'MMGrid'

export default memo(MMGrid)