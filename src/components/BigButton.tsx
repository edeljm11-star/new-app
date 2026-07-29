import type { ReactNode } from 'react'
import styles from './BigButton.module.css'

interface BigButtonProps {
  children: ReactNode
  onClick: () => void
  color?: string
  disabled?: boolean
}

export default function BigButton({
  children,
  onClick,
  color,
  disabled,
}: BigButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      style={color ? { background: color } : undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
