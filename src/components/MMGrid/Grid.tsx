import React, { ReactNode, forwardRef, Ref, useImperativeHandle, useRef } from 'react';
import { frGetter, autoRows, formatAreas } from './functions';

export interface IGridLayout {
  /* 当传递一个数字时，它是指定列数的简写，平分宽度，自适应。 默认值为 12，如果是例如100px，就是以这个数值为宽度 */
  columns: number | string;
  /* 当传递一个数字时，它是指定行数的简写，平分高度，自适应。如果是例如100px，就是以这个数值为宽度 */
  rows?: number | string;
  /* 设置每个子元素之间的间距，默认8px */
  gap?: string | number;
  /* 设置每个子元素之间列的间距 */
  columnGap?: string | number;
  /* 传递一个字符串数组，例如 [“a a”，“b c”]。 默认不提供。 */
  areas?: string[];
  /* grid-auto-rows设置默认单元格高度 */
  minRowHeight?: string;
  /* 决定整个内容区域的垂直位置(上中下) */
  alignContent?: string;
  /* 设置每个子元素之间行的间距 */
  rowGap?: string | number;
  /* 决定整个内容区域在容器里面的水平位置(左中右) */
  justifyContent?: string;
  /* 设置容器内元素是从左往右（默认），还是从右往左 */
  flow?: string;
  /* 设置容器高度 */
  height?: string;
  style?: Record<string, any>;
  children: ReactNode;
  className?: any;
}

function GridLayout(props: IGridLayout, ref: Ref<HTMLDivElement | null>) {
  const {
    columns,
    gap = '8px',
    columnGap,
    areas,
    minRowHeight,
    alignContent,
    rowGap,
    rows,
    justifyContent,
    flow = 'row',
    children,
    height = 'auto',
    style = {},
    className
  } = props
  const gridRef = useRef<HTMLDivElement>(null)
  const mergedstyle: Record<string, any> = {
    display: 'grid',
    height,
    gridAutoFlow: flow,
    gridAutoRows: autoRows(minRowHeight),
    gridTemplateRows: frGetter(rows),
    gridTemplateColumns: frGetter(columns),
    columnGap,
    rowGap,
    gridTemplateAreas: formatAreas(areas),
    justifyContent,
    alignContent,
    ...style,
  };
  if (gap) mergedstyle.gap = gap;

  useImperativeHandle(ref, () => gridRef.current, [])

  return (
    <div ref={gridRef} className={className} style={mergedstyle}>
      {children}
    </div>
  );
};

export default React.memo(forwardRef(GridLayout));