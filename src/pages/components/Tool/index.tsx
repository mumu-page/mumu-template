import React, { forwardRef, Ref, useImperativeHandle, useRef } from "react";
import style from './index.module.less'
import { ArrowDownOutlined, ArrowUpOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button } from "antd";
import classNames from "classnames";

interface ElementStyle {
  onMove: (type: 'up' | 'down') => void
  onCopy: () => void
  onDel: () => void
  isTop: boolean
  isBottom: boolean
  height: number
}

export interface ToolRef {
  hideTool: () => void;
  showTool: () => void;
}

function Tool(props: ElementStyle, ref: Ref<ToolRef>) {
  const { onMove, onDel, onCopy, isTop, isBottom, height } = props
  const tool = useRef<HTMLDivElement>(null)
  let top = null

  if (isTop) {
    top = 3
  }
  if (isBottom) {
    top = -28
  }
  if (isTop && isBottom) {
    top = 3
  }

  function hideTool() {
    if (!tool.current) return
    tool.current.style.display = 'none'
  }

  function showTool() {
    if (!tool.current) return
    tool.current.style.display = 'flex'
  }

  useImperativeHandle(ref, () => ({
    hideTool,
    showTool
  }), [])

  return <div
    ref={tool}
    style={top ? { top } : {}}
    className={classNames({
      [style.tool]: true,
      [style.isTop]: isTop,
      [style.isBottom]: isBottom,
    })}>
    {!isTop && <Button
      type="primary"
      size={'small'}
      className={style.moveUp}
      icon={<ArrowUpOutlined />}
      onClick={() => onMove('up')}
    />}
    {!isBottom && <Button
      type="primary"
      className={style.moveDown}
      size={'small'}
      icon={<ArrowDownOutlined />}
      onClick={() => onMove('down')}
    />}
    <Button
      className={style.copy}
      type="primary"
      size={'small'}
      icon={<CopyOutlined />}
      onClick={() => onCopy()}
    />
    <Button
      className={style.delete}
      type="primary"
      danger
      size={'small'}
      icon={<DeleteOutlined />}
      onClick={() => onDel()}
    />
  </div>
}

export default forwardRef(Tool);