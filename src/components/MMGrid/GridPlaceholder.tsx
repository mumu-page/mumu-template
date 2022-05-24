import React from 'react'
import style from './index.module.less'

export default function GridPlaceholder({
    id,
    index,
    children
}: {
    id: string
    name?: string
    index: number,
    schema?: any
    children?: React.ReactElement
}) {
    return <div id={id} data-id={id} className={style.mmDroppablePlaceholder}>
        {children || `Column-${index + 1}`}
    </div>
}