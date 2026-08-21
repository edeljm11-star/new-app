import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { listSituations, type SituationItem } from './api'
import { groupSituations, titleOf, type SituationGroupKey } from './grouping'
import SituationBoard from './SituationBoard'
import styles from './SituationQuiz.module.css'

export default function SituationQuiz() {
  const [situations, setSituations] = useState<SituationItem[] | null>(null)
  const [openGroup, setOpenGroup] = useState<SituationGroupKey | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const { answers, recordAnswer } = usePersistedAnswers('situationAnswers')

  useEffect(() => {
    listSituations().then(setSituations)
  }, [])

  const groups = useMemo(() => (situations ? groupSituations(situations) : []), [situations])

  if (situations === null) {
    return (
      <Layout title="상황추론" accentColor="var(--color-pink)">
        <p className={styles.intro}>불러오는 중이에요...</p>
      </Layout>
    )
  }

  if (situations.length === 0) {
    return (
      <Layout title="상황추론" accentColor="var(--color-pink)">
        <p className={styles.intro}>아직 문제가 없어요. 관리자 화면에서 추가해주세요.</p>
      </Layout>
    )
  }

  const open = situations.find((s) => s.id === openId) ?? null

  if (open) {
    return (
      <SituationBoard
        situation={open}
        answer={answers[open.id]}
        onAnswer={(choiceIndex) => recordAnswer(open.id, choiceIndex)}
        onExit={() => setOpenId(null)}
      />
    )
  }

  return (
    <Layout title="상황추론" accentColor="var(--color-pink)">
      <p className={styles.intro}>풀고 싶은 문제를 골라보세요 ({situations.length}개)</p>
      <div className={styles.list}>
        {groups.map(({ def, items }) => {
          const isOpen = openGroup === def.key
          return (
            <div key={def.key} className={styles.categoryGroup}>
              <button
                type="button"
                className={styles.itemCard}
                aria-expanded={isOpen}
                onClick={() => setOpenGroup((g) => (g === def.key ? null : def.key))}
              >
                <span className={styles.itemEmoji}>{def.emoji}</span>
                <span className={styles.itemTitle}>{def.label}</span>
                <span className={styles.groupCount}>{items.length}개</span>
                <span className={[styles.chevron, isOpen ? styles.chevronOpen : ''].join(' ')}>▾</span>
              </button>
              {isOpen && (
                <div className={styles.subList}>
                  {items.map((item) => {
                    const answer = answers[item.id]
                    // Single-question items persist the picked choice index; multi-
                    // question items persist the final score out of questions.length.
                    const isSingle = item.questions.length === 1
                    const isCorrect =
                      answer !== undefined &&
                      (isSingle ? answer === item.questions[0].answerIndex : answer === item.questions.length)
                    const isWrong = answer !== undefined && !isCorrect
                    return (
                      <button key={item.id} type="button" className={styles.subItem} onClick={() => setOpenId(item.id)}>
                        <span className={styles.subEmoji}>{item.scene.items[0]?.emoji ?? '🤔'}</span>
                        <span className={styles.subTitle}>{titleOf(item)}</span>
                        {isCorrect && <span className={[styles.itemStatus, styles.statusCorrect].join(' ')}>✓</span>}
                        {isWrong && <span className={[styles.itemStatus, styles.statusWrong].join(' ')}>✗</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
