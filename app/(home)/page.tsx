import React from 'react'
import ImageAnnotator from './image-generate/page'
import LogoDesign from './logo-design/page'
import Campain from './campaign/page'


export default function Homepage() {
  return (
    <div>
      <LogoDesign />
      <ImageAnnotator />
      <Campain />

    </div>
  )
}
