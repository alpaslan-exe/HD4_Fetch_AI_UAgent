import { useState } from 'react'
import Paper from '@mui/material/Paper'

const InteractivePanel = ({
  component: Component = Paper,
  sx = {},
  hoverSx = {},
  lift = 6,
  highlightColor = 'rgba(59,130,246,0.35)',
  children,
  ...props
}) => {
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    isHovering: false,
    gradientX: '50%',
    gradientY: '50%',
  })

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const offsetY = event.clientY - rect.top

    const rotateX = Math.max(
      Math.min(((rect.height / 2 - offsetY) / rect.height) * 16, 12),
      -12,
    )
    const rotateY = Math.max(
      Math.min(((offsetX - rect.width / 2) / rect.width) * 16, 12),
      -12,
    )

    setTilt({
      rotateX,
      rotateY,
      isHovering: true,
      gradientX: `${(offsetX / rect.width) * 100}%`,
      gradientY: `${(offsetY / rect.height) * 100}%`,
    })
  }

  const handleMouseLeave = () =>
    setTilt({
      rotateX: 0,
      rotateY: 0,
      isHovering: false,
      gradientX: '50%',
      gradientY: '50%',
    })

  const {
    background: baseBackground,
    boxShadow: baseShadow,
    borderColor: baseBorderColor,
    transition: baseTransition,
    ...baseRest
  } = sx

  const {
    background: hoverBackground = baseBackground,
    boxShadow: hoverShadow = baseShadow,
    borderColor: hoverBorderColor = baseBorderColor,
    transition: hoverTransition,
    ...hoverRest
  } = hoverSx

  const highlightBackground = `radial-gradient(550px circle at ${tilt.gradientX} ${tilt.gradientY}, ${
    tilt.isHovering ? highlightColor : 'rgba(59,130,246,0)'
  }, transparent 70%)`

  const background =
    baseBackground || hoverBackground
      ? `${highlightBackground}, ${
          tilt.isHovering ? hoverBackground ?? baseBackground ?? 'transparent' : baseBackground ?? 'transparent'
        }`
      : undefined

  return (
    <Component
      {...props}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      sx={{
        ...baseRest,
        background,
        boxShadow: tilt.isHovering ? hoverShadow ?? baseShadow : baseShadow,
        borderColor: tilt.isHovering ? hoverBorderColor ?? baseBorderColor : baseBorderColor,
        transform: `perspective(1100px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translate3d(0, ${
          tilt.isHovering ? -lift : 0
        }px, 0)`,
        transition:
          hoverTransition ??
          baseTransition ??
          'transform 140ms ease, box-shadow 220ms ease, border-color 220ms ease, background 220ms ease',
        transformStyle: 'preserve-3d',
        ...(tilt.isHovering ? hoverRest : {}),
      }}
    >
      {children}
    </Component>
  )
}

export default InteractivePanel

