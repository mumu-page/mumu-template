import React, { useEffect, useRef, useState } from 'react'
import { Col, Divider, Row, message } from "antd";
import config from './package.json'
import { uniqueId } from 'lodash';
import style from './index.module.less'
import { gridComponents, Component, gridRenderComponent } from '../gridMapping';
/**
 * 转换行、列为索引 row,col ==> index
 * @param data 
 * @param colCount 
 * @param row 
 * @param col 
 * @returns 
 */
function getIndexByRowAndCol(data: any[], colCount: number, row: number, col: number) {
  const map = {} as any
  let _row = 0
  data.forEach((_, index) => {
    const _col = index % colCount
    if (index < colCount) {
      _row = 0
    } else if (_col === 0) {
      _row++
    }
    map[`${_row},${_col}`] = index
  })
  const index = map[`${row},${col}`]
  return typeof index === 'number' ? index : -1
}

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

function MMGrid(props: MMBannerProps) {
  const { gutter = 0, vGutter = 0, colCount = 3, rowCount = 1, id, onEvent, isEdit, children, onRemoteComponentLoad } = props
  const [cols, setCols] = useState<React.ReactElement[]>([])
  const grid = useRef<HTMLDivElement>(null)
  const data = useRef({ row: -1, col: -1 })

  const onAddRow = () => {
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
  const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, row: number, col: number) => {
    const target = e.target as HTMLElement | null
    const _id = target?.dataset.id
    if (_id === dragID) {
      reset()
      target?.classList.add(style.dragging)
      onEvent?.(id, ON_GRID_SELECT_ITEM, { index: getIndexByRowAndCol(Array(rowCount * colCount).fill(1), colCount, row, col) })
    }
  }
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    reset()
    const target = e.target as HTMLElement | null
    const dragData = e?.dataTransfer?.getData('text/plain')
    const _id = target?.dataset.id
    const row = target?.dataset.row
    const col = target?.dataset.col
    if (_id === dragID) {
      if (!row || !col) return
      onEvent?.(id, ON_GRID_DROP, { index: getIndexByRowAndCol(Array(rowCount * colCount).fill(1), colCount, +row, +col), dragData })
    }
  }
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const target = e.target as HTMLElement | null
    const _id = target?.dataset.id
    const row = target?.dataset.row
    const col = target?.dataset.col
    reset()
    if (_id === dragID) {
      target?.classList.add(style.dragging)
      if (!row || !col) return
      data.current.row = Number(row)
      data.current.col = Number(col)
      onEvent?.(id, ON_GRID_DRAG_OVER)
    } else {
      data.current.row = -1
      data.current.col = -1
      onEvent?.(id, ON_GRID_DRAG_LEAVE)
    }
  }
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    reset()
    onEvent?.(id, ON_GRID_DRAG_LEAVE)
  }
  const getItem = (row: number, col: number) => {
    const index = getIndexByRowAndCol(Array(rowCount * colCount).fill(1), colCount, +row, +col)
    let columnElement: string | React.ReactNode = 'Column'
    const item = children ? children[index] : null
    if (item && item.name !== 'grid-placeholder') {
      columnElement = gridRenderComponent(item, gridComponents, onRemoteComponentLoad, onEvent, isEdit)
    }
    if (isEdit) {
      return <div
        className={style.mmDroppablePlaceholder}
        data-row={row}
        data-col={col}
        data-id={dragID}>{columnElement}</div>
    }
    return <>{columnElement}</>
  }

  useEffect(() => {
    const _cols: React.ReactElement[] = []
    Array(rowCount).fill(1).forEach((_, row) => {
      Array(colCount).fill(1).forEach((_, col) => {
        const id = uniqueId()
        _cols.push(<Col
          onClick={(e) => {
            onClick(e, row, col)
          }}
          key={id}
          span={Math.round(24 / colCount)}>
          {getItem(row, col)}
        </Col>)
      })
    })
    setCols(_cols)
  }, [colCount, rowCount, children])

  return (
    <div
      onDrop={isEdit ? onDrop : undefined}
      onDragOver={isEdit ? onDragOver : undefined}
      onDragLeave={isEdit ? onDragLeave : undefined}
      className={style.mmGrid}>
      <Row ref={grid} gutter={[gutter, vGutter]}>{cols}</Row>
      <Divider className={style.divider} plain dashed>
        <a className={style.add}><Icon /><span className={style.text} onClick={onAddRow}>添加网格列</span></a>
      </Divider>
    </div>
  )
}

MMGrid.componentName = 'MMGrid'

export default MMGrid