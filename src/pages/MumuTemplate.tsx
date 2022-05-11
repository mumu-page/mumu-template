import React, {useCallback, useEffect} from 'react'
import {baseUrl, config, isEdit as _isEdit, isPreview, pageId, postMsgToParent, xhrGet,} from '@/utils/utils'
import MumuRemoteComponentLoader from "./MumuRemoteComponentLoader";
import MumuBanner from "@/components/MumuBanner";
import MumuForm from "@/components/MumuForm";
import uniqueid from "lodash.uniqueid";
import upperFirst from "lodash.upperfirst";
import camelCase from "lodash.camelcase";
import kebabcase from "lodash.kebabcase";
import {useImmer,} from "use-immer";

declare global {
  interface Window {
    __mumu_config__: any
  }
}

interface MumuTemplateProps {
  children: React.ReactNode[]
  init?: (a: any) => void
}

const ComponentList = {
  MumuRemoteComponentLoader,
  MumuBanner,
  MumuForm,
}

interface State {
  init: boolean,
  loaded: boolean,
  components: any[]
  componentConfig: any[]
  currentIndex: number
  remoteComponents: any[]
  page: Record<string, any>
  isEdit: boolean
}

function MumuTemplate(props: MumuTemplateProps) {
  const initialState = {
    init: false,
    loaded: false,
    components: window.__mumu_config__.components.length // window.__mumu_config__.components 是服务端注入的用户选择组件
      ? window.__mumu_config__.components.map((item: any) => ({...item, id: `mumu-render-id-_component_${uniqueid()}`}))
      : props.children.map((c: any) => {
        const name = kebabcase(c.type.componentName);
        const {data} = config.componentConfig.filter(config => config.name === name)?.[0] || {};
        return {
          name,
          id: `mumu-render-id-_component_${uniqueid()}`,
          props: c.props || data
        };
      }),
    componentConfig: config.componentConfig,
    currentIndex: 0,
    remoteComponents: [],
    page: {
      schema: (config.pageConfig as any).schema,
      props: (window.__mumu_config__.pageData && window.__mumu_config__.pageData.props) || (config.pageConfig as any).data
    },
    isEdit: _isEdit
  }
  const [state, setState] = useImmer<State>(initialState)

  useEffect(() => {
    postMsgToParent({
      type: 'returnConfig',
      data: {
        components: state.componentConfig,
        userSelectComponents: state.components,
        currentIndex: state.currentIndex,
        remoteComponents: state.remoteComponents,
        page: state.page
      }
    });
  }, [state])

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
   * @param index
   * @param js
   * @param css
   * @param schema
   */
  const remoteComponentLoad = ({config, index, js, css, schema}: any) => {
    if (!state.isEdit) return;
    const has = state.remoteComponents.filter((item: any) => `${config.name}.${config.version}` === `${item.name}.${item.version}`)[0];
    if (!has) {
      setState(draft => {
        draft.remoteComponents.push({
          ...config, js, css, schema
        })
      })
    }
  }

  /**
   * 响应编辑器增加组件事件
   * @param data
   * @param index
   */
  const addComponent = ({data, index}: any) => {
    // global-component 是系统组件
    setState(draft => {
      draft.currentIndex = index ? index + 1 : index
    })
    if (data.type === 'global-component') {
      // 远程组件的props和data从组件包中动态获取，不在这里设置
      setState(draft => {
        draft.components.splice(index, 0, {
          name: 'mumu-remote-component-loader',
          id: `mumu-render-id-_component_${uniqueid()}`,
          props: data.data,
          config: {
            ...data,
            index: state.currentIndex
          }
        })
      })
    } else {
      setState(draft => {
        draft.components.splice(index, 0, {
          name: data.name,
          props: data.data,
          id: `mumu-render-id-_component_${uniqueid()}`
        })
      })
    }
  }

  /**
   * 修改 props
   * @param payload
   */
  const changeProps = (payload: { type: string; }) => {
    if (payload.type === '__page') {
      setState(draft => {
        draft.page = state.page
        props?.init?.(state.page.props)
      })
    } else {
      setState(draft => {
        draft.components[state.currentIndex]['props'] = payload
      })
    }
  }

  /**
   * 修改 index
   * @param index
   */
  const changeIndex = (index: any) => {
    setState(draft => {
      draft.currentIndex = index
    })
  }

  const deleteComponent = (index: number) => {
    setState(draft => {
      draft.components.splice(index, 1);
    })
    changeIndex(index - 1 < 0 ? 0 : index - 1);
  }

  const sortComponent = ({index, op}: any) => {
    const next = index + op;
    setState(draft => {
      draft.components[index] = state.components[next];
      draft.components[next] = state.components;
    })
    changeIndex(next);
  }

  const copyComponent = (index: number) => {
    const _components = state.components
    setState(draft => {
      draft.components.splice(index, 0, _components[index])
    })
    changeIndex(index + 1);
  }

  const handle = {
    setConfig,
    reset,
    remoteComponentLoad,
    addComponent,
    changeProps,
    changeIndex,
    deleteComponent,
    sortComponent,
    copyComponent,
  }

  useEffect(() => {
    // 预览
    if (isPreview && baseUrl && pageId) {
      xhrGet(`${baseUrl}/project/preview?id=${pageId}`, (res) => {
        const data = res?.data?.[0]?.pageConfig
        setState(draft => {
          draft.components = data.userSelectComponents
          draft.page = data.pageData
          draft.loaded = true
          props?.init?.(state.page.props)
        })
      });
      return;
    }
    setState(draft => {
      draft.loaded = true
    })
    props?.init?.(state.page.props)
  }, [])

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

  if (!state.loaded) return null
  return (
    <div id="slider-view" className={`slider-view ${state.isEdit ? 'edit' : ''}`}>
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
              onRemoteComponentLoad: remoteComponentLoad,
            })}
          </div>
        })
      }
    </div>
  )
}

export default MumuTemplate