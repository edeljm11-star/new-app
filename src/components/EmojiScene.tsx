import styles from './EmojiScene.module.css'

export interface EmojiSceneItem {
  emoji: string
  top: string
  left: string
  size?: number
  rotate?: number
}

export interface EmojiSceneSpec {
  bg: string
  items: EmojiSceneItem[]
}

interface EmojiSceneProps {
  scene: EmojiSceneSpec
}

export default function EmojiScene({ scene }: EmojiSceneProps) {
  return (
    <div className={styles.frame} style={{ background: scene.bg }}>
      {scene.items.map((item, i) => (
        <span
          key={i}
          className={styles.item}
          style={{
            top: item.top,
            left: item.left,
            fontSize: item.size ?? 48,
            transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg)`,
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  )
}
