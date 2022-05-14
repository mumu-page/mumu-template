import React, {useCallback, useEffect} from 'react'
import {baseUrl, config, isEdit as _isEdit, isPreview, pageId, postMsgToParent, xhrGet,} from '@/utils/utils'
import MMRemoteComponentLoader from "./MMRemoteComponentLoader";
import MMBanner from "@/components/MMBanner";
import MMBarChart3D from "@/components/MMBarChart3D";
import {uniqueId, upperFirst, camelCase ,kebabCase} from 'lodash'
import {useImmer,} from "use-immer";

declare global {
  interface Window {
    __mm_config__: any
  }
}

interface MMTemplateProps {
  children: React.ReactNode[]
  init?: (a: any) => void
}

const ComponentList = {
  MMRemoteComponentLoader,
  MMBanner,
  MMBarChart3D,
}

interface State {
  init: boolean,
  components: any[]
  componentConfig: any[]
  currentIndex: number
  remoteComponents: any[]
  page: Record<string, any>
  isEdit: boolean
}

const containerElementId = 'slider-view'

function MMTemplate(props: MMTemplateProps) {
  const initialComponent = () => {
    return window.__mm_config__.components.length // window.__mm_config__.components 是服务端注入的用户选择组件
      ? window.__mm_config__.components.map((item: any) => ({...item, id: `mm-render-id-_component_${uniqueId()}`}))
      : props.children.map((c: any) => {
        const name = kebabCase(c.type.componentName);
        const {data} = config.componentConfig.filter(config => config.name === name)?.[0] || {};
        return {
          name,
          id: `mm-render-id-_component_${uniqueId()}`,
          props: c.props || data
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
      schema: (config.pageConfig as any).schema,
      props: (window.__mm_config__.pageData && window.__mm_config__.pageData.props) || (config.pageConfig as any).data
    },
    isEdit: _isEdit
  }
  const [state, setState] = useImmer<State>(initialState)

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

  const reset = ({userSelectComponents, currentIndex, page}: any) => {
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
  const onRemoteComponentLoad = ({config, name, js, css, schema}: any) => {
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

  const setIframeComponents = ({components}: any) => {
    setState(draft => {
      draft.components = components
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
        containerElementId,
        components: state.components,
      }
    })
  }, [])

  return (
    <div id={containerElementId} className={`slider-view ${state.isEdit ? 'edit' : ''}`}>
      {/* 编辑容器 */}
      {
        state.components.map((component: { name: any; props: any; config: any; id: any }) => {
          const Result = (ComponentList as any)[upperFirst(camelCase(component.name))]
          if (!Result) return null
          return <div
            data-layout={component.props && component.props._layout}
            id={component.id}
            key={component.id}
          >
            {React.createElement(Result, {
              ...(component.props || {}),
              config: component.config,
              onRemoteComponentLoad,
            })}
          </div>
        })
      }
    </div>
  )
}

export default MMTemplate