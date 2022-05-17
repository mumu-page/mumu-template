import React, { useEffect, useRef, useState } from 'react'
import { Col, Divider, Row } from "antd";
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
  onEvent?: (id: string | undefined, type: string, data?: any) => void
  /* 是否编辑 */
  isEdit?: boolean
}

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

const dragID = 'mmDroppablePlaceholder'

function MMGrid(props: MMBannerProps) {
  const { gutter = 0, vGutter = 0, colCount = 3, rowCount = 1, id, onEvent, isEdit } = props
  const [cols, setCols] = useState<React.ReactElement[]>([])
  const grid = useRef<HTMLDivElement>(null)
  const data = useRef({ index: 0 })

  useEffect(() => {
    let _cols: React.ReactElement[] = []
    Array(rowCount).fill(1).forEach(() => {
      Array(colCount).fill(1).forEach((_, index) => {
        const id = index
        _cols.push(<Col key={id} span={Math.round(24 / colCount)}>
          <div className={`${isEdit ? style.mmDroppablePlaceholder : ''}`} data-index={index} data-id={dragID}>Column</div>
        </Col>)
      })
    })
    setCols(_cols)
  }, [colCount, rowCount])

  const onAddRow = () => {
    onEvent?.(id, 'onAddRow')
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

  const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const target = e.target as HTMLElement | null
    const id = target?.dataset.id
    if (id === dragID) {

    }
  }
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    reset()
    onEvent?.(id, 'onDragOver', { index: data.current.index })
  }
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null
    const id = target?.dataset.id
    const index = target?.dataset.index
    reset()
    if (id === dragID) {
      target?.classList.add(style.dragging)
      if (index) data.current.index = Number(index)
    }
  }
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {

  }

  return (
    <div
      onClick={isEdit ? onClick : undefined}
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