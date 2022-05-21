import React, { memo, useEffect, useRef, useState } from 'react'
import { baseComponents, Component, baseRenderComponent } from '../baseMapping';
import Grid from './Grid';
import Cell, { ICell } from './Cell';
import { COMPONENT_ELEMENT_ITEM_ID_PREFIX, GRID_PLACEHOLDER } from '@/pages/utils';
import { uuid } from '@/utils/utils';
import style from './index.module.less'

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

  const getItem = (index: number) => {
    let cellElement: string | React.ReactNode
    const item = children ? children[index] : null
    if (item && item.name !== GRID_PLACEHOLDER) {
      cellElement = baseRenderComponent({ isChild: true, component: item, index, mapping: baseComponents, onRemoteComponentLoad, onEvent, isEdit })
    }
    if (isEdit) {
      const _id = item?.id || `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${index}_placeholder`
      return <div
        className={style.mmDroppablePlaceholder}
        data-index={index}
        id={_id}
        data-id={_id}
      >{cellElement || `Column-${index + 1}`}</div>
    }
    return <>{cellElement}</>
  }

  useEffect(() => {
    const _cells: React.ReactElement[] = []
    layout.forEach((_, index) => {
      const id = uuid()
      _cells.push(<Cell
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