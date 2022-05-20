import React, { ReactNode } from 'react';

export type ICell = {
  width?: number;
  height?: number;
  isFlex?: boolean;
  area?: string;
  middle?: boolean;
  style?: Record<string, any>;
  left?: number;
  top?: number;
  children: ReactNode;
  className?: any;
  onClick?: React.MouseEventHandler<HTMLDivElement>
};

const middleStyle = (middle: boolean | undefined) => {
  if (middle) {
    return {
      display: 'inline-flex',
      flexFlow: 'column wrap',
      justifyContent: 'center',
      alignItems: 'center',
    };
  }
};

function Cell(props: ICell) {
  const { width = 1, height = 1, isFlex = false, area, middle, style = {}, left, top, children, className, onClick } = props
  const mergedstyle: Record<string, any> = {
    minWidth: 0,
    gridColumnEnd: `span ${width}`, // 使用 grid-column-end 属性设置网格元素跨越多少列，或者在哪一列结束。
    gridRowEnd: `span ${height}`, // grid-row-start 属性指定哪一行开始显示网格元素
    gridColumnStart: left, // grid-column-start 属性定义了网格元素从哪一列开始
    gridRowStart: top, // grid-row-end 属性指定哪一行停止显示网格元素，或设置跨越多少行
    ...middleStyle(middle),
    ...style,
  };
  if (area) mergedstyle.gridArea = area;
  if (isFlex) mergedstyle.display = 'flex';
  return (
    <div className={className} style={mergedstyle} onClick={onClick}>
      {children}
    </div>
  );
}

export default React.memo<ICell>(Cell);