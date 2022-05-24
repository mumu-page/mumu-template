import { config, uuid } from "@/utils/utils"
import kebabCase from "lodash.kebabcase"
import { get } from 'lodash';

/** 删除组件 */
export const DELETE_COMPONENT = 'deleteComponent'
/** 获取配置 */
export const GET_CONFIG = 'getConfig'
/** 变更当前索引 */
export const CHANGE_INDEX = 'changeIndex'
export const CHANGE_PROPS = 'changeProps'
/** 对组件排序 */
export const SORT_COMPONENT = 'sortComponent'
/** 复制组件 */
export const COPY_COMPONENT = 'copyComponent'
/** 重置组件 */
export const RESET = 'reset'
/** 新增组件 */
export const ADD_COMPONENT = 'addComponent'
/** 组件ID前缀 */
export const COMPONENT_ELEMENT_ITEM_ID_PREFIX = 'mm-render-id-_component_'
/** 设置选中组件 */
export const SET_CURRENTCOMPONENT = 'setCurrentComponent'
/** 网格组件占位组件名 */
export const GRID_PLACEHOLDER = 'grid-placeholder'
/** 名称是这个的就是系统组件 */
export const GLOBAL_COMPONENT_TYPE_NAME = 'global-component'
/** 远程组件加载器名称 */
export const REMOTE_COMPONENT_LOADER_NAME = 'mm-remote-component-loader'
export const SET_HISTORY = 'setHistory'
export const SET_CONFIG = 'setConfig'

export const tempPageId = `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}`

export const tempPageSchema = {
  "type": "object",
  "properties": {
    "projectName": {
      "title": "页面名称",
      "type": "string"
    },
    "backgroundColor": {
      "title": "背景色",
      "type": "string",
      "format": "color"
    },
    "padding": {
      "title": "内边距",
      "type": "number",
      "widget": "slider"
    },
    "margin": {
      "title": "外边距",
      "type": "number",
      "widget": "slider"
    },
  }
}

export interface State {
  init: boolean,
  components: Component[]
  isEdit: boolean
  toolStyle: ElementStyle
  isBottom: boolean
  isTop: boolean
  page: Record<string, any>
}

export interface RefData {
  page: Record<string, any>
  isScroll: boolean,
  currentId: string,
  hoverCurrentId: string,
  componentsPND: Element | null | undefined
  resizeObserver: ResizeObserver | null
  mutationObserver: MutationObserver | null
  preTop: number;
  nextTop: number;
  isGridAdd: boolean;
  timer: NodeJS.Timeout | null;
  components: Component[]
  componentConfig: any[]
  remoteComponents: any[]
  currentComponent: any
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
  description: string
  props: { [key: string]: any }
  schema: any
  config?: any
  children?: Component[]
}

export const getElementPosition = (element: HTMLElement): ElementStyle => {
  const { width, height, left, top } = element?.getBoundingClientRect()
  const clientHeight = document.documentElement.clientHeight
  const clientWidth = document.documentElement.clientWidth
  const right = clientWidth - width - left
  const bottom = clientHeight - height - top
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

/**
 * 根据ID查找对应元素
 * @param id
 * @returns
 */
export function getNodeById(id: string): HTMLElement | null {
  return document.getElementById(id)
}

/**
 * 返回元素下一个元素ID
 * @param id 
 * @returns 
 */
export function getNextIdByNextNode(id: string) {
  const nextNode = getNodeById(id)?.nextElementSibling as HTMLElement
  return nextNode?.dataset.id || ""
}

/**
 * 返回元素上一个元素ID
 * @param id 
 * @returns 
 */
export function getPreIdByPreNode(id: string) {
  const preNode = getNodeById(id)?.previousElementSibling as HTMLElement
  return preNode?.dataset.id || ""
}

/**
 * 清除拖拽样式的类名，用于容器组件
 * @param element 
 * @param cls 
 */
export function clearDraggingCls(element: Element, cls: string) {
  Array.from(element?.parentElement?.children as any).forEach((item: any) => {
    item?.classList.remove(cls)
  })
}

export function generateChildren(children: any[]) {
  return Array.isArray(children) ? children.map((item) => ({
    ...item,
    id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}`,
    props: {
      ...item.props,
      children: item.props.children?.map((i: any) => ({ ...i, id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}` }))
    }
  })) : []
}

export const initialComponents = (children: React.ReactNode[]) => {
  return window.__mm_config__.components.length // window.__mm_config__.components 是服务端注入的用户选择组件
    ? window.__mm_config__.components.map((item: any, index: number) => ({ ...item, id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}_config` }))
    : children.map((c: any, index: number) => {
      const customName = c.type.componentName || c.type.type.componentName
      const name = kebabCase(customName);
      const { data, schema, snapshot, description, ...rest } = config.componentConfig.filter(config => config.name === name)?.[0] || {};
      const ret = {
        name,
        id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}_temp`,
        props: data,
        schema,
        snapshot,
        description,
      }
      if (ret.props.children) {
        ret.props.children = generateChildren(ret.props.children)
      }
      return ret
    })
}

export function getComponentById(userSelectComponents: Component[], id: string, isChild = false, parentIndex = -1, layer: (Component & { index: number })[] = []): {
  currentComponent: Component,
  index: number,
  isChild: boolean,
  parentIndex?: number,
  layer?: (Component & { index: number })[]
} | { index: -1, currentComponent: undefined, isChild: undefined, parentIndex: undefined, layer: undefined } {
  for (let index = 0; index < userSelectComponents.length; index++) {
    const element = userSelectComponents[index];
    if (element.props.children) {
      const ret = getComponentById(element.props.children, id, true, index, [...layer, { ...element, index }])
      // 在子项中找到了就返回就行
      if (ret.index !== -1) return ret
    }
    if (element.id === id) {
      return { currentComponent: element, index, isChild, parentIndex, layer: [...layer, { ...element, index }] }
    }

  }
  return { index: -1, currentComponent: undefined, isChild: undefined, parentIndex: undefined, layer: undefined }
}

export function getCurrentComponent({
  currentComponent,
  index,
  layer = []
}: {
  currentComponent?: Component
  index: number
  layer?: (Component & { index: number })[]
}) {
  // 没有组件选中，进行页面修改
  if (!currentComponent || index === -1) {
    return {
      currentComponentSchema: tempPageSchema,
      component: { id: tempPageId, props: { home: true } },
      type: '__page',
    }
  }
  // 当前修改项，用于 form-render
  return {
    currentComponentSchema: currentComponent.schema,
    component: currentComponent,
    layer: [
      // 插入首页
      {
        id: tempPageId,
        props: { home: true },
        schema: tempPageSchema
      },
      ...layer
    ]
  }
}