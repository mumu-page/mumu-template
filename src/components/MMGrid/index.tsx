import React, { memo, useEffect, useRef, useState } from 'react'
import { baseComponents, Component, baseRenderComponent } from '../baseMapping';
import Grid from './Grid';
import Cell from './Cell';
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
  /* 布局 */
  children?: Component[]
}

function MMGrid(props: MMBannerProps) {
  const { gutter = 0, vGutter = 0, colCount = 3, rowCount = 3, onEvent, isEdit, children = [], onRemoteComponentLoad } = props
  const [cells, setCells] = useState<React.ReactElement[]>([])
  const grid = useRef<HTMLDivElement>(null)

  const getItem = (cell: Component, index: number) => {
    let cellElement: string | React.ReactNode

    const childItem = cell?.props?.children?.[0]
    if (childItem) {
      cellElement = baseRenderComponent({
        isChild: true,
        component: childItem,
        index,
        mapping: baseComponents,
        onRemoteComponentLoad,
        onEvent,
        isEdit
      })
    } else if(isEdit) {
      cellElement = `Column-${index + 1}`
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
        width={+_.props.width}
        height={+_.props.height}
        middle={!!_.props.middle}
        className={isEdit && style.mmDroppablePlaceholder}
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