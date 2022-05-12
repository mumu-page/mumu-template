import React, { useEffect, useState } from 'react'
import {Empty, Spin} from "antd";
import {WarningTwoTone} from "@ant-design/icons";
import style from './index.module.less'

interface MumuRemoteComponentLoaderProps {
  config: any;
  onRemoteComponentLoad: (p: any) => void
}

function MumuRemoteComponentLoader(props: MumuRemoteComponentLoaderProps) {
  const { config = {}, onRemoteComponentLoad, ...data } = props
  const [Component, setComponent] = useState<React.ReactElement | null>(null)
  const [loading, setLoading] = useState(false)

  const render = () => {
    // 动态添加组件，用于可视化编辑场景
    const {
      name,
      js,
      css,
    } = config; 
    let component = window[name];
    if (!component) {
      setLoading(true)
      const script = document.createElement('script');
      const link = document.createElement('link');
      script.src = js;
      link.href = css;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      document.body.appendChild(script);
      script.onload = () => {
        setLoading(false)
        const loader = (window[name] as any)
        onRemoteComponentLoad({
          schema: loader?.config.schema,
          config: loader?.config,
          name,
          js,
          css,
        })
        component = loader?.Component;
        setComponent(React.createElement(component as any, data))
      }
      script.onerror = () => {
        setLoading(false)
        setComponent(null)
      }
    } else {
      // 非动态化添加，用于构建场景
      const loader = (window[name] as any)
      onRemoteComponentLoad({
        schema: loader?.config.schema,
        name,
        config: loader?.config,
        js,
        css,
      })
      // 先有 props 再挂组件，不然 props 是 null 可能会有错
      requestIdleCallback(() => {
        component = (window[name] as any)?.Component;
        setComponent(React.createElement(component as any, data))
      })
    }
  }

  useEffect(() => {
    render()
  }, [])

  useEffect(() => {
    if (window[config.name]) {
      setComponent(React.createElement((window[config.name] as any).Component as any, data))
    }
  }, [config.name])

  if(loading) return <div className={style.loadingContainer}><Spin /></div>
  if(!Component) return <div className={style.emptyContainer}>
    <Empty className={style.empty} image={<WarningTwoTone style={{fontSize: 70}} />} description={`远程组件加载失败: ${config.name}`} />
  </div>

  return Component
}

export default MumuRemoteComponentLoader