import React, { ReactElement, useRef, forwardRef, Ref, useImperativeHandle } from 'react'
import style from "./index.module.less";
import classNames from "classnames";

interface ShapeProps {
  tool?: ReactElement
}

interface ElementStyle {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface ShapeRef {
  setShapeStyle: (position: ElementStyle) => void;
  setShapeHoverStyle: (position: ElementStyle) => void;
  hideShape: () => void;
  hideShapeHover: () => void;
  hideLine: () => void;
  showLine: () => void;
  setLineStyle: (top: number, width: number) => void;
}

function Shape(props: ShapeProps, ref: Ref<ShapeRef>) {
  const { tool } = props
  const shape = useRef<HTMLDivElement>(null)
  const top = useRef<HTMLDivElement>(null)
  const right = useRef<HTMLDivElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const left = useRef<HTMLDivElement>(null)
  const shapeHover = useRef<HTMLDivElement>(null)
  const topHover = useRef<HTMLDivElement>(null)
  const rightHover = useRef<HTMLDivElement>(null)
  const bottomHover = useRef<HTMLDivElement>(null)
  const leftHover = useRef<HTMLDivElement>(null)
  const line = useRef<HTMLDivElement>(null)

  const setShapeStyle = (position: ElementStyle) => {
    if (!shape.current || !top.current || !right.current || !bottom.current || !left.current) return
    shape.current.style.display = 'block'
    top.current.style.top = `${position.top}px`
    top.current.style.left = `${position.left}px`
    top.current.style.width = `${position.width}px`
    right.current.style.right = `${position.right}px`
    right.current.style.top = `${position.top}px`
    right.current.style.height = `${position.height}px`
    bottom.current.style.left = `${position.left}px`
    bottom.current.style.bottom = `${position.bottom}px`
    bottom.current.style.width = `${position.width}px`
    left.current.style.left = `${position.left}px`
    left.current.style.top = `${position.top}px`
    left.current.style.height = `${position.height}px`
  }

  const setShapeHoverStyle = (position: ElementStyle) => {
    if (!shapeHover.current || !topHover.current || !rightHover.current || !bottomHover.current || !leftHover.current) return
    shapeHover.current.style.display = 'block'
    topHover.current.style.top = `${position.top}px`
    topHover.current.style.left = `${position.left}px`
    topHover.current.style.width = `${position.width}px`
    rightHover.current.style.right = `${position.right}px`
    rightHover.current.style.top = `${position.top}px`
    rightHover.current.style.height = `${position.height}px`
    bottomHover.current.style.left = `${position.left}px`
    bottomHover.current.style.bottom = `${position.bottom}px`
    bottomHover.current.style.width = `${position.width}px`
    leftHover.current.style.left = `${position.left}px`
    leftHover.current.style.top = `${position.top}px`
    leftHover.current.style.height = `${position.height}px`
  }

  const setLineStyle = (top: number, width: number) => {
    if(!line.current) return
    line.current.style.display = 'block'
    line.current.style.top = `${top}px`
    line.current.style.width = `${width}px`
  }

  const hideShape = () => {
    if (!shape.current) return
    shape.current.style.display = 'none'
  }

  const hideShapeHover = () => {
    if (!shapeHover.current) return
    shapeHover.current.style.display = 'none'
  }

  const hideLine = () => {
    if (!line.current) return
    line.current.style.display = 'none'
  }

  const showLine = () => {
    if (!line.current) return
    line.current.style.display = 'block'
  }

  useImperativeHandle(ref, () => ({
    setShapeStyle,
    setShapeHoverStyle,
    hideShape,
    hideShapeHover,
    hideLine,
    showLine,
    setLineStyle
  }), [])

  return (
    <>
      <div ref={shape} className={classNames(style.shape)}>
        <div ref={top} className={style.top}>{tool}</div>
        <div ref={right} className={style.right} />
        <div ref={bottom} className={style.bottom} />
        <div ref={left} className={style.left} />
      </div>
      <div ref={shapeHover} className={classNames(style.shapeHover)}>
        <div ref={topHover} className={style.top} />
        <div ref={rightHover} className={style.right} />
        <div ref={bottomHover} className={style.bottom} />
        <div ref={leftHover} className={style.left} />
      </div>
      <div ref={line} className={style.line} />
    </>
  )
}

export default forwardRef(Shape)