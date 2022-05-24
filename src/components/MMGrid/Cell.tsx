import React, { ReactNode } from 'react';

export type ICell = {
  /* 使用 grid-column-end 属性设置网格元素跨越多少列，或者在哪一列结束。 */
  width?: number;
  /* grid-row-start 属性指定哪一行开始显示网格元素 */
  height?: number;
  /* grid-column-start 属性定义了网格元素从哪一列开始 */
  left?: number;
  /* grid-row-end 属性指定哪一行停止显示网格元素，或设置跨越多少行 */
  top?: number;
  isFlex?: boolean;
  area?: string;
  id?: string;
  dataId?: string
  middle?: boolean;
  style?: Record<string, any>;
  children?: ReactNode;
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
  const { width = 1, height = 1, isFlex = false, area, id, dataId, middle, style = {}, left, top, children, className, onClick } = props
  const mergedstyle: Record<string, any> = {
    minWidth: 0,
    gridColumnEnd: `span ${width}`,
    gridRowEnd: `span ${height}`,
    gridColumnStart: left,
    gridRowStart: top,
    ...middleStyle(middle),
    ...style,
  };
  if (area) mergedstyle.gridArea = area;
  if (isFlex) mergedstyle.display = 'flex';
  return (
    <div className={className} id={id} data-id={dataId} style={mergedstyle} onClick={onClick}>
      {children}
    </div>
  );
}

export default React.memo<ICell>(Cell);