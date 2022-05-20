import React, { memo, useEffect, useRef, useState } from 'react'
import { Divider, message } from "antd";
import config from './package.json'
import { uniqueId } from 'lodash';
import { gridComponents, Component, gridRenderComponent } from '../gridMapping';
import style from './index.module.less'
import Grid from './Grid';
import Cell, { ICell } from './Cell';

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
  children?: Component[]
  layout?: ICell[]
}

/** 网格布局组件的添加行事件 */
export const ON_GRID_ADD_ROW = 'onGridAddRow'
/** 网格布局组件的选中行事件 */
export const ON_GRID_SELECT_ITEM = 'onGridSelectItem'
/** 网格布局组件的拖放鼠标松开事件 */
export const ON_GRID_DROP = 'onGridDrop'
/** 网格布局组件的拖放鼠标移开事件 */
export const ON_GRID_DRAG_LEAVE = 'onDragLeave'
/** 网格布局组件的拖放鼠标移动到元素上的事件 */
export const ON_GRID_DRAG_OVER = 'onDragOver'

const Icon = () => <svg
  viewBox="0 0 1024 1024" height="1em" width="1em"
  fill="currentColor" focusable="false"
  aria-hidden="true">
  <g stroke="none" strokeWidth="1" fillRule="evenodd">
    <rect transform="translate(354.000000, 512.000000) rotate(90.000000) translate(-354.000000, -512.000000) " x="-56"
      y="472" width="820" height="80" rx="40" />
    <path
      d="M864,62 L160,62 C71.63444,62 0,133.63444 0,222 L0,802 C0,890.36556 71.63444,962 160,962 L864,962 C952.36556,962 1024,890.36556 1024,802 L1024,222 C1024,133.63444 952.36556,62 864,62 Z M160,142 L864,142 C908.18278,142 944,177.81722 944,222 L944,802 C944,846.18278 908.18278,882 864,882 L160,882 C115.81722,882 80,846.18278 80,802 L80,222 C80,177.81722 115.81722,142 160,142 Z"
      fillRule="nonzero" />
    <rect transform="translate(670.000000, 512.000000) rotate(90.000000) translate(-670.000000, -512.000000) " x="260"
      y="472" width="820" height="80" rx="40" />
  </g>
</svg>

export const dragID = 'mmDroppablePlaceholder'

const defaultLayout = [
  { middle: true, width: 1, height: 2 },
  { middle: true, width: 2, height: 1 },
  { middle: true, width: 2, height: 1 },
  { middle: true },
  { middle: true },
]

function MMGrid(props: MMBannerProps) {
  const { gutter = 0, vGutter = 0, colCount = 3, rowCount = 1, id, onEvent, isEdit, children, onRemoteComponentLoad, layout = defaultLayout } = props
  const [cells, setCells] = useState<React.ReactElement[]>([])
  const grid = useRef<HTMLDivElement>(null)
  const data = useRef({ index: -1 })

  const onAddCell = () => {
    if (rowCount >= config.schema.properties.rowCount.max) {
      message.info(`不能再添加啦~`)
      return
    }
    onEvent?.(id, ON_GRID_ADD_ROW)
  }
  const reset = () => {
    const childNodes = grid.current?.childNodes as any
    Array.from(childNodes).forEach((node: any) => {
      if (!node?.childNodes) return
      const _c = Array.from(node?.childNodes) as any
      if (_c) {
        _c?.[0]?.classList.remove(style.dragging)
      }
    })
  }
  const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    const target = e.target as HTMLElement | null
    const _id = target?.dataset.id
    if (_id === dragID) {
      reset()
      target?.classList.add(style.dragging)
      onEvent?.(id, ON_GRID_SELECT_ITEM, { index })
    }
  }
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    reset()
    const target = e.target as HTMLElement | null
    const dragData = e?.dataTransfer?.getData('text/plain')
    const _id = target?.dataset.id
    const index = target?.dataset.index
    if (_id === dragID) {
      if (!index) return
      onEvent?.(id, ON_GRID_DROP, { index, dragData })
    }
  }
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const target = e.target as HTMLElement | null
    const _id = target?.dataset.id
    const index = target?.dataset.index
    reset()
    if (_id === dragID) {
      target?.classList.add(style.dragging)
      if (!index) return
      data.current.index = Number(index)
      onEvent?.(id, ON_GRID_DRAG_OVER)
    } else {
      data.current.index = -1
      onEvent?.(id, ON_GRID_DRAG_LEAVE)
    }
  }
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    reset()
    onEvent?.(id, ON_GRID_DRAG_LEAVE)
  }
  const getItem = (index: number) => {
    let columnElement: string | React.ReactNode
    const item = children ? children[index] : null
    if (item && item.name !== 'grid-placeholder') {
      columnElement = gridRenderComponent(item, gridComponents, onRemoteComponentLoad, onEvent, isEdit)
    }
    if (isEdit) {
      return <div
        className={style.mmDroppablePlaceholder}
        data-index={index}
        data-id={dragID}>{columnElement || `Column-${index}`}</div>
    }
    return <>{columnElement}</>
  }

  useEffect(() => {
    const _cells: React.ReactElement[] = []
    layout.forEach((_, index) => {
      const id = uniqueId()
      _cells.push(<Cell
        onClick={(e) => {
          onClick(e, index)
        }}
        key={id}
        width={_.width}
        height={_.height}
        middle={_.middle}
      >
        {getItem(index)}
      </Cell>)
    })
    setCells(_cells)
  }, [colCount, rowCount, children, layout])

  return (
    <div
      onDrop={isEdit ? onDrop : undefined}
      onDragOver={isEdit ? onDragOver : undefined}
      onDragLeave={isEdit ? onDragLeave : undefined}
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
      {isEdit && <Divider className={style.divider} plain dashed>
        <a className={style.add}><Icon /><span className={style.text} onClick={onAddCell}>添加网格单元</span></a>
      </Divider>}
    </div>
  )
}

MMGrid.componentName = 'MMGrid'

export default memo(MMGrid)