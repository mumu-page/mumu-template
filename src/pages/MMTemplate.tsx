import React, { useCallback, useEffect, useRef } from 'react'
import { baseUrl, config, isEdit as _isEdit, isPreview, pageId, postMsgToParent, xhrGet, } from '@/utils/utils'
import { kebabCase } from 'lodash'
import { useImmer, } from "use-immer";
import { dragID, ON_GRID_DRAG_LEAVE, ON_GRID_DRAG_OVER, ON_GRID_DROP } from "@/components/MMGrid";
import Tool, { ToolRef } from './components/Tool';
import Shape, { ShapeRef } from './components/Shape';
import { ElementStyle, getElementPosition, getScrollTop, isTopOrBottom, RefData, SORT_COMPONENT, State, TEMPLATE_ELE_ID_PREFIX, SET_CURRENTCOMPONENT, COPY_COMPONENT, DELETE_COMPONENT, ADD_COMPONENT } from './utils';
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

function MMTemplate(props: MMTemplateProps) {
  const initialComponent = () => {
    return window.__mm_config__.components.length // window.__mm_config__.components 是服务端注入的用户选择组件
      ? window.__mm_config__.components.map((item: any, index: number) => ({ ...item, id: `${TEMPLATE_ELE_ID_PREFIX}${index}_config` }))
      : props.children.map((c: any, index: number) => {
        const name = kebabCase(c.type.componentName);
        const { data, schema, snapshot, description } = config.componentConfig.filter(config => config.name === name)?.[0] || {};
        return {
          name,
          id: `${TEMPLATE_ELE_ID_PREFIX}${index}_temp`,
          props: data,
          schema,
          snapshot,
          description
        };
      })
  }
  const initialState = {
    init: false,
    components: initialComponent(),
    componentConfig: config.componentConfig,
    currentIndex: 0,
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
    current: 0,
  }
  const [state, setState] = useImmer<State>(initialState)
  const sliderView = useRef<HTMLDivElement>(null)
  const editContainer = useRef<HTMLDivElement>(null)
  const staticData = useRef<RefData>({
    isScroll: false,
    current: 0,
    hoverCurrent: 0,
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
      draft.currentIndex = currentIndex
      draft.page = page
    })
    props?.init?.(page.props)
  }

  /**
   * 远程组件加载完成后需要生成 props
   * @param config
   * @param name
   * @param js
   * @param css
   * @param schema
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
    if (setState) {
      setState(draft => {
        draft.isEdit = true;
      })
    }
    (handle as any)?.[e.data.type]?.(e.data.data);
  }, [setState])

  /**
   * 响应编辑组件事件
   * @param id 
   * @param type 
   * @param data 
   */
  const onEvent = (id: string | undefined | null, type: string, data: any) => {
    if (type === ON_GRID_DRAG_OVER) {
      staticData.current.isGridAdd = true
      shape.current?.hideLine()
    }
    if (type === ON_GRID_DRAG_LEAVE) {
      staticData.current.isGridAdd = false
      shape.current?.showLine()
    }
    if (type === ON_GRID_DROP) {
      staticData.current.isGridAdd = true
      shape.current?.hideLine()
    }
    // 排除会频繁触发的事件    
    if ([ON_GRID_DRAG_OVER, ON_GRID_DRAG_LEAVE].includes(type)) return
    postMsgToParent({ type: "onEvent", data: { id, type, data } })
  }

  const handleDragEvent = (e: any, node: HTMLElement) => {
    if (!shape.current) return
    if (staticData.current.isGridAdd) return
    const parentElement = e.target.parentElement?.parentElement
    const id = parentElement?.dataset?.id
    if(id === dragID) return
    const { top, bottom, width } = node.getBoundingClientRect()
    const type = isTopOrBottom(e, node)
    if (type === 'top') {
      shape.current?.setLineStyle(top - 2, width)
    } else {
      staticData.current.hoverCurrent = staticData.current.hoverCurrent + 1
      shape.current?.setLineStyle(bottom - 2, width)
    }
  }

  const setToolStyle = (index: number, position: ElementStyle) => {
    if (!sliderView.current) return
    tool.current?.showTool()
    // 滚动时不更新工具组件，减少卡顿
    if (staticData.current.isScroll) return
    const childNodes = Array.from(sliderView.current.childNodes)
    const PIDs = childNodes.map((nd: any) => nd.dataset.id)
    // 设置工具组件样式
    setState(draft => {
      if (PIDs.length === 1) {
        draft.isTop = true
        draft.isBottom = true
      } else {
        draft.isTop = index === 0
        draft.isBottom = index === PIDs.length - 1
      }
      draft.toolStyle = position
    })
  }

  const computedShapeAndToolStyle = () => {
    if (!sliderView.current) return
    const childNodes = Array.from(sliderView.current.childNodes)
    if (!childNodes.length) {
      shape.current?.hideShape()
      shape.current?.hideShapeHover()
      tool.current?.hideTool()
      staticData.current.current = -1
      return;
    }
    const currentDom = childNodes[staticData.current.current] as HTMLElement
    const hoverCurrentDom = childNodes[staticData.current.hoverCurrent] as HTMLElement

    if (currentDom) {
      const position = getElementPosition(currentDom, editContainer.current, sliderView.current)
      setToolStyle(staticData.current.current, position)
      shape.current?.setShapeStyle(position)
      setState(draft => {
        draft.current = staticData.current.current;
      })
    }
    if (hoverCurrentDom) {
      const hoverPosition = getElementPosition(hoverCurrentDom, editContainer.current, sliderView.current)
      shape.current?.setShapeHoverStyle(hoverPosition)
    }
  }

  const handleEvent = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, componentsPND: any, callback?: Function) => {
    const type = e.type // dragover mousemove click
    let node = e.target as HTMLElement | null;
    if (!node) return
    while (node?.tagName !== 'HTML') {
      let currentId = node?.dataset.id || '';
      if (currentId.indexOf(TEMPLATE_ELE_ID_PREFIX) >= 0) {
        const PIDs = Array.from(componentsPND.childNodes).map((nd: any) => nd.dataset.id)
        PIDs.forEach((id, index) => {
          // 对比当前鼠标位置的元素
          if (id === currentId && node) {
            if (type === 'dragover') {
              staticData.current.hoverCurrent = index
              handleDragEvent(e, node)
            }
            if (type === 'mouseover') {
              staticData.current.hoverCurrent = index
              !staticData.current.isScroll && computedShapeAndToolStyle()
            }
            if (type === 'click') {
              staticData.current.current = index
            }
            if (type === 'drop') {
              const type = isTopOrBottom(e, node)
              if (type === 'top') {
                staticData.current.current = index !== 0 ? index - 1 : 0
              } else {
                staticData.current.current = index + 1
              }
            }
            if (['click', 'drop'].includes(type)) {
              computedShapeAndToolStyle()
              postMsgToParent({ type: 'setCurrentComponent', data: { currentIndex: index } })
            }
            callback?.(staticData.current.current);
          }
        })
        break;
      }
      node = node?.parentNode as HTMLElement;
    }
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
  }
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    if (staticData.current.isGridAdd) return
    shape.current?.hideLine()
    const data = e?.dataTransfer?.getData('text/plain')
    if (data != null) {
      postMsgToParent({ type: ADD_COMPONENT, data: { data: JSON.parse(data), index: staticData.current.hoverCurrent } })
    }
    // 重置样式
    staticData.current.current = staticData.current.hoverCurrent
    handleEvent(e, sliderView.current)
  }
  const onResize = useCallback(() => {
    computedShapeAndToolStyle()
  }, [])

  const onScroll = () => {
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
  }

  const onSortComponent = (type: 'up' | 'down') => {
    const op = type === 'up' ? -1 : 1
    const index = staticData.current.current
    const next = index + op < 0 ? 0 : index + op;
    postMsgToParent({ type: SORT_COMPONENT, data: { index, next } })
    staticData.current.current = next
    postMsgToParent({ type: SET_CURRENTCOMPONENT, data: { currentIndex: staticData.current.current } })
    computedShapeAndToolStyle()
  }

  const onCopyComponent = () => {
    postMsgToParent({ type: COPY_COMPONENT, data: { index: staticData.current.current } })
    staticData.current.current = staticData.current.current + 1
    postMsgToParent({ type: SET_CURRENTCOMPONENT, data: { currentIndex: staticData.current.current } })
    computedShapeAndToolStyle()
  }

  const onDeleteComponent = () => {
    postMsgToParent({ type: DELETE_COMPONENT, data: staticData.current.current })
    staticData.current.current = staticData.current.current - 1 < 0 ? 0 : staticData.current.current - 1
    computedShapeAndToolStyle()
    postMsgToParent({ type: SET_CURRENTCOMPONENT, data: { currentIndex: staticData.current.current } })
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
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  if (!state.isEdit) return <>{renderComponents(state.components, onRemoteComponentLoad, onEvent, state.isEdit)}</>

  return (
    <div
      ref={editContainer}
      onScroll={onScroll}
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