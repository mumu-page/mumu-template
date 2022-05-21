import camelCase from "lodash.camelcase"
import upperFirst from "lodash.upperfirst"
import React from "react"
import MMBanner from "./MMBanner"
import MMBarChart3D from "./MMBarChart3D"
import MMRemoteComponentLoader from "./MMRemoteComponentLoader"

export interface Component {
  id: string
  name: string
  props: Record<string, string | number | object>
  schema: any
  config?: any
  children?: Component[]
}

// 避免循环引用
export const baseComponents = {
  MMRemoteComponentLoader,
  MMBanner,
  MMBarChart3D,
}

interface Params {
  component: Component,
  mapping: any,
  onRemoteComponentLoad: ({ config, name, js, css, schema }: any) => void,
  onEvent: (id: string | undefined | null, type: string, data?: any) => void,
  index: number,
  isEdit?: boolean
  isChild?: boolean
  isBottom?: number
  isTop?: number
}
export const baseRenderComponent = (params: Params) => {
  const {
    component,
    mapping = {},
    onRemoteComponentLoad = () => { },
    onEvent = () => { },
    isTop,
    isBottom,
    isEdit
  } = params
  const formatName = upperFirst(camelCase(component.name)).replace('Mm', 'MM')
  const Result = mapping[formatName]

  if (!Result) return null
  return <div
    data-layout={component.props?._layout}
    data-id={component.id}
    data-isTop={isTop}
    data-isBottom={isBottom}
    id={component.id}
    key={component.id}
  >
    {React.createElement(
      Result,
      {
        ...(component.props || {}),
        id: component.id,
        config: component.config,
        onRemoteComponentLoad,
        onEvent,
        isEdit: isEdit,
        children: component.children
      },
    )}
  </div>
}