import React, { useCallback, useEffect, useRef } from 'react'
import { baseUrl, config, isEdit as _isEdit, isPreview, pageId, postMsgToParent, uuid, xhrGet, } from '@/utils/utils'
import { kebabCase } from 'lodash'
import { useImmer, } from "use-immer";
import Tool, { ToolRef } from './components/Tool';
import Shape, { ShapeRef } from './components/Shape';
import {
  State,
  RefData,
  ElementStyle,
  getScrollTop,
  isTopOrBottom,
  SORT_COMPONENT,
  getElementPosition,
  COPY_COMPONENT,
  DELETE_COMPONENT,
  clearDraggingCls,
  getNodeById,
  ADD_COMPONENT,
  getNextIdByNextNode,
  getPreIdByPreNode,
  SET_CURRENTCOMPONENT,
  COMPONENT_ELEMENT_ITEM_ID_PREFIX,
  generateChildren,
} from './utils';
import { renderComponents } from '@/components/mapping';
import style from "./index.module.less";

declare global {
  interface Window {
    __mm_config__: any
  }
}

interface MMTemplateProps {
  children: React.ReactNode[]
  init?: (a: any) => void
}

// ID是唯一的，应该保存ID
function MMTemplate(props: MMTemplateProps) {
  const initialComponents = () => {
    return window.__mm_config__.components.length // window.__mm_config__.components 是服务端注入的用户选择组件
      ? window.__mm_config__.components.map((item: any, index: number) => ({ ...item, id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${index}_config` }))
      : props.children.map((c: any, index: number) => {
        const customName = c.type.componentName || c.type.type.componentName
        const name = kebabCase(customName);
        const { data, schema, snapshot, description, ...rest } = config.componentConfig.filter(config => config.name === name)?.[0] || {};
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
  const initialState = {
    init: false,
    components: initialComponents(),
    componentConfig: config.componentConfig,
    remoteComponents: [],
    page: {
      projectName: '模板页面',
      schema: (config.pageConfig as any).schema,
      props: (window.__mm_config__.pageData && window.__mm_config__.pageData.props) || (config.pageConfig as any).data
    },
    isEdit: _isEdit,
    toolStyle: { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 },
    isBottom: false,
    spinning: true,
    isTop: false,
  }
  const [state, setState] = useImmer<State>(initialState)
  const sliderView = useRef<HTMLDivElement>(null)
  const editContainer = useRef<HTMLDivElement>(null)
  const staticData = useRef<RefData>({
    isScroll: false,
    currentId: initialState.components?.[0]?.id,
    hoverCurrentId: "",
    componentsPND: null,
    selectCb: () => {
    },
    resizeObserver: null,
    mutationObserver: null,
    preTop: 0,
    nextTop: 0,
    timer: null,
    isGridAdd: false
  })
  const shape = useRef<ShapeRef>(null)
  const tool = useRef<ToolRef>(null)

  /**
   * 设置组件
   * @param config
   */
  const setConfig = (config: { userSelectComponents: any; page: any; }) => {
    setState(draft => {
      draft.components = config.userSelectComponents
      draft.page = config.page
    })
  }

  const reset = ({ userSelectComponents, currentIndex, page }: any) => {
    setState(draft => {
      draft.components = userSelectComponents
      // draft.currentIndex = currentIndex
      draft.page = page
    })
    props?.init?.(page.props)
  }

  /**
   * 远程组件加载完成
   * @param param0 
   * @returns 
   */
  const onRemoteComponentLoad = ({ config, name, js, css, schema }: any) => {
    if (!state.isEdit) return;
    // name => [componentName]_v[版本号]
    const has = state.remoteComponents.some((item: any) => `${name}` === `${item.name}`);
    if (!has) {
      postMsgToParent({
        type: 'onRemoteComponentLoad', data: {
          config,
          js,
          css,
          schema,
          name,
          props: config.data,
        }
      })
    }
  }

  const setIframeComponents = ({ components, projectName }: any) => {
    setState(draft => {
      draft.components = components
      draft.page.projectName = projectName
    })
  }

  const handle = {
    setConfig,
    reset,
    setIframeComponents
  }

  const onMessage = useCallback((e: MessageEvent) => {
    // 不接受消息源来自于当前窗口的消息
    if (e.source === window || e.data === 'loaded') return
    (handle as any)?.[e.data.type]?.(e.data.data);
  }, [setState])

  /**
   * 响应编辑组件事件
   * @param id 
   * @param type 
   * @param data 
   */
  const onEvent = (id: string | undefined | null, type: string, data: any) => {
    // 排除会频繁触发的事件    
    // if ([ON_GRID_DRAG_OVER, ON_GRID_DRAG_LEAVE].includes(type)) return
    // postMsgToParent({ type: "onEvent", data: { id, type, data } })
  }

  const handleLineStyle = (e: any, node: HTMLElement) => {
    if (!shape.current) return
    const { top, bottom, width } = node.getBoundingClientRect()
    const type = isTopOrBottom(e, node)
    if (type === 'top') {
      shape.current?.setLineStyle(top - 2, width)
    } else {
      shape.current?.setLineStyle(bottom - 2, width)
    }
  }

  const setToolStyle = (position: ElementStyle, isTop: boolean, isBottom: boolean) => {
    if (!sliderView.current) return
    tool.current?.showTool()
    // 滚动时不更新工具组件，减少卡顿
    if (staticData.current.isScroll) return
    const children = Array.from(sliderView.current.children)
    const PIDs = children.map((nd: any) => nd.dataset.id)
    // 设置工具组件样式
    setState(draft => {
      if (PIDs.length === 1) {
        draft.isTop = true
        draft.isBottom = true
      } else {
        draft.isTop = isTop
        draft.isBottom = isBottom
      }
      draft.toolStyle = position
    })
  }

  const computedShapeAndToolStyle = (updateTool = false) => {
    if (!sliderView.current) return
    const children = Array.from(sliderView.current.children)
    if (!children.length) {
      shape.current?.hideShape()
      shape.current?.hideShapeHover()
      tool.current?.hideTool()
      staticData.current.currentId = ""
      return;
    }
    const currentDom = getNodeById(staticData.current.currentId)
    const hoverCurrentDom = getNodeById(staticData.current.hoverCurrentId)

    if (currentDom) {
      const position = getElementPosition(currentDom)
      shape.current?.setShapeStyle(position)
      if (updateTool) {
        const isTop = !!+(currentDom?.dataset.istop || 0)
        const isBottom = !!+(currentDom?.dataset.isbottom || 0)
        setToolStyle(position, isTop, isBottom)
      }
    }
    if (hoverCurrentDom) {
      const hoverPosition = getElementPosition(hoverCurrentDom)
      shape.current?.setShapeHoverStyle(hoverPosition)
    }
  }

  const handleEvent = (e: React.MouseEvent<HTMLDivElement, MouseEvent> | React.DragEvent<HTMLDivElement>, componentsPND: any, callback?: Function) => {
    const type = e.type // dragover mousemove click
    let node = e.target as HTMLElement | null;
    let currentId = node?.dataset.id || node?.parentElement?.dataset.id || '';
    if (!currentId) {
      // 拿到最近ID (向上查找元素，直到查到根元素或ID就结束)
      while (node?.tagName !== 'HTML') {
        currentId = node?.dataset.id || ''
        node = node?.parentNode as HTMLElement;
        if (currentId) break
      }
    }
    if (!node) return
    if (currentId.indexOf(COMPONENT_ELEMENT_ITEM_ID_PREFIX) < 0) return
    const elements = Array.from(componentsPND.children)
    const findComponents = (elements: any[], isChild = false) => {
      for (let index = 0; index < elements.length; index++) {
        const element = elements[index] as HTMLElement | null;
        const id = element?.dataset?.id
        // 对比当前鼠标位置的元素
        if (id === currentId && element) {
          if (type === 'dragover') {
            staticData.current.hoverCurrentId = currentId
            if (isChild) {
              clearDraggingCls(element, style.dragging)
              element?.classList.add(style.dragging)
            } else {
              handleLineStyle(e, element)
            }
          }
          if (type === 'dragleave') {
            if (isChild) {
              clearDraggingCls(element, style.dragging)
            }
          }
          if (type === 'mouseover') {
            staticData.current.hoverCurrentId = currentId
            !staticData.current.isScroll && computedShapeAndToolStyle()
          }
          if (type === 'click') {
            staticData.current.currentId = currentId
          }
          if (type === 'drop') {
            staticData.current.currentId = currentId
            if (isChild) {
              clearDraggingCls(element, style.dragging)
            }
            const data = (e as React.DragEvent<HTMLDivElement>)?.dataTransfer?.getData('text/plain')
            if (!data) return
            postMsgToParent({
              type: ADD_COMPONENT, data: {
                data: JSON.parse(data),
                nextId: getNextIdByNextNode(staticData.current.hoverCurrentId),
                currentId: staticData.current.currentId
              }
            })
            // 设置要插入的元素的占位辅助线位置
            if (isChild) return
            const type = isTopOrBottom(e, element)
            if (type === 'top') {
              staticData.current.currentId = getPreIdByPreNode(currentId)
            } else {
              staticData.current.currentId = getNextIdByNextNode(currentId)
            }
          }
          if (['click', 'drop'].includes(type)) {
            computedShapeAndToolStyle(type === 'click')
            // 布局容器暂不支持直接更改顺序等操作
            isChild && tool.current?.hideTool()
            postMsgToParent({ type: SET_CURRENTCOMPONENT, data: { currentId: staticData.current.currentId, isChild } })
          }
          callback?.(staticData.current.currentId);
          break
        }
        if (element?.children) findComponents(Array.from(element.children), true)
      }
    }
    findComponents(elements)
  }

  const onClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    handleEvent(e, sliderView.current, staticData.current.selectCb)
  }
  const onMouseOver: React.MouseEventHandler<HTMLDivElement> = (e) => {
    handleEvent(e, sliderView.current)
  }
  const onMouseLeave: React.MouseEventHandler<HTMLDivElement> = (e) => {
    shape.current?.hideShapeHover()
  }
  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    handleEvent(e, sliderView.current)
  }
  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    shape.current?.hideLine()
    handleEvent(e, sliderView.current)
  }
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    shape.current?.hideLine()
    handleEvent(e, sliderView.current)
  }
  const onResize = useCallback(() => {
    computedShapeAndToolStyle()
  }, [])

  const onScroll = useCallback(() => {
    staticData.current.isScroll = true
    clearTimeout(staticData.current.timer as any);
    computedShapeAndToolStyle()
    staticData.current.preTop = getScrollTop();
    staticData.current.timer = setTimeout(() => {
      staticData.current.nextTop = getScrollTop();
      if (staticData.current.nextTop === staticData.current.preTop) {
        // 滚动结束
        staticData.current.isScroll = false
      }
    }, 500);
  }, [])

  const onSortComponent = (type: 'up' | 'down') => {
    const nextId = type === 'up' ? getPreIdByPreNode(staticData.current.currentId) : getNextIdByNextNode(staticData.current.currentId)
    postMsgToParent({ type: SORT_COMPONENT, data: { currentId: staticData.current.currentId, nextId } })
    postMsgToParent({ type: SET_CURRENTCOMPONENT, data: { currentId: staticData.current.currentId } })
    computedShapeAndToolStyle()
  }

  const onCopyComponent = () => {
    postMsgToParent({
      type: COPY_COMPONENT, data: {
        nextId: getNextIdByNextNode(staticData.current.currentId),
        currentId: staticData.current.currentId
      }
    })
    postMsgToParent({ type: SET_CURRENTCOMPONENT, data: { currentId: staticData.current.currentId } })
    computedShapeAndToolStyle()
  }

  const onDeleteComponent = () => {
    postMsgToParent({
      type: DELETE_COMPONENT, data: {
        nextId: getNextIdByNextNode(staticData.current.currentId),
        currentId: staticData.current.currentId
      }
    })
    postMsgToParent({
      type: SET_CURRENTCOMPONENT, data: {
        currentId: staticData.current.currentId
      }
    })
    computedShapeAndToolStyle()
  }

  useEffect(() => {
    if (!state.isEdit) return;
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [])

  useEffect(() => {
    // 预览
    if (isPreview && baseUrl && pageId) {
      xhrGet(`${baseUrl}/project/preview?id=${pageId}`, (res) => {
        const data = res?.data?.[0]?.pageConfig
        setState(draft => {
          draft.components = data.userSelectComponents
          draft.page = data.pageData
          props?.init?.(state.page.props)
        })
      });
      return;
    }
    props?.init?.(state.page.props)
    postMsgToParent({
      type: "onLoad", data: {
        components: state.components,
      }
    })
  }, [])

  useEffect(() => {
    document.title = state.page.projectName
    window.addEventListener('resize', onResize)
    const resizeObserver = new ResizeObserver(() => computedShapeAndToolStyle())
    sliderView.current && resizeObserver.observe(sliderView.current)
    editContainer.current?.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('resize', onResize)
      editContainer.current?.addEventListener('scroll', onScroll)
      resizeObserver.disconnect()
    }
  }, [])

  if (!state.isEdit) return <>{renderComponents(state.components, onRemoteComponentLoad, onEvent, state.isEdit)}</>

  return (
    <div
      ref={editContainer}
      className={style.edit}>
      <div
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        ref={sliderView}
        className={style.sliderView}
      >
        {renderComponents(state.components, onRemoteComponentLoad, onEvent, state.isEdit)}
      </div>
      <Shape ref={shape} tool={
        <Tool
          ref={tool}
          isTop={state.isTop}
          isBottom={state.isBottom}
          height={state.toolStyle.height}
          onMove={(type) => onSortComponent(type)}
          onCopy={() => onCopyComponent()}
          onDel={() => onDeleteComponent()}
        />
      } />
    </div>
  )
}

export default MMTemplate