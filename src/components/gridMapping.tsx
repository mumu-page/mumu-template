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
export const gridComponents = {
  MMRemoteComponentLoader,
  MMBanner,
  MMBarChart3D,
}

export const gridRenderComponent = (
  component: Component,
  mapping: any = {},
  onRemoteComponentLoad: ({ config, name, js, css, schema }: any) => void,
  onEvent: (id: string | undefined | null, type: string, data?: any) => void,
  isEdit?: boolean) => {
  const formatName = upperFirst(camelCase(component.name)).replace('Mm', 'MM')
  const Result = mapping[formatName]

  if (!Result) return null
  return <div
    data-layout={component.props && component.props._layout}
    data-id={component.id}
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