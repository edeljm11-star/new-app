import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import LoadError from '../../components/LoadError'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { listConversations, type ConversationItem } from './api'
import { groupConversations, titleOf, type ConversationGroupKey } from './grouping'
import ConversationBoard from './ConversationBoard'
import styles from './ConversationQuiz.module.css'

export default function ConversationQuiz() {
  const [conversations, setConversations] = useState<ConversationItem[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [openGroup, setOpenGroup] = useState<ConversationGroupKey | null>(null)
  const { openId } = useParams<{ openId?: string }>()
  const navigate = useNavigate()
  const { answers, recordAnswer } = usePersistedAnswers('conversationAnswers')

  function load() {
    setLoadError(false)
    setConversations(null)
    listConversations()
      .then(setConversations)
      .catch(() => setLoadError(true))
  }

  useEffect(() => {
    load()
  }, [])

  const groups = useMemo(() => (conversations ? groupConversations(conversations) : []), [conversations])

  if (loadError) {
    return (
      <Layout title="대화추론" accentColor="var(--color-primary)">
        <LoadError onRetry={load} />
      </Layout>
    )
  }

  if (conversations === null) {
    return (
      <Layout title="대화추론" accentColor="var(--color-primary)">
        <p className={styles.intro}>불러오는 중이에요...</p>
      </Layout>
    )
  }

  if (conversations.length === 0) {
    return (
      <Layout title="대화추론" accentColor="var(--color-primary)">
        <p className={styles.intro}>아직 대화가 없어요. 관리자 화면에서 추가해주세요.</p>
      </Layout>
    )
  }

  const open = conversations.find((c) => c.id === openId) ?? null

  if (open) {
    return (
      <ConversationBoard
        conversation={open}
        onAnswer={(choiceIndex) => recordAnswer(open.id, choiceIndex)}
        onExit={() => navigate('/conversation')}
      />
    )
  }

  return (
    <Layout title="대화추론" accentColor="var(--color-primary)">
      <p className={styles.intro}>풀고 싶은 대화를 골라보세요 ({conversations.length}개)</p>
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
                    const isCorrect = answer !== undefined && answer === item.answerIndex
                    const isWrong = answer !== undefined && answer !== item.answerIndex
                    return (
                      <button key={item.id} type="button" className={styles.subItem} onClick={() => navigate(`/conversation/${item.id}`)}>
                        <span className={styles.subEmoji}>💬</span>
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
