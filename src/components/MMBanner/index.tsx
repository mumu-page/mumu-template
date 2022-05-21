import React from 'react'

interface MMBannerProps {
  src: string
}

function MMBanner(props: MMBannerProps) {
  const { src } = props

  return (
    <img
      src={src}
      width="100%"
      alt="图片"
      onDragStart={(e) => e.preventDefault()}
    />
  )
}

MMBanner.componentName = 'MMBanner'

export default MMBanner