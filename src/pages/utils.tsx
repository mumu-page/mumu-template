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
export const GRID_PLACEHOLDER = 'grid_placeholder'
/** 名称是这个的就是系统组件 */
export const GLOBAL_COMPONENT_TYPE_NAME = 'global-component'
/** 远程组件加载器名称 */
export const REMOTE_COMPONENT_LOADER_NAME = 'mm-remote-component-loader'
export const SET_HISTORY = 'setHistory'
export const SET_CONFIG = 'setConfig'

export interface State {
  init: boolean,
  components: any[]
  componentConfig: any[]
  remoteComponents: any[]
  page: Record<string, any>
  isEdit: boolean
  toolStyle: ElementStyle
  isBottom: boolean
  isTop: boolean
  currentComponent: any
}

export interface RefData {
  isScroll: boolean,
  currentId: string,
  hoverCurrentId: string,
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
  Array.from(element?.parentElement?.parentElement?.children as any).forEach((item: any) => {
    item?.children?.[0].classList.remove(cls)
  })
}

export function generateChildren(layout: any[]) {
  return Array.isArray(layout) ? layout.map(() => ({
    name: GRID_PLACEHOLDER,
    id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}`,
    props: {},
    schema: {},
  })) : []
}

export const initialComponents = (children: React.ReactNode[]) => {
  return window.__mm_config__.components.length // window.__mm_config__.components 是服务端注入的用户选择组件
    ? window.__mm_config__.components.map((item: any, index: number) => ({ ...item, id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}_config` }))
    : children.map((c: any, index: number) => {
      const customName = c.type.componentName || c.type.type.componentName
      const name = kebabCase(customName);
      const { data, schema, snapshot, description, } = config.componentConfig.filter(config => config.name === name)?.[0] || {};
      return {
        name,
        id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}_temp`,
        props: data,
        schema,
        snapshot,
        description,
        children: generateChildren(data?.layout)
      }
    })
}

export function getComponentById(userSelectComponents: Component[], id: string, isChild = false, parentIndex = -1, layer: number[] = []): {
  element: Component,
  index: number,
  isChild: boolean,
  parentIndex?: number,
  layer?: number[],
} | { index: -1, element: undefined, isChild: undefined, parentIndex: undefined, layer: undefined } {
  for (let index = 0; index < userSelectComponents.length; index++) {
    const element = userSelectComponents[index];
    if (element.children) {
      const ret = getComponentById(element.children, id, true, index, [...layer, index])
      // 在子项中找到了就返回就行
      if (ret.index !== -1) return ret
    }
    if (element.id === id) {
      return { element, index, isChild, parentIndex, layer: [...layer, index] }
    }

  }
  return { index: -1, element: undefined, isChild: undefined, parentIndex: undefined, layer: undefined }
}

export function handleCurrentComponent({
  state,
  layer = [],
  index,
  isChild = false
}: {
  state: State,
  layer?: number[],
  index: number,
  isChild?: boolean | undefined
}) {
  // 没有组件选中，进行页面修改
  if (!isChild && index === -1) {
    return {
      ...state.currentComponent,
      currentComponentSchema: {},
      component: undefined,
      type: '__page',
    }
  }
  // 选中的组件
  let selectComponent: Component
  if (isChild) {
    let path = layer.toString().replace(/,/, '.children.')
    selectComponent = get(state.components, path);
  } else {
    selectComponent = state.components[index]
  }
  if (!selectComponent) return
  let currentComponentSchema: any = {}
  // 远程组件
  if (selectComponent.name === REMOTE_COMPONENT_LOADER_NAME) {
    const _component = state.remoteComponents?.filter((c: any) => `${c.name}` === `${selectComponent?.config?.name}`)?.[0]
    currentComponentSchema = _component?.schema || {};
  } else {
    const _component = state.components.filter((c: any) => c.name === selectComponent.name)?.[0]
    currentComponentSchema = _component?.schema;
  }
  // 当前修改项，用于 form-render
  return {
    ...state.currentComponent,
    currentComponentSchema,
    component: selectComponent,
  }
}