import type { ReactNode } from 'react'
import styles from './ChoiceButton.module.css'

export type ChoiceState = 'idle' | 'correct' | 'wrong' | 'dimmed'

interface ChoiceButtonProps {
  children: ReactNode
  onClick: () => void
  state?: ChoiceState
  disabled?: boolean
  large?: boolean
}

export default function ChoiceButton({
  children,
  onClick,
  state = 'idle',
  disabled,
  large,
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      className={[
        styles.choice,
        styles[state],
        large ? styles.large : '',
      ].join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
