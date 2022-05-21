import { baseComponents, baseRenderComponent } from "./baseMapping";
import MMGrid from "./MMGrid";

export const rootComponents = {
  ...baseComponents,
  MMGrid,
}

export interface Component {
  id: string
  name: string
  props: Record<string, string | number | object>
  schema: any
  config?: any
  children?: Component[]
}

export const renderComponents = (
  components: Component[],
  onRemoteComponentLoad: ({ config, name, js, css, schema }: any) => void,
  onEvent: (id: string | undefined | null, type: string, data?: any) => void,
  isEdit: boolean) => {
  return components.map((component, index) => baseRenderComponent({
    isTop: index === 0 ? 1 : 0,
    isBottom: index === components.length - 1 ? 1 : 0,
    component,
    mapping: rootComponents,
    onRemoteComponentLoad,
    onEvent,
    index,
    isEdit
  }))
}