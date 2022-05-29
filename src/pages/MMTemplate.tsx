import React, { memo, useCallback, useEffect, useRef } from 'react'
import { baseUrl, config, isEdit as _isEdit, isPreview, pageId, postMsgToParent, uuid, xhrGet, } from '@/utils/utils'
import { useImmer, } from "use-immer";
import Tool, { ToolRef } from './components/Tool';
import Shape, { ShapeRef } from './components/Shape';
import {
  State,
  RefData,
  ElementStyle,
  getScrollTop,
  isTopOrBottom,
  getElementPosition,
  clearDraggingCls,
  getNodeById,
  getNextIdByNextNode,
  getPreIdByPreNode,
  COMPONENT_ELEMENT_ITEM_ID_PREFIX,
  initialComponents,
  GLOBAL_COMPONENT_TYPE_NAME,
  Component,
  REMOTE_COMPONENT_LOADER_NAME,
  getComponentById,
  getCurrentComponent,
  SET_CONFIG,
  tempPageId,
} from './utils';
import { renderComponents } from '@/components/mapping';
import { cloneDeep, set } from 'lodash';
import { message } from 'antd';
import style from "./index.module.less";

declare global {
  interface Window {
    __mm_config__: any
  }
}

interface MMTemplateProps {
  children: React.ReactNode[]
}

