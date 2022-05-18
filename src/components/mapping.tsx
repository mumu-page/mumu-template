import { gridComponents, gridRenderComponent } from "./gridMapping";
import MMGrid from "./MMGrid";

export const rootComponents = {
  ...gridComponents,
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
  return components.map((component) => gridRenderComponent(component, rootComponents, onRemoteComponentLoad, onEvent, isEdit))
}