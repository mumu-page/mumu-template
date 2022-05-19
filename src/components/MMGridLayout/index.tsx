import React, { memo, useCallback, useEffect, useRef } from 'react'
import _ from "lodash";
import RGL, { WidthProvider, Layout } from "react-grid-layout";
import { useImmer } from 'use-immer';
import { Component, gridComponents, gridRenderComponent } from '../gridMapping';
import { Divider } from 'antd';
import style from './index.module.less'

const GridLayout = WidthProvider(RGL);

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
  layout?: RGL.Layout[]
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

function generateLayout(colCount: number, rowCount: number, isStatic: boolean = false) {
  let _y = 0
  return _.map(new Array(colCount * rowCount).fill(1), function (_, i) {
    const _x = (i * 4) % (colCount * 4)
    if (_x === 0 && i !== 0) _y = _y = _y + 1
    return {
      x: _x,
      y: _y,
      w: 4,
      h: 1,
      i: i.toString(),
      static: isStatic
    };
  });
}

export const dragID = 'mmDroppablePlaceholder'

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
/** 网格布局组件的布局改变事件 */
export const ON_GRID_LAYOUT_CHANGE = 'onLayoutChange'

interface State {
  mounted: boolean,
}

function MMGridLayout(props: MMBannerProps) {
  const { gutter = 0, vGutter = 0, colCount = 3, rowCount = 3, id, onEvent, isEdit, children, onRemoteComponentLoad } = props
  const [state, setState] = useImmer<State>({
    mounted: false,
  })
  const defaultLayout = generateLayout(colCount, rowCount, !isEdit)
  const { layout = defaultLayout } = props
  const grid = useRef<HTMLDivElement>(null)
  const data = useRef({ index: -1 })
  const rowHeight = 60
  const generateDOM = () => {
    return _.map(layout, function (_, i) {
      return (
        <div key={i}>
          {getItem(+i)}
        </div>
      );
    });
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
        data-id={dragID}>{columnElement || <p>Column-{index}</p>}</div>
    }
    return <>{columnElement}</>
  }

  const onLayoutChange = (layout: RGL.Layout[]) => {
    onEvent(id, ON_GRID_LAYOUT_CHANGE, { ...props, layout })
  }

  const onAddCol = () => {
    onEvent?.(id, ON_GRID_ADD_ROW, {
      ...props, layout: [...layout, {
        i: "n" + colCount * rowCount + 1,
        x: (layout.length * 2) % (colCount * 4),
        y: Infinity, // puts it at the bottom
        w: Infinity,
        h: 1
      }]
    })
  }

  const findMaxHeight = () => {
    const childNodes = (grid.current as any)?.childNodes?.[0]?.childNodes as any
    try {
      Array.from(childNodes).forEach((node: any, index: number) => {
        if (!node?.childNodes) return
        const com = node?.childNodes?.[0]?.childNodes?.[0]
        const height = com?.getBoundingClientRect().height || 0
        if (height > rowHeight) {
          const multiple = Math.ceil(height / 60)
          layout.forEach((item, i) => {
            if (index === i) {
              item.h = multiple
            }
          })
          onEvent(id, ON_GRID_LAYOUT_CHANGE, { ...props, layout })
        }
      })
    } catch (error) {
      console.log(error);
    }
  }

  const reset = () => {
    const childNodes = (grid.current as any)?.childNodes?.[0]?.childNodes as any
    try {
      Array.from(childNodes).forEach((node: any) => {
        if (!node?.childNodes) return
        const _c = Array.from(node?.childNodes) as any
        if (_c) {
          _c?.[0]?.classList.remove(style.dragging)
        }
      })
    } catch (error) {
      console.log(error);
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
      onEvent?.(id, ON_GRID_DROP, { index, dragData })
      requestIdleCallback(() => {
        findMaxHeight()
      })
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

  useEffect(() => {
    onEvent(id, ON_GRID_LAYOUT_CHANGE, { ...props, layout: generateLayout(colCount, rowCount, !isEdit) })
  }, [colCount, rowCount])

  const onResize = (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout) => {
    requestIdleCallback(() => {
      findMaxHeight()
    })
  }

  const winResize = useCallback(() => {
    onEvent(id, ON_GRID_LAYOUT_CHANGE, { ...props, layout: generateLayout(colCount, rowCount, !isEdit) })
  }, [])

  useEffect(() => {
    window.addEventListener('resize', winResize)
    return () => {
      window.removeEventListener('resize', winResize)
    }
  }, [])

  return (
    <div
      ref={grid}
      className={style.gridLayout}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}>
      <GridLayout
        layout={layout}
        rowHeight={rowHeight}
        margin={[gutter, vGutter]}
        isDraggable={isEdit}
        containerPadding={[0, 0]}
        onLayoutChange={onLayoutChange}
        onResize={onResize}
        cols={colCount * 4}
      >
        {generateDOM()}
      </GridLayout>
      {isEdit && <Divider className={style.divider} plain dashed>
        <a className={style.add}><Icon /><span className={style.text} onClick={onAddCol}>添加网格列</span></a>
      </Divider>}
    </div>
  );
}

MMGridLayout.componentName = 'MMGridLayout'

export default memo(MMGridLayout)