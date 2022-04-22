import React, { useEffect, useState } from 'react'

interface MumuRemoteComponentLoaderProps {
  data: any;
  config: any;
  onRemoteComponentLoad: (p: any) => void
}

function MumuRemoteComponentLoader(props: MumuRemoteComponentLoaderProps) {
  const { data, config, onRemoteComponentLoad } = props
  const [Component, setComponent] = useState<React.ReactElement>(<></>)

  const render = () => {
    // 动态添加组件，用于可视化编辑场景
    const {
      name,
      js,
      css,
      index,
    } = config; 
    let component = window[name];
    if (!component) {
      // console.log('加载远程组件 ' + name)
      const script = document.createElement('script');
      const link = document.createElement('link');
      script.src = js;
      link.href = css;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      document.body.appendChild(script);
      script.onload = () => {
        onRemoteComponentLoad({
          ...window[name],
          js,
          css,
          index,
        })
        component = (window[name] as any)?.Component;
        setComponent(component as any)
      }
    } else {
      // 非动态化添加，用于构建场景
      onRemoteComponentLoad({
        ...window[name],
        js,
        css,
        index,
      })
      // 先有 props 再挂组件，不然 props 是 null 可能会有错
      requestIdleCallback(() => {
        component = (window[name] as any)?.Component;
        setComponent(component as any)
      })
    }
  }

  useEffect(() => {
    render()
  }, [])

  useEffect(() => {
    if (window[config.name]) {
      setComponent((window[config.name] as any).Component)
    }
  }, [config.name])
  return React.cloneElement(Component, data)
}

export default MumuRemoteComponentLoader