function MMTemplate(props: MMTemplateProps) {
  const [state, setState] = useImmer<State>({
    init: false,
    components: [],
    page: {
      projectName: '模板页面',
      schema: (config.pageConfig as any).schema,
      props: (window.__mm_config__.pageData && window.__mm_config__.pageData.props) || (config.pageConfig as any).data
    },
    isEdit: _isEdit,
    toolStyle: { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 },
    isBottom: false,
    isTop: false,
  })
  const sliderView = useRef<HTMLDivElement>(null)
  const editContainer = useRef<HTMLDivElement>(null)
  const staticData = useRef<RefData>({
    isScroll: false,
    currentId: "",
    hoverCurrentId: "",
    componentsPND: null,
    resizeObserver: null,
    mutationObserver: null,
    preTop: 0,
    nextTop: 0,
    timer: null,
    isGridAdd: false,
    components: [],
    componentConfig: config.componentConfig,
    remoteComponents: [],
    currentComponent: {},
    page: {
      projectName: '模板页面',
      schema: (config.pageConfig as any).schema,
      props: (window.__mm_config__.pageData && window.__mm_config__.pageData.props) || (config.pageConfig as any).data
    },
  })
  const shape = useRef<ShapeRef>(null)
  const tool = useRef<ToolRef>(null)

  const reset = ({ userSelectComponents, page }: any) => {
    staticData.current.page = page
    staticData.current.components = userSelectComponents
    setState(draft => {
      draft.components = userSelectComponents
      draft.page = page
    })
  }

  function addComponent({ data, currentId, dragId, type }: {
    data: any
    currentId: string
    dragId: string
    type: string
  }) {
    let newComponent: Component
    if (data.type === GLOBAL_COMPONENT_TYPE_NAME) {
      newComponent = {
        schema: data.schema,
        name: REMOTE_COMPONENT_LOADER_NAME,
        id: dragId,
        props: data.props,
        description: data.description,
        config: data
      }
    } else {
      newComponent = {
        name: data.name,
        props: data.props,
        id: dragId,
        description: data.description,
        schema: data.schema,
      }
    }
    const { index = 0, isChild, layer = [] } = getComponentById(staticData.current.components, currentId) || {}
    if (index === -1) return
    if (isChild) {
      const path = layer.map(item => item.index).toString().replace(/,/g, '.props.children.') + '.props.children.0'
      setState(draft => {
        set(draft.components, path, newComponent)
      })
      return
    }
    if (staticData.current.components.length) {
      setState(draft => {
        draft.components.splice(type === 'top' ? index : index + 1, 0, newComponent)
      })
    } else {
      setState(draft => {
        draft.components = [newComponent]
      })
    }
    onChangeParentState('新增组件')
  }

  function deleteComponent({ currentId, nextId }: { currentId: string, nextId: string }) {
    // 暂时不让全部删除
    if (staticData.current.components.length === 1) {
      message.info(`这是最后一个啦，不能再删啦～`).then()
      return
    }
    const { index } = getComponentById(staticData.current.components, currentId) || {}
    if (index === -1) return
    setState(draft => {
      draft.components.splice(index, 1);
    })
    staticData.current.currentId = nextId
    setCurrentComponent({ currentId: nextId })
    onChangeParentState('删除组件')
  }

  function sortComponent({ currentId, nextId }: { currentId: string, nextId: string }) {
    const { index } = getComponentById(staticData.current.components, currentId) || {}
    const { index: next } = getComponentById(staticData.current.components, nextId) || {}
    if (index === -1) return
    setState(draft => {
      const tem = staticData.current.components[next]
      draft.components.splice(next, 1, staticData.current.components[index])
      draft.components.splice(index, 1, tem)
    })
    staticData.current.currentId = nextId
    setCurrentComponent({ currentId })
    onChangeParentState('移动组件')
  }

  function copyComponent({ currentId, nextId }: { currentId: string, nextId: string }) {
    const { index } = getComponentById(staticData.current.components, currentId) || {}
    if (index === -1) return
    const newComponent = cloneDeep(staticData.current.components[index])
    newComponent.id = `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}`
    setState(draft => {
      draft.components.splice(index, 0, newComponent)
    })
    staticData.current.currentId = nextId
    setCurrentComponent({ currentId: nextId })
    onChangeParentState('复制组件')
  }

  const changeProps = ({ type, props }: { type: string, props: any }) => {
    if (type === '__page') {
      return
    }
    const { index, layer = [], isChild } = getComponentById(staticData.current.components, staticData.current.currentId) || {}
    if (index === -1) return
    // 生成id
    if (Array.isArray(props.children)) {
      props.children = props.children.map((item: any) => ({
        ...item,
        id: `${COMPONENT_ELEMENT_ITEM_ID_PREFIX}${uuid()}`,
      }))
    }
    const components = cloneDeep(staticData.current.components)
    // 支持子层的属性修改
    if (isChild) {
      const path = layer.map(item => item.index).toString().replace(/,/g, '.props.children.') + '.props'
      set(components, path, props)
    } else {
      components[index].props = props
    }
    staticData.current.components = components
    const { index: newIndex, currentComponent: newCurrentComponent, layer: newLayer } = getComponentById(staticData.current.components, staticData.current.currentId) || {}
    staticData.current.currentComponent = getCurrentComponent({ currentComponent: newCurrentComponent, index: newIndex, layer: newLayer })
    setState(draft => {
      draft.components = components
      onChangeParentState('更新属性')
    })
  }

  function setCurrentComponent({ currentId }: { currentId: string }) {
    staticData.current.currentId = currentId
    shape.current?.hideShapeHover()
    const { index, currentComponent, layer } = getComponentById(staticData.current.components, currentId) || {}
    staticData.current.currentComponent = getCurrentComponent({ currentComponent, index, layer })
    computedShapeAndToolStyle()
    onChangeParentState('选中组件')
  }

  const onChangeParentState = (actionType: string) => {
    postMsgToParent({
      type: SET_CONFIG, data: {
        components: staticData.current.components,
        currentId: staticData.current.currentId,
        currentComponent: staticData.current.currentComponent,
        componentConfig: staticData.current.componentConfig,
        history: {
          components: staticData.current.components,
          page: staticData.current.page,
          actionType: actionType,
        }
      }
    })
  }

  /**
   * 远程组件加载完成
   * @param param0 
   * @returns 
   */
  const onRemoteComponentLoad = ({ config, name, js, css, schema }: any) => {
    if (!state.isEdit) return;
    // name => [componentName]_v[版本号]
    const has = staticData.current.remoteComponents.some((item: any) => `${name}` === `${item.name}`);
    if (!has) {
      const data = {
        config,
        js,
        css,
        schema,
        name,
        props: config.data,
      }
      staticData.current.remoteComponents.push(data)
      postMsgToParent({ type: 'onRemoteComponentLoad', data })
    }
  }

  const setIframeComponents = ({ components, projectName }: any) => {
    staticData.current.page.projectName = projectName
    setState(draft => {
      draft.components = components
      draft.page.projectName = projectName
    })
  }

  // 接收父页面的事件
  const handle = {
    reset,
    setCurrentComponent,
    changeProps,
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
            computedShapeAndToolStyle(true)
            isChild && tool.current?.hideTool()
            setCurrentComponent({ currentId })
          }
          if (type === 'drop') {
            if (isChild) {
              clearDraggingCls(element, style.dragging)
              tool.current?.hideTool()
            }
            staticData.current.currentId = currentId
            const data = (e as React.DragEvent<HTMLDivElement>)?.dataTransfer?.getData('text/plain')
            if (!data) return
            const dragData = JSON.parse(data)
            addComponent({
              data: dragData,
              currentId,
              dragId: dragData.id,
              type: isTopOrBottom(e, element)
            })
            // 添加组件完成后，ID被替换成了拖拽过来的了
            staticData.current.currentId = dragData.id
            staticData.current.hoverCurrentId = dragData.id
            computedShapeAndToolStyle()
            requestIdleCallback(() => setCurrentComponent({ currentId: dragData.id }))
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
    handleEvent(e, sliderView.current)
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
    sortComponent({ currentId: staticData.current.currentId, nextId })
    computedShapeAndToolStyle()
  }

  const onCopyComponent = () => {
    copyComponent({
      nextId: getNextIdByNextNode(staticData.current.currentId),
      currentId: staticData.current.currentId
    })
    computedShapeAndToolStyle()
  }

  const onDeleteComponent = () => {
    deleteComponent({
      nextId: getNextIdByNextNode(staticData.current.currentId),
      currentId: staticData.current.currentId
    })
    computedShapeAndToolStyle()
  }

  const init = () => {
    // 设置模板组件默认列表
    const components = initialComponents(props.children)
    staticData.current.currentId = components?.[0]?.id
    staticData.current.components = components
    setState(draft => {
      // 确保只更新一次
      draft.components = components
      onChangeParentState('初始化')
      computedShapeAndToolStyle(true)
      setCurrentComponent({ currentId: staticData.current.currentId })
    })
  }

  const loadPreview = () => {
    if (isPreview && baseUrl && pageId) {
      xhrGet(`${baseUrl}/project/preview?id=${pageId}`, (res) => {
        const data = res?.data?.[0]?.pageConfig
        staticData.current.page = data.pageData
        document.title = staticData.current.page.projectName
        setState(draft => {
          draft.components = data.userSelectComponents
          draft.page = data.pageData
        })
      });
    }
  }

  useEffect(() => {
    init()
    loadPreview()
    window.addEventListener('resize', onResize)
    const resizeObserver = new ResizeObserver(() => computedShapeAndToolStyle())
    sliderView.current && resizeObserver.observe(sliderView.current)
    editContainer.current?.addEventListener('scroll', onScroll)
    state.isEdit && window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('resize', onResize)
      editContainer.current?.addEventListener('scroll', onScroll)
      resizeObserver.disconnect()
      state.isEdit && window.removeEventListener('message', onMessage)
    }
  }, [])

  useEffect(() => {
    staticData.current.components = state.components
  }, [state.components])

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
        id={tempPageId}
        data-id={tempPageId}
      >
        {renderComponents(state.components, onRemoteComponentLoad, onEvent, state.isEdit)}
      </div>
      <Shape ref={shape} />
      {/* <div className={style.debug}>{JSON.stringify(staticData.current.currentComponent)}</div> */}
    </div>
  )
}

export default memo(MMTemplate)