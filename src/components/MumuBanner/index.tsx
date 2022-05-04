import React from 'react'

interface MumuFormProps {
  src: string
}

function MumuBanner(props: MumuFormProps) {
  const { src } = props

  return (
    <img
      src={src}
      width="100%"
      alt="图片"
    />
  )
}

MumuBanner.componentName = 'MumuBanner'

export default MumuBanner