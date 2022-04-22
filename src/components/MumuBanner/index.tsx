import React from 'react'

interface MumuFormProps {
  data: any
}

function MumuBanner(props: MumuFormProps) {
  const { data } = props
  
  return (
    <img
      src={data.src}
      width="100%"
      alt="图片"
    />
  )
}

export default MumuBanner