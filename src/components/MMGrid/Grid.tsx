import React, { ReactNode, forwardRef, Ref, useImperativeHandle, useRef } from 'react';
import { frGetter, autoRows, formatAreas } from './functions';

export interface IGridLayout {
  columns: number | string;
  rows?: number | string;
  gap?: string | number;
  columnGap?: string | number;
  areas?: string[];
  minRowHeight?: string;
  alignContent?: string;
  rowGap?: string | number;
  justifyContent?: string;
  flow?: string;
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
    display: 'grid', // 布局是grid布局
    height, // 设置容器高度
    gridAutoFlow: flow, // 设置容器内元素是从左往右（默认），还是从右往左
    gridAutoRows: autoRows(minRowHeight), // grid-auto-rows设置默认单元格高度
    gridTemplateRows: frGetter(rows), // 当传递一个数字时，它是指定行数的简写，平分高度，自适应。如果是例如100px，就是以这个数值为宽度
    gridTemplateColumns: frGetter(columns), // 当传递一个数字时，它是指定列数的简写，平分宽度，自适应。 默认值为 12，如果是例如100px，就是以这个数值为宽度
    columnGap, // 设置每个子元素之间列的间距
    rowGap, // 设置每个子元素之间行的间距
    gridTemplateAreas: formatAreas(areas), // 传递一个字符串数组，例如 [“a a”，“b c”]。 默认不提供。
    justifyContent, // 决定整个内容区域在容器里面的水平位置(左中右)
    alignContent, // 决定整个内容区域的垂直位置(上中下)
    ...style,
  };
  if (gap) mergedstyle.gap = gap; // 设置每个子元素之间的间距，默认8px

  useImperativeHandle(ref, () => gridRef.current, [])

  return (
    <div ref={gridRef} className={className} style={mergedstyle}>
      {children}
    </div>
  );
};

export default React.memo(forwardRef(GridLayout));