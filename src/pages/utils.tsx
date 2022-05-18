/** 删除组件 */
export const DELETE_COMPONENT = 'deleteComponent'
/** 获取配置 */
export const GET_CONFIG = 'getConfig'
/** 变更当前索引 */
export const CHANGE_INDEX = 'changeIndex'
/** 对组件排序 */
export const SORT_COMPONENT = 'sortComponent'
/** 复制组件 */
export const COPY_COMPONENT = 'copyComponent'
/** 重置组件 */
export const RESET = 'reset'
/** 新增组件 */
export const ADD_COMPONENT = 'addComponent'
/** 组件ID前缀 */
export const TEMPLATE_ELE_ID_PREFIX = 'mm-render-id-_component_'
/** 设置选中组件 */
export const SET_CURRENTCOMPONENT = 'setCurrentComponent'

export interface State {
  init: boolean,
  components: any[]
  componentConfig: any[]
  currentIndex: number
  remoteComponents: any[]
  page: Record<string, any>
  isEdit: boolean
  toolStyle: ElementStyle
  isBottom: boolean
  isTop: boolean
  current: number
}

export interface RefData {
  isScroll: boolean,
  current: number,
  hoverCurrent: number,
  componentsPND: Element | null | undefined
  selectCb?: (arg0: number) => void
  resizeObserver: ResizeObserver | null
  mutationObserver: MutationObserver | null
  preTop: number;
  nextTop: number;
  isGridAdd: boolean;
  timer: NodeJS.Timeout | null;
}

export interface ElementStyle {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface Component {
  id: string
  name: string
  props: Record<string, string | number | object>
  schema: any
  config?: any
  children?: Component[]
}

/**
 * 偏移值，如果滚动条存在则减去滚动条宽度
 * @returns 
 */
export const getDeviation = (editContainer: HTMLDivElement | null, sliderView: HTMLDivElement | null) => {
  let deviation = 0
  const containerHeight = editContainer?.getBoundingClientRect()?.height || 0
  const sliderHeight = sliderView?.getBoundingClientRect()?.height || 0
  if (Math.floor(sliderHeight) > Math.ceil(containerHeight)) deviation = 5
  return deviation
}

export const getElementPosition = (element: HTMLElement, editContainer: HTMLDivElement | null, sliderView: HTMLDivElement | null): ElementStyle => {
  const { width, height, left: _left, top: _top, right: _right } = element?.getBoundingClientRect()
  const clientHeight = document.documentElement.clientHeight
  const top = _top
  const left = _left
  const right = _right - width + getDeviation(editContainer, sliderView)
  const bottom = clientHeight - top - height
  return { left, right, top, bottom, width, height }
}

export const isTopOrBottom = (e: any, node: HTMLElement) => {
  const { clientY } = e
  const { height, top } = node.getBoundingClientRect()
  if ((clientY - top) < height / 2) {
    return 'top'
  } else {
    return 'bottom'
  }
}

export function getScrollTop() {
  return document.documentElement.scrollTop || document.body.scrollTop;
}