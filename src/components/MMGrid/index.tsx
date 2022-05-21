import React, { memo, useEffect, useRef, useState } from 'react'
import { uniqueId } from 'lodash';
import { baseComponents, Component, baseRenderComponent } from '../baseMapping';
import style from './index.module.less'
import Grid from './Grid';
import Cell, { ICell } from './Cell';
import { COMPONENT_ELEMENT_ITEM_ID_PREFIX, GRID_PLACEHOLDER } from '@/pages/utils';

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

export const dragID = 'mmDroppablePlaceholder'

const defaultLayout = [
  { middle: true, width: 1, height: 2 },
  { middle: true, width: 2, height: 1 },
  { middle: true, width: 2, height: 1 },
  { middle: true },
  { middle: true },
  { middle: true },
]

function MMGrid(props: MMBannerProps) {
  const { gutter = 0, vGutter = 0, colCount = 3, rowCount = 3, id, onEvent, isEdit, children, onRemoteComponentLoad, layout = defaultLayout } = props
  const [cells, setCells] = useState<React.ReactElement[]>([])
  const grid = useRef<HTMLDivElement>(null)
  const data = useRef({ index: -1 })

  const reset = () => {
    const children = grid.current?.children as any
    Array.from(children).forEach((node: any) => {
      if (!node?.children) return
      const _c = Array.from(node?.children) as any
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
      // target?.classList.add(style.dragging)
      onEvent?.(id, ON_GRID_SELECT_ITEM, { index })
    }
  }
  const getItem = (index: number) => {
    let columnElement: string | React.ReactNode
    const item = children ? children[index] : null
    if (item && item.name !== GRID_PLACEHOLDER) {
      columnElement = baseRenderComponent({ isChild: true, component: item, index, mapping: baseComponents, onRemoteComponentLoad, onEvent, isEdit })
    }
    if (isEdit) {
      const _id = `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${index}_placeholder`
      return <div
        className={style.mmDroppablePlaceholder}
        data-index={index}
        id={_id}
        data-id={_id}
      >{columnElement || `Column-${index + 1}`}</div>
    }
    return <>{columnElement}</>
  }

  useEffect(() => {
    const _cells: React.ReactElement[] = []
    layout.forEach((_, index) => {
      const id = uniqueId()
      _cells.push(<Cell
        onClick={(e) => {
          isEdit && onClick(e, index)
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