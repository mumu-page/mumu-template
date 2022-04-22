import React, { useEffect, useState } from 'react'
import {
  postMsgToParent,
  isEdit as _isEdit,
  config,
  isPreview,
  baseUrl,
  pageId,
  xhrGet,
} from '@/utils/utils'
import MumuRemoteComponentsLoader from "./MumuRemoteComponentLoader";
import MumuBanner from "@/components/MumuBanner";
import MumuForm from "@/components/MumuForm";
import clonedeep from "lodash.clonedeep";
import uniqueid from "lodash.uniqueid";
import upperFirst from "lodash.upperfirst";
import camelCase from "lodash.camelcase";
import kebabcase from "lodash.kebabcase";

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
  MumuRemoteComponentsLoader,
  MumuBanner,
  MumuForm,
}
function MumuTemplate(props: MumuTemplateProps) {
  const [init, setInit] = useState(false) // 内嵌 iframe 初始化完成
  const [loaded, setLoaded] = useState(false) // 页面数据准备完成，为了预览功能
  // const [sortOption, setSortOption] = useState({
  //   group: {
  //     name: 'components',
  //     pull: true,
  //     put: true
  //   },
  //   sort: true,
  //   animation: 200
  // })
  const [components, setComponents] = useState(window.__mumu_config__.components.length
    ? window.__mumu_config__.components // window.__mumu_config__.components 是服务端注入的用户选择组件
    : props.children.map((c: any) => {
      const name = kebabcase(c.type.name);
      const { data } = config.componentConfig.filter(config => config.name === name)?.[0] || {};
      return {
        name,
        props: c.props || data
      };
    }))
  const [componentConfig] = useState(config.componentConfig)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remoteComponents, setRemoteComponents] = useState([])
  const [page, setPage] = useState({
    schema: (config.pageConfig as any).schema,
    props: (window.__mumu_config__.pageData && window.__mumu_config__.pageData.props) || (config.pageConfig as any).data
  })
  const [isEdit, setIsEdit] = useState(_isEdit)

  /**
   * 返回内容
   */
  const getConfig = () => {
    setInit(true)
    postMsgToParent({
      type: 'returnConfig',
      data: {
        components: componentConfig,
        userSelectComponents: components,
        currentIndex: currentIndex,
        remoteComponents: remoteComponents,
        page: page
      }
    });
  }

  /**
   * 设置组件
   * @param config 
   */
  const setConfig = (config: { userSelectComponents: any; page: any; }) => {
    setComponents(config.userSelectComponents)
    setPage(config.page)
    getConfig();
  }

  const reset = ({ userSelectComponents, currentIndex, page }: any) => {
    setComponents(userSelectComponents);
    setCurrentIndex(currentIndex)
    setPage(page)
    props?.init?.(page.props)
  }

  /**
   * 远程组件加载完成后需要生成 props
   * @param config
   * @param index
   */
  const remoteComponentLoad = ({ config, index, js, css }: any) => {
    if (!isEdit) return;
    const has = remoteComponents.filter((item: any) => `${config.name}.${config.version}` === `${item.name}.${item.version}`)[0];
    if (!has) {
      const _remoteComponents = clonedeep(remoteComponents) as any
      _remoteComponents.push({
        ...config, js, css
      });
      setRemoteComponents(_remoteComponents)
    }
    init && getConfig();
  }

  /**
   * 响应编辑器增加组件事件
   * @param data
   * @param index
   */
  const addComponent = ({ data, index }: any) => {
    // global-component 是系统组件
    setCurrentIndex(index ? index + 1 : index)
    if (data.type === 'global-component') {
      // 远程组件的props和data从组件包中动态获取，不在这里设置
      const _components = [...components.slice(0, currentIndex), {
        name: 'mumu-remote-components-loader',
        props: data.data,
        config: {
          ...data,
          index: currentIndex
        }
      }, ...components.slice(currentIndex, components.length)];
      setComponents(_components)
    } else {
      const _components = [...components.slice(0, currentIndex), {
        name: data.name,
        props: data.data
      }, ...components.slice(currentIndex, components.length)];
      setComponents(_components)
      getConfig();
    }
  }

  /**
   * 修改 props
   * @param payload
   */
  const changeProps = (payload: { type: string; }) => {
    if (payload.type === '__page') {
      const _page = clonedeep(page)
      setPage(_page)
      props?.init?.(page.props)
    } else {
      const _components = clonedeep(components)
      _components[currentIndex]['props'] = payload
      setComponents(_components)
    }
    getConfig();
  }

  /**
   * 修改 index
   * @param index
   */
  const changeIndex = (index: any) => {
    setCurrentIndex(index)
    getConfig();
  }

  const deleteComponent = (index: number) => {
    const _components = clonedeep(components)
    _components.splice(index, 1);
    setComponents(_components)
    changeIndex(index - 1 < 0 ? 0 : index - 1);
  }

  const sortComponent = ({ index, op }: any) => {
    const _components = clonedeep(components)
    const tmp = _components[index];
    const next = index + op;
    _components[index] = _components[next];
    _components[next] = tmp;
    setComponents(_components)
    changeIndex(next);
  }

  const copyComponent = (index: number) => {
    const _components = clonedeep(components)
    setComponents([
      ..._components.slice(0, index),
      clonedeep(_components[index]),
      ..._components.slice(index, _components.length)
    ])
    changeIndex(index + 1);
  }

  const handle = {
    getConfig,
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
        setComponents(res.result.components);
        setPage(res.result.pageData);
        props?.init?.(page.props)
        setLoaded(true)
      });
      return;
    }
    setLoaded(true)
    props?.init?.(page.props)
    if (!isEdit) return;
    window.addEventListener('message', (e) => {
      // 不接受消息源来自于当前窗口的消息
      if (e.source === window || e.data === 'loaded') {
        return;
      }
      setIsEdit(true);
      (handle as any)?.[e.data.type]?.(e.data.data);
    });
  }, [])

  if (!loaded) return null
  return (
    <div id="slider-view" className="slider-view">
      {/* 编辑容器 */}
      {
        components.map((component: { name: any; props: any; config: any; }) => {
          const Result = (ComponentList as any)[upperFirst(camelCase(component.name))]
          return <div
            data-layout={component.props && component.props._layout}
            id={`mumu-render-id-_component_${uniqueid()}`}
            key={uniqueid()}
